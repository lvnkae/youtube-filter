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
     *  @param  unique_name カスタムチャンネル名/ハンドル
     *  @param  _fparam     未使用
     */
    request_channel_html(unique_name, _fparam) {
        const base_url =
            'https://www.youtube.com/';
        this.mark_reply_queue(unique_name);
        fetch(base_url + unique_name + '/channels', {
            method: "GET",
            credentials: "omit",
        })
        .then(response => {
            const STS_OK = 200;
            if (response.status == STS_OK) {
                return response.text();
            } else {
                const q = this.get_reply_queue(unique_name);
                this.send_reply({command: MessageUtil.command_get_channel_html(),
                                 result: "not_found",
                                 unique_name: unique_name}, q.tag_ids);
            }
        })
        .then(text => {
            if (text != null) {
                const q = this.get_reply_queue(unique_name);
                this.send_reply({command: MessageUtil.command_get_channel_html(),
                                 result: "success",
                                 unique_name: unique_name,
                                 html: text}, q.tag_ids);
            }
            super.update_reply_queue(unique_name,
                                     this.request_channel_html.bind(this));
        })
        .catch(err => {
            const q = this.get_reply_queue(unique_name);
            // [error]fetchエラー
            this.send_reply({command: MessageUtil.command_get_channel_html(),
                             result: "fail",
                             unique_name: unique_name}, q.tag_ids);
            super.update_reply_queue(unique_name,
                                     this.request_channel_html.bind(this));
        });
    }

    /*!
     *  @brief  onMessageコールバック
     *  @param  request
     *  @param  sender  送信者情報
     */
    on_message(request, sender) {
        if (!super.can_http_request(request.unique_name, null, sender.tab.id)) {
            return;
        }
        this.request_channel_html(request.unique_name);
    }
}
