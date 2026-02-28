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
     *  @brief  リストIDにチャンネルコードを紐付ける
     *  @param  list_id     リストID
     *  @param  author_url  チャンネルURL
     */
    set_channel_code(list_id, author_url) {
        const channel_code = YoutubeUtil.cut_channel_id(author_url);
        if (YoutubeUtil.is_channel_url(author_url)) {
            this.set_channel_id(list_id, channel_code);
        } else if (YoutubeUtil.is_userpage_url(author_url)) {
            this.set_username(list_id, channel_code);
        } else if (YoutubeUtil.is_uniquepage_url(author_url)) {
            this.set_unique_name(list_id, channel_code);
        }
    }

    /*!
     *  @brief  リストIDだけ登録する
     *  @note   問い合わせはしない/endscreen用
     */
    set_list_id(list_id) {
        if (list_id in this.search_list_map) {
            return;
        } else {
            // 新規登録
            var obj = {};
            obj.busy = true;
            this.search_list_map[list_id] = obj;
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
        const playlist_test
            = new RegExp(`"playlistId":"${list_id}"`, '');
        // 検索結果からlist(lockup_view_model)を抽出
        const lockup_vm_test = /lockupMetadataViewModel":{/g;
        let lockup_vm_inx = [];
        let i = 0;
        while (lockup_vm_test.test(html)) {
            if (i > 0) {
                lockup_vm_inx[i-1].last = lockup_vm_test.lastIndex;
            }
            lockup_vm_inx.push({index:i, first:lockup_vm_test.lastIndex, last:-1});
            i++;
        }
        let target = -1;
        for (const inx of lockup_vm_inx) {
            playlist_test.lastIndex = inx.first;
            if (playlist_test.test(html)) {
                if (inx.last == -1 || playlist.lastIndex < ins.last) {
                    target = inx.index;
                    break;
                }
            }
        }
        if (target < 0) {
            return;
        }
        //
        const search_limit = lockup_vm_inx[target].last; // 検索範囲終端
        //
        const metadata_test = /"metadataParts":\[/g;
        metadata_test.lastIndex = lockup_vm_inx[target].first;
        if (!metadata_test.test(html)) {
            return;
        }
        if (search_limit != -1 && metadata_test.lastIndex > search_limit) {
            return;
        }
        //
        const channel_match = /"content":"([^"]+)"/g;
        channel_match.lastIndex = metadata_test.lastIndex;
        const match_channel = channel_match.exec(html);
        if (match_channel == null ||
            (search_limit != -1 && match_channel.lastIndex > search_limit)) {
            return;
        }
        const channel_name = match_channel[1];
        //
        const channel_id_match = /browseId":"(UC[a-zA-Z0-9_-]{22})"/g;
        channel_id_match.lastIndex = metadata_test.lastIndex;
        const match_channel_id = channel_id_match.exec(html);
        if (match_channel_id == null ||
            (search_limit != -1 && match_channel_id.lastIndex > search_limit)) {
            return;
        }
        const channel_id = match_channel_id[1];
        //
        const author_match = /canonicalBaseUrl":"\/(@|user\/|channel\/|c\/)([^"]+)"/g;
        author_match.lastIndex = metadata_test.lastIndex;
        const match_author = author_match.exec(html);
        if (match_author == null ||
            (search_limit != -1 && match_channel_id.lastIndex > search_limit)) {
            return;
        }
        const author_url = `/${match_author[1]}${match_author[2]}`;
        //
        post_func(list_id, author_url, channel_name, channel_id);
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
