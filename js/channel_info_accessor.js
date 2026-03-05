/*!
 *  @brief  Youtubeチャンネル情報アクセスクラス
 *  @note   カスタムチャンネル名/ハンドルとchannelIDの紐付け管理
 */
class ChannelInfoAccessor {

    constructor() {
        this.channel_info_map = [];
    }

    /*!
     *  @brief  独自チャンネル名からチャンネルIDを得る
     *  @param  unique_name カスタムチャンネル名/ハンドル
     */
    get_channel_id(unique_name) {
        if (unique_name in this.channel_info_map) {
            return this.channel_info_map[unique_name].channel_id;
        }
        return null;
    }
    /*!
     *  @brief  独自チャンネル名からチャンネル名を得る
     *  @param  unique_name カスタムチャンネル名/ハンドル
     */
    get_channel_name(unique_name) {
        if (unique_name in this.channel_info_map) {
            return this.channel_info_map[unique_name].channel_name;
        }
        return null;
    }

    /*!
     *  @brief  独自チャンネル名登録
     *  @param  unique_name カスタムチャンネル名/ハンドル
     */
    entry(unique_name) {
        if (unique_name in this.channel_info_map) {
            return;
        } else {
            // 新規登録
            let obj = {};
            obj.unique_name = unique_name;
            obj.busy = false;
            this.channel_info_map[unique_name] = obj;
        }
    }

    /*!
     *  @brief  チャンネル情報取得発行
     *  @note   未処理のqueryがあればリクエストを出す
     */
    kick() {
        for (const unique_name in this.channel_info_map) {
            const obj = this.channel_info_map[unique_name];
            if (!obj.busy && obj.channel_id == null) {
                obj.busy = true;
                // content_script内で他domainへアクセスするとCORBされるためbgへ移譲
                MessageUtil.send_message(
                    {command:MessageUtil.command_author_to_channel_info(),
                     unique_name: unique_name});
            }
        }
    }

    /*!
     *  @brief  チャンネル情報取得完了通知
     *  @note   channel_nameが存在しない事が稀にある→handle入れとく
     */
    tell_get_channel_info(author, channel_info) {
        if (author in this.channel_info_map) {
            let obj = this.channel_info_map[author];
            obj.channel_id = channel_info.id;
            obj.channel_name = channel_info.name;
            if (obj.channel_name == null) {
                obj.channel_name = author;
            }
            obj.busy = false;
        }
    }
}
