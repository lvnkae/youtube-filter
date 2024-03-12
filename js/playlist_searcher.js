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
     *  @brief  チャンネル情報取得
     *  @param  list_id リストID
     */
    get_channel_info(list_id) {
        if (list_id in this.search_list_map) {
            const obj = this.search_list_map[list_id];
            if (!obj.busy) {
                let ret = {};
                ret.id = obj.channel_id;
                ret.name = obj.channel_name;
                return ret;
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
     *  @brief  リストIDにチャンネル名を紐付ける
     */
    set_channel_name(list_id, channel) {
        if (list_id in this.search_list_map) {
            let obj = this.search_list_map[list_id];
            obj.channel_name = channel;
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
     *  @brief  リストIDに独自チャンネル名を紐付ける
     *  @param  list_id     リストID
     *  @param  unique_name カスタムチャンネル名/ハンドル
     */
    set_unique_name(list_id, unique_name) {
        if (list_id in this.search_list_map) {
            var obj = this.search_list_map[list_id];
            obj.unique_name = unique_name;
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
        let author_url = "";
        let channel_name = "";
        const key_script_top = 'var ytInit';
        const key_url = 'webCommandMetadata":{"url":"/';
        const len_key_url = key_url.length;
        const key_list_id = 'playlistRenderer":{"playlistId":"'
        const key_channel_name = 'longBylineText":{"runs":[{"text":"';
        const len_key_channel_name = key_channel_name.length;
        $(elem_script).each((inx, elem)=>{
            if (!elem.innerText.startsWith(key_script_top)) {
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
                    if (cut_top < 0) {
                        cut_top = elem.innerText.indexOf(key_url + '@', search_top);
                    }
                }
            }
            if (cut_top < 0) {
                return false; // 想定外のhtmlが来た
            }
            const cut_end = elem.innerText.indexOf('"', cut_top + len_key_url);
            author_url = elem.innerText.substring(cut_top + len_key_url -1, cut_end);
            //
            const cn_cut_top = elem.innerText.indexOf(key_channel_name, search_top);
            if (cn_cut_top > 0) {
                const cn_cut_end
                    = elem.innerText.indexOf('"', cn_cut_top + len_key_channel_name);
                channel_name
                    = elem.innerText.substring(cn_cut_top + len_key_channel_name,
                                               cn_cut_end);
            }
            return false;
        });
        post_func(list_id, author_url, channel_name);
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
                ret_v.push(list_id);
            }
        }
        return ret_v;
    }
    /*!
     *  @brief  チャンネルID取得完了通知
     *  @param  unique_name カスタムチャンネル名/ハンドル
     *  @param  channel_id  チャンネルID
     *  @return ret_v       受け取った動画ID群
     *  @note   カスタムチャンネル名/ハンドルをキーに取得された
     *  @note   チャンネルIDを受け取る
     */
    tell_get_channel_id_by_unique_channel(unique_name, channel_id) {
        let ret_v = [];
        for (const list_id in this.search_list_map) {
            let obj = this.search_list_map[list_id];
            if (obj.unique_name != null && obj.unique_name == unique_name) {
                obj.channel_id = channel_id;
                obj.busy = false;
                ret_v.push(list_id);
            }
        }
        return ret_v;
    }    
}
