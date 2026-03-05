/*!
 *  @brief  Youtube動画情報アクセスクラス(background側)
 *  @note   youtube.comから動画の情報をJSONで得る
 */
class BGVideoJsonAccessor extends BGMessageSender {
    //
    constructor(callback) {
        super();
        this.callback = callback;
    }

    /*!
     *  @brief  Youtube動画情報をJSONで得る
     *  @param  video_id    動画ID
     *  @param  _fparam     未使用
     */
    request_video_json(video_id, _fparam) {
        const base_url =
            'https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=';
        this.mark_reply_queue(video_id);
        fetch(`${base_url}${video_id}&format=json`, {
            method: "GET",
            credentials: "omit",
        })
        .then(response => {
            const STS_OK = 200;
            const STS_UNAUTHORIZED = 401;
            if (response.status == STS_OK) {
                return response.json();
            } else if (response.status == STS_UNAUTHORIZED) {
                const q = this.get_reply_queue(video_id);
                this.callback({result: "unauthorized",
                               video_id: video_id,
                               tab_ids: q.tab_ids});
                return null;
            } else {
                const q = this.get_reply_queue(video_id);
                this.callback({result: "not_found",
                               video_id: video_id,
                               tab_ids: q.tab_ids});
            }
        })
        .then(json => {
            if (json != null) {
                const q = this.get_reply_queue(video_id);
                this.callback({result: "success",
                               video_id: video_id,
                               json: json,
                               tab_ids: q.tab_ids});
            }
            super.update_reply_queue(video_id,
                                     this.request_video_json.bind(this));
        })
        .catch(err => {
            const q = this.get_reply_queue(video_id);
            // [error]fetchエラー
            this.callback({result: "fail", video_id: video_id, tab_ids: q.tab_ids});
            super.update_reply_queue(video_id,
                                     this.request_video_json.bind(this));
        });
    }

    entry(tab_id, video_id) {
        if (super.can_http_request(video_id, tab_id)) {
            this.request_video_json(video_id);
        }
    }
}
