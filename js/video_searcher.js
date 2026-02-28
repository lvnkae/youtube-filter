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
     *  @param  video_id    動画ID
     *  @param  html        検索結果(html)
     *  @param  post_func   後処理
     */
    tell_get_html(video_id, html, post_func) {
        const video_test = new RegExp(`videoRenderer":{"videoId":"${video_id}"`, 'g');
        if (!video_test.test(html)) {
            return;
        }
        const owner_test = /"ownerText":{/g;
        owner_test.lastIndex = video_test.lastIndex;
        if (!owner_test.test(html)) {
            return;
        }
        //
        const channel_match = /"text":"([^"]+)"/g;
        channel_match.lastIndex = owner_test.lastIndex;
        const match_channel = channel_match.exec(html);
        if (match_channel == null) {
            return;
        }
        const channel_name = match_channel[1];
        //
        const channel_id_match = /browseId":"(UC[a-zA-Z0-9_-]{22})"/g;
        channel_id_match.lastIndex = owner_test.lastIndex;
        const match_channel_id = channel_id_match.exec(html);
        if (match_channel_id == null) {
            return;
        }
        const channel_id = match_channel_id[1];
        //
        const author_match = /canonicalBaseUrl":"\/(@|user\/|channel\/|c\/)([^"]+)"/g;
        author_match.lastIndex = owner_test.lastIndex;
        const match_author = author_match.exec(html);
        if (match_author == null) {
            return;
        }
        const author_url = `/${match_author[1]}${match_author[2]}`;
        //
        post_func(video_id, author_url, channel_name, channel_id);
    }
}
