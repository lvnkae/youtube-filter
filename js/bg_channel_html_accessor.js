/*!
 *  @brief  Youtubeチャンネル情報アクセスクラス(background側)
 *  @note   youtube.comからチャンネル情報をHTMLで得る
 */
class BGChannelHTMLAccessor extends BGMessageSender {
    //
    constructor() {
        super();
    }

    /*!
     *  @brief  Youtube動画情報をJSONで得る
     *  @param  custom_name カスタムチャンネル名
     *  @param  _fparam     未使用
     */
    request_channel_html(custom_name, _fparam) {
        const base_url =
            'https://www.youtube.com/c/';
        this.mark_reply_queue(custom_name);
        fetch(base_url + custom_name + '/channels', {
            method: "GET",
            credentials: "omit",
        })
        .then(response => {
            const STS_OK = 200;
            if (response.status == STS_OK) {
                return response.text();
            } else {
                const q = this.get_reply_queue(custom_name);
                this.send_reply({command: MessageUtil.command_get_channel_html(),
                                 result: "not_found",
                                 custom_name: custom_name}, q.tag_ids);
            }
        })
        .then(text => {
            if (text != null) {
                const q = this.get_reply_queue(custom_name);
                this.send_reply({command: MessageUtil.command_get_channel_html(),
                                 result: "success",
                                 custom_name: custom_name,
                                 html: text}, q.tag_ids);
            }
            super.update_reply_queue(custom_name,
                                     this.request_channel_html.bind(this));
        })
        .catch(err => {
            const q = this.get_reply_queue(video_id);
            // [error]fetchエラー
            this.send_reply({command: MessageUtil.command_get_channel_html(),
                             result: "fail",
                             custom_name: custom_name}, q.tag_ids);
            super.update_reply_queue(custom_name,
                                     this.request_channel_html.bind(this));
        });
    }

    /*!
     *  @brief  onMessageコールバック
     *  @param  request
     *  @param  sender  送信者情報
     */
    on_message(request, sender) {
        if (!super.can_http_request(request.custom_name, null, sender.tab.id)) {
            return;
        }
        this.request_channel_html(request.custom_name);
    }
}
