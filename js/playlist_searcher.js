/*!
 *  @brief  Youtubeプレイリスト検索クラス
 *  @note   listIDで検索しchannel_codeを得る
 */
class PlaylistSearcher {

    constructor() {
        this.search_list_map = [];
    }

    /*!
     *  @brief  チャンネルID取得
     *  @param  list_id リストID
     */
    get_channel_id(list_id) {
        if (list_id in this.search_list_map) {
            const obj = this.search_list_map[list_id];
            if (!obj.busy) {
                return obj.channel_id;
            }
        }
        return null;
    }

    /*!
     *  @brief  リストIDにチャンネルIDを紐付ける
     *  @param  list_id     リストID
     *  @param  channel_id  チャンネルID
     */
    set_channel_id(list_id, channel_id) {
        if (list_id in this.search_list_map) {
            let obj = this.search_list_map[list_id];
            obj.channel_id = channel_id;
            obj.busy = false;
        }
    }
    /*!
     *  @brief  リストIDにユーザ名を紐付ける
     *  @param  list_id     リストid
     *  @param  username    チャンネルユーザ名
     */
    set_username(list_id, username) {
        if (list_id in this.search_list_map) {
            var obj = this.search_list_map[list_id];
            obj.username = username;
        }
    }
    /*!
     *  @brief  リストIDにカスタムチャンネル名を紐付ける
     *  @param  list_id     リストID
     *  @param  custom_name カスタムチャンネル名
     */
    set_custom_name(list_id, custom_name) {
        if (list_id in this.search_list_map) {
            var obj = this.search_list_map[list_id];
            obj.custom_name = custom_name;
        }
    }    

    /*!
     *  @brief  リストID登録
     *  @param  list_id リストID
     */
    entry(list_id) {
        if (list_id in this.search_list_map) {
            return;
        } else {
            // 新規登録
            var obj = {};
            obj.busy = false;
            this.search_list_map[list_id] = obj;
        }
    }

    /*!
     *  @brief  動画検索発行
     *  @note   未処理の動画IDがあればリクエストを出す
     */
    kick() {
        for (const list_id in this.search_list_map) {
            const obj = this.search_list_map[list_id];
            if (!obj.busy && obj.channel_id == null) {
                obj.busy = true;
                // content_script内で他domainへアクセスするとCORBされるためbgへ移譲
                MessageUtil.send_message(
                    {command:MessageUtil.command_search_playlist(),
                     list_id: list_id});
            }
        }
    }

    /*!
     *  @brief  プレイリスト検索結果解析
     *  @param  list_id     リストID
     *  @param  html        検索結果(html)
     *  @param  post_func   後処理
     */
    static parse_html(list_id, html, post_func) {
        const parser = new DOMParser();
        const doc_html = parser.parseFromString(html, "text/html");
        const elem_script = doc_html.getElementsByTagName('script');
        if (elem_script.length == 0) {
            return;
        }
        let author_url = null;
        const key_script_top = 'var ytInit';
        const key_url = 'webCommandMetadata":{"url":"/';
        const len_key_url = key_url.length;
        const key_list_id = 'playlistRenderer":{"playlistId":"'
        $(elem_script).each((inx, elem)=>{
            if (elem.innerText.indexOf(key_script_top) != 0) {
                return true;
            }
            const search_top = elem.innerText.indexOf(key_list_id + list_id);
            if (search_top < 0) {
                return false; // 想定外のhtmlが来た
            }
            let cut_top = elem.innerText.indexOf(key_url + 'channel/', search_top);
            if (cut_top < 0) {
                cut_top = elem.innerText.indexOf(key_url + 'user/', search_top);
                if (cut_top < 0) {
                    cut_top = elem.innerText.indexOf(key_url + 'c/', search_top);
                }
            }
            if (cut_top < 0) {
                return false; // 想定外のhtmlが来た
            }
            const cut_end = elem.innerText.indexOf('"', cut_top + len_key_url);
            author_url = elem.innerText.substring(cut_top + len_key_url -1, cut_end);
            return false;
        });
        post_func(list_id, author_url);
    }

    /*!
     *  @brief  チャンネルID取得完了通知
     *  @param  username    チャンネルユーザ名
     *  @param  channel_id  チャンネルID
     *  @return ret_v       受け取った動画ID群
     *  @note   ユーザ名をキーに取得されたチャンネルIDを受け取る
     */
    tell_get_channel_id(username, channel_id) {
        let ret_v = [];
        for (const list_id in this.search_list_map) {
            let obj = this.search_list_map[list_id];
            if (obj.username != null && obj.username == username) {
                obj.channel_id = channel_id;
                obj.busy = false;
                ret_v.push(obj.list_id);
            }
        }
        return ret_v;
    }
    /*!
     *  @brief  チャンネルID取得完了通知
     *  @param  custom_name カスタムチャンネル名
     *  @param  channel_id  チャンネルID
     *  @return ret_v       受け取った動画ID群
     *  @note   カスタムチャンネル名をキーに取得された
     *  @note   チャンネルIDを受け取る
     */
    tell_get_channel_id_by_custom_channel(custom_name, channel_id) {
        let ret_v = [];
        for (const list_id in this.search_list_map) {
            let obj = this.search_list_map[list_id];
            if (obj.custom_name != null && obj.custom_name == custom_name) {
                obj.channel_id = channel_id;
                obj.busy = false;
                ret_v.push(obj.list_id);
            }
        }
        return ret_v;
    }    
}
