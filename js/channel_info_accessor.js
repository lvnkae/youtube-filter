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
            var obj = {};
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
                    {command:MessageUtil.command_get_channel_html(),
                     unique_name: unique_name});
            }
        }
    }

    /*!
     *  @brief  チャンネル情報取得完了通知
     *  @param  unique_name カスタムチャンネル名/ハンドル
     *  @param  html        チャンネル情報(html)
     *  @param  post_func   後処理
     *  @note   channel_nameが存在しない事が稀にある→handle入れとく
     */
    tell_get_html(unique_name, html, post_func) {
        const name_match = html.match(/"pageTitle":"([^"]+)"/i);
        const id_match = html.match(/"(?:channelId|browseId)":"(UC[a-zA-Z0-9_-]{22})"/i);
        if (unique_name in this.channel_info_map) {
            var obj = this.channel_info_map[unique_name];
            obj.channel_id = (id_match != null) ?id_match[1] :null;
            obj.channel_name = (name_match != null) ?name_match[1] :unique_name;
            obj.busy = false;
            post_func(obj);
        }
    }
}
