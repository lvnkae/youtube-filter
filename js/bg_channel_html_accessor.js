/*!
 *  @brief  Youtubeチャンネル情報アクセスクラス(background側)
 *  @note   youtube.comからチャンネル情報をHTMLで得る
 */
class BGChannelHTMLAccessor extends BGMessageSender {
    //
    constructor(callback) {
        super();
        this.callback = callback;
    }

    /*!
     *  @brief  Youtube動画情報をJSONで得る
     *  @param  unique_name カスタムチャンネル名/ハンドル
     */
    request_channel_html(unique_name) {
        const base_url = 'https://www.youtube.com/';
        super.mark_reply_queue(unique_name);
        fetch(`${base_url}${unique_name}/playlists`, {
            method: "GET",
            credentials: "omit",
        })
        .then(response => {
            const STS_OK = 200;
            if (response.status == STS_OK) {
                return response.text();
            } else {
                const q = this.get_reply_queue(unique_name);
                this.callback({result: "not_found",
                               author: unique_name,
                               tab_ids: q.tab_ids});
            }
        })
        .then(text => {
            if (text != null) {
                const q = this.get_reply_queue(unique_name);
                this.callback({result: "success",
                               author: unique_name,
                               html: text,
                               video_ids: q.video_ids,
                               tab_ids: q.tab_ids});
            }
            super.update_reply_queue(unique_name,
                                     this.request_channel_html.bind(this));
        })
        .catch(err => {
            const q = this.get_reply_queue(unique_name);
            // [error]fetchエラー
            this.callback({result:"fail", author:unique_name, tab_ids:q.tab_ids});
            super.update_reply_queue(unique_name,
                                     this.request_channel_html.bind(this));
        });
    }

    entry(tab_ids, author, video_id) {
        if (super.can_http_request2(author, tab_ids)) {
            const q = this.get_reply_queue(author);
            BGMessageSender.set_video_id(q, video_id);
            this.request_channel_html(author);
        } else {
            const q = this.get_reply_queue(author);
            if (q != null) {
                BGMessageSender.set_video_id(q, video_id);
            } else {
                const wq = this.get_wait_queue(author);
                if (wq != null) {
                    BGMessageSender.set_video_id(wq, video_id);
                }
            }
        }
    }
}
