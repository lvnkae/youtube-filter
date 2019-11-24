/*!
 *  @brief  Youtube動画author情報アクセスクラス
 *  @note   usernameとchannelIDの紐付け管理
 */
class AuthorInfoAccessor {

    constructor() {
        this.author_info_map = [];     
    }

    /*!
     *  @brief  ユーザ名からチャンネルIDを得る
     *  @param  username    ユーザ名
     */
    get_channel_id(username) {
        if (username in this.author_info_map) {
            return this.author_info_map[username].channel_id;
        }
        return null;
    }

    /*!
     *  @brief  ユーザ名登録
     *  @param  username    ユーザ名
     */
    entry(username) {
        if (username in this.author_info_map) {
            return;
        } else {
            // 新規登録
            var obj = {};
            obj.username = username;
            obj.busy = false;
            this.author_info_map[username] = obj;
        }
    }

    /*!
     *  @brief  動画author情報取得発行
     *  @note   未処理のユーザ名があればリクエストを出す
     */
    kick() {
        for (const username in this.author_info_map) {
            const obj = this.author_info_map[username];
            if (!obj.busy && obj.channel_id == null) {
                obj.busy = true;
                // content_script内で他domainへアクセスするとCORBされるためbgへ移譲
                MessageUtil.send_message(
                    {command:MessageUtil.command_get_videos_xml(),
                        username: username});
            }
        }
    }

    /*!
     *  @brief  動画更新情報(feed)取得完了通知
     *  @param  username    ユーザページID
     *  @param  xml         動画更新情報(xml)
     *  @param  post_func   後処理
     */
    tell_get_xml(username, xml, post_func) {
        const parser = new DOMParser();
        const feed = parser.parseFromString(xml, "application/xml");
        const elem_channel_id = feed.getElementsByTagName('yt:channelId');
        if (elem_channel_id.length == 0) {
            return;
        }
        const channel_id = $(elem_channel_id[0]).text();
        if (username in this.author_info_map) {
            var obj = this.author_info_map[username];
            obj.channel_id = channel_id;
            post_func(obj);
        }
    }
}
