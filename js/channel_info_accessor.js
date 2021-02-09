/*!
 *  @brief  Youtubeチャンネル情報アクセスクラス
 *  @note   カスタムチャンネル名とchannelIDの紐付け管理
 */
class ChannelInfoAccessor {

    constructor() {
        this.channel_info_map = [];
    }

    /*!
     *  @brief  カスタムチャンネル名からチャンネルIDを得る
     *  @param  custom_name カスタムチャンネル名
     */
    get_channel_id(custom_name) {
        if (custom_name in this.channel_info_map) {
            return this.channel_info_map[custom_name].channel_id;
        }
        return null;
    }

    /*!
     *  @brief  ユーザ名登録
     *  @param  custom_name カスタムチャンネル名
     */
    entry(custom_name) {
        if (custom_name in this.channel_info_map) {
            return;
        } else {
            // 新規登録
            var obj = {};
            obj.custom_name = custom_name;
            obj.busy = false;
            this.channel_info_map[custom_name] = obj;
        }
    }

    /*!
     *  @brief  カスタムチャンネル情報取得発行
     *  @note   未処理のカスタムチャンネル名があればリクエストを出す
     */
    kick() {
        for (const custom_name in this.channel_info_map) {
            const obj = this.channel_info_map[custom_name];
            if (!obj.busy && obj.channel_id == null) {
                obj.busy = true;
                // content_script内で他domainへアクセスするとCORBされるためbgへ移譲
                MessageUtil.send_message(
                    {command:MessageUtil.command_get_channel_html(),
                     custom_name: custom_name});
            }
        }
    }

    /*!
     *  @brief  カスタムチャンネル情報取得完了通知
     *  @param  custom_name カスタムチャンネル名
     *  @param  html        チャンネル情報(html)
     *  @param  post_func   後処理
     */
    tell_get_html(custom_name, html, post_func) {
        const parser = new DOMParser();
        const doc_html = parser.parseFromString(html, "text/html");
        const elem_meta = doc_html.getElementsByTagName('meta');
        if (elem_meta.length == 0) {
            return;
        }
        var channel_id = null;
        $(elem_meta).each((inx, elem)=>{
            const prop = $(elem).attr('itemprop');
            if (prop == null) {
                return true;
            }
            if (prop != 'channelId') {
                return true;
            }
            const cont = $(elem).attr('content');
            if (cont == null) {
                return true;
            }
            channel_id = cont;
            return false;
        });
        if (custom_name in this.channel_info_map) {
            var obj = this.channel_info_map[custom_name];
            obj.channel_id = channel_id;
            post_func(obj);
        }
    }
}
