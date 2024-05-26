/*!
 *  @brief  Youtubeプレイリスト検索クラス(background側)
 *  @note   youtube.comでプレイリスト検索し結果をHTMLで得る
 */
class BGPlaylistSearcher extends BGMessageSender {
    //
    constructor() {
        super();
    }

    /*!
     *  @brief  Youtubeプレイリスト検索
     *  @param  list_id リストID
     *  @param  fparam  未使用
     */
    request_search_list(list_id, fparam) {
        const base_url =
            'https://www.youtube.com/results?search_query=';
        this.mark_reply_queue(list_id);
        fetch(base_url + list_id + '&sp=EgIQAw%253D%253D', {
            method: "GET",
            credentials: "omit",
        })
        .then(response => {
            const STS_OK = 200;
            if (response.status == STS_OK) {
                return response.text();
            } else {
                const q = this.get_reply_queue(list_id);
                BGMessageSender.send_reply(
                    {command: MessageUtil.command_search_playlist(),
                     result: "not_found",
                     list_id: list_id}, q.tab_ids);
            }
        })
        .then(text => {
            if (text != null) {
                const q = this.get_reply_queue(list_id);
                BGMessageSender.send_reply(
                    {command: MessageUtil.command_search_playlist(),
                     result: "success",
                     list_id: list_id,
                     html: text}, q.tab_ids);
            }
            super.update_reply_queue(list_id,
                                     this.request_search_list.bind(this));
        })
        .catch(err => {
            const q = this.get_reply_queue(list_id);
            // [error]fetchエラー
            BGMessageSender.send_reply({command: MessageUtil.command_search_playlist(),
                                        result: "fail",
                                        list_id: list_id}, q.tab_ids);
            super.update_reply_queue(list_id,
                                     this.request_search_list.bind(this));
        });
    }

    /*!
     *  @brief  onMessageコールバック
     *  @param  request
     *  @param  sender  送信者情報
     */
    on_message(request, sender) {
        if (!super.can_http_request(request.list_id, null, sender.tab.id)) {
            return;
        }
        this.request_search_list(request.list_id);
    }
}
