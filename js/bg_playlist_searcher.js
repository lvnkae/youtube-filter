/*!
 *  @brief  Youtubeプレイリスト検索クラス(background側)
 *  @note   youtube.comでプレイリスト検索し結果をHTMLで得る
 */
class BGPlaylistSearcher extends BGMessageSender {
    //
    constructor(callback) {
        super();
        this.callback = callback;
    }

    /*!
     *  @brief  Youtubeプレイリスト検索
     *  @param  list_id リストID
     */
    request_search_list(list_id) {
        const base_url = 'https://www.youtube.com/results?search_query=';
        this.mark_reply_queue(list_id);
        fetch(`${base_url}${list_id}&sp=EgIQAw%253D%253D`, {
            method: "GET",
            credentials: "omit",
        })
        .then(response => {
            const STS_OK = 200;
            if (response.status == STS_OK) {
                return response.text();
            } else {
                const q = this.get_reply_queue(list_id);
                this.callback({result:"not_found", list_id:list_id, tab_ids:q.tab_ids});
            }
        })
        .then(text => {
            if (text != null) {
                const q = this.get_reply_queue(list_id);
                this.callback({result: "success",
                               list_id: list_id,
                               html: text,
                               tab_ids: q.tab_ids});
            }
            super.update_reply_queue(list_id,
                                     this.request_search_list.bind(this));
        })
        .catch(err => {
            const q = this.get_reply_queue(list_id);
            // [error]fetchエラー
            this.callback({result:"fail", list_id:list_id, tab_ids:q.tab_ids});
            super.update_reply_queue(list_id,
                                     this.request_search_list.bind(this));
        });
    }

    entry(tab_id, list_id) {
        if (super.can_http_request(list_id, tab_id)) {
            this.request_search_list(list_id);
        }
    }
}
