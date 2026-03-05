/*!
 *  @brief  Youtube動画検索クラス(background側)
 *  @note   youtube.comで動画検索し結果をHTMLで得る
 */
class BGVideoSearcher extends BGMessageSender {
    //
    constructor(callback) {
        super();
        this.callback = callback;
    }

    /*!
     *  @brief  Youtube動画検索
     *  @param  video_id    動画ID
     *  @param  fparam      未使用
     */
    request_search_video(video_id, fparam) {
        const base_url = 'https://www.youtube.com/results?search_query="';
        this.mark_reply_queue(video_id);
        fetch(`${base_url}${video_id}&sp=EgIQAQ%253D%253D`, {
            method: "GET",
            credentials: "omit",
        })
        .then(response => {
            const STS_OK = 200;
            if (response.status == STS_OK) {
                return response.text();
            } else {
                const q = this.get_reply_queue(video_id);
                this.callback({result: "not_found",
                               video_id: video_id,
                               tab_ids: q.tab_ids});
            }
        })
        .then(text => {
            if (text != null) {
                const q = this.get_reply_queue(video_id);
                this.callback({result: "success",
                               video_id: video_id,
                               html: text,
                               tab_ids: q.tab_ids});
            }
            super.update_reply_queue(video_id,
                                     this.request_search_video.bind(this));
        })
        .catch(err => {
            const q = this.get_reply_queue(video_id);
            // [error]fetchエラー
            this.callback({result:"fail", video_id:video_id, tab_ids:q.tab_ids});
            super.update_reply_queue(video_id,
                                     this.request_search_video.bind(this));
        });
    }

    entry(tab_ids, video_id) {
        if (super.can_http_request2(video_id, tab_ids)) {
            this.request_search_video(video_id);
        }
    }    
}
