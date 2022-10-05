/*!
 *  @brief  Youtube動画検索クラス
 *  @note   動画IDで検索しchannel_codeを得る
 */
class VideoSearcher {

    constructor() {
        this.search_video_map = [];
    }

    /*!
     *  @brief  動画ID登録
     *  @param  video_id    動画ID
     */
    entry(video_id) {
        if (video_id in this.search_video_map) {
            return;
        } else {
            // 新規登録
            var obj = {};
            obj.busy = false;
            this.search_video_map[video_id] = obj;
        }
    }

    /*!
     *  @brief  動画検索発行
     *  @note   未処理の動画IDがあればリクエストを出す
     */
    kick() {
        for (const video_id in this.search_video_map) {
            const obj = this.search_video_map[video_id];
            if (!obj.busy) {
                obj.busy = true;
                // content_script内で他domainへアクセスするとCORBされるためbgへ移譲
                MessageUtil.send_message(
                    {command:MessageUtil.command_search_video(),
                     video_id: video_id});
            }
        }
    }

    /*!
     *  @brief  動画検索完了通知
     *  @param  video_id    カスタムチャンネル名
     *  @param  html        検索結果(html)
     *  @param  post_func   後処理
     */
    tell_get_html(video_id, html, post_func) {
        const parser = new DOMParser();
        const doc_html = parser.parseFromString(html, "text/html");
        const elem_script = doc_html.getElementsByTagName('script');
        if (elem_script.length == 0) {
            return;
        }
        let author_url = null;
        const search_word = 'webCommandMetadata":{"url":"/';
        const sw_len = search_word.length;
        $(elem_script).each((inx, elem)=>{
            if (elem.innerText.indexOf("var ytInit") != 0) {
                return true;
            }
            const search_top = elem.innerText.indexOf('watch?v=' + video_id);
            if (search_top < 0) {
                return false; // 想定外のhtmlが来た
            }
            let cut_top = elem.innerText.indexOf(search_word + 'channel/', search_top);
            if (cut_top < 0) {
                cut_top = elem.innerText.indexOf(search_word + 'user/', search_top);
                if (cut_top < 0) {
                    cut_top = elem.innerText.indexOf(search_word + 'c/', search_top);
                }
            }
            if (cut_top < 0) {
                return false; // 想定外のhtmlが来た
            }
            const cut_end = elem.innerText.indexOf('"', cut_top + sw_len);
            author_url = elem.innerText.substring(cut_top + sw_len -1, cut_end);
            return false;
        });
        post_func(video_id, author_url);
    }
}
