/*!
 *  @brief  Youtube動画更新情報(feed)アクセスクラス(background側)
 *  @note   youtube.comから動画更新情報(feed)をXMLで得る
 */
class BGVideosXmlAccessor extends BGMessageSender {
    //
    constructor() {
        super();
    }

    /*!
     *  @brief  Youtube動画情報をJSONで得る
     *  @param  username    ユーザ名
     *  @param  _fparam     未使用
     */
    request_videos_xml(username, _fparam) {
        const base_url = 'https://www.youtube.com/feeds/videos.xml?user=';
        this.mark_reply_queue(username);
        fetch(base_url + username, {
            method: "GET",
            credentials: "omit",
        })
        .then(response => {
            const STS_OK = 200;
            if (response.status == STS_OK) {
                return response.text();
            } else {
                const q = this.get_reply_queue(username);
                this.send_reply({command: MessageUtil.command_get_videos_xml(),
                                 result: "not_found",
                                 username: username}, q.tab_ids);
            }
            super.update_reply_queue(username,
                                     this.request_videos_xml.bind(this));
        })
        .then(text => {
            if (text != null) {
                const q = this.get_reply_queue(username);
                this.send_reply({command: MessageUtil.command_get_videos_xml(),
                                 result: "success",
                                 username: username,
                                 xml: text}, q.tab_ids);
            }
            super.update_reply_queue(username,
                                     this.request_videos_xml.bind(this));
        })
        .catch(err => {
            const q = this.get_reply_queue(username);
            // [error]fetchエラー
            this.send_reply({command: MessageUtil.command_get_videos_xml(),
                             result: "fail",
                             username: username}, q.tab_ids);
            super.update_reply_queue(username,
                                     this.request_videos_xml.bind(this));
        });
    }

    /*!
     *  @brief  onMessageコールバック
     *  @param  request
     *  @param  sender  送信者情報
     */
    on_message(request, sender) {
        if (!super.can_http_request(request.username, null, sender.tab.id)) {
            return;
        }
        this.request_videos_xml(request.username);
    }
}
