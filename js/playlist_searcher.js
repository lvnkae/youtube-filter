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
     *  @brief  リストIDに独自チャンネル名を紐付ける
     *  @param  list_id     リストID
     *  @param  unique_name カスタムチャンネル名/ハンドル
     */
    set_unique_name(list_id, unique_name) {
        if (list_id in this.search_list_map) {
            let obj = this.search_list_map[list_id];
            obj.unique_name = unique_name;
        }
    }
    /*!
     *  @brief  リストIDにチャンネルコードを紐付ける
     *  @param  list_id     リストID
     *  @param  author_url  チャンネルURL
     */
    set_channel_code(list_id, author_url) {
        if (YoutubeUtil.is_channel_url(author_url)) {
            const channel_id = YoutubeUtil.cut_channel_id(author_url);
            this.set_channel_id(list_id, channel_id);
        } else {
            const author = YoutubeUtil.cut_channel_author(author_url);
            this.set_unique_name(list_id, author);
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
            let obj = {};
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
            let obj = {};
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
    /*!
     *  @brief  チャンネル情報取得完了通知
     *  @param  list_id         リストID
     *  @param  channel_info    チャンネル情報
     */
    tell_get_channel_info(list_id, channel_info) {
        if (list_id in this.search_list_map) {
            let obj = this.search_list_map[list_id];
            obj.channel_name = channel_info.name;
            obj.channel_id = channel_info.id;
            obj.busy = false;
            const author = channel_info.author;
            if (!author.startsWith("channel/")) {
                obj.unique_name = YoutubeUtil.cut_channel_author(author);
            }
        }
    }
}
