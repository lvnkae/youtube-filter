/*!
 *  @brief  Youtube動画情報アクセスクラス
 */
class VideoInfoAccessor {

    constructor() {
        this.video_info_map = [];
    }

    /*!
     *  @brief  動画IDからチャンネル情報を得る
     *  @param  video_id    動画ID
     */
    get_channel_info(video_id) {
        if (video_id in this.video_info_map) {
            const video_info = this.video_info_map[video_id];
            let obj = {};
            obj.id = video_info.channel_id;
            obj.name = video_info.channel_name;
            return obj;
        }
        return null;
    }
    /*!
     *  @brief  動画IDからチャンネルIDを得る
     *  @param  video_id    動画ID
     */
    get_channel_id(video_id) {
        if (video_id in this.video_info_map) {
            return this.video_info_map[video_id].channel_id;
        }
        return null;
    }
    /*!
     *  @brief  動画IDからチャンネル名を得る
     *  @param  video_id    動画ID
     */
    get_channel_name(video_id) {
        if (video_id in this.video_info_map) {
            return this.video_info_map[video_id].channel_name;
        }
        return null;
    }    

    /*!
     *  @brief  動画IDにチャンネルIDを紐付ける
     *  @param  video_id    動画ID
     *  @param  channel_id  チャンネルID
     */
    set_channel_id(video_id, channel_id) {
        if (video_id in this.video_info_map) {
            let obj = this.video_info_map[video_id];
            obj.channel_id = channel_id;
            obj.busy = false;
        }
    }

    /*!
     *  @brief  動画ID登録
     *  @param  video_id    動画ID(識別にも使用)
     */
    entry(video_id) {
        if (video_id in this.video_info_map) {
        } else {
            // 新規登録
            let obj = {};
            obj.video_id = video_id;
            obj.busy = false;
            this.video_info_map[video_id] = obj;
        }
    }

    /*!
     *  @brief  動画情報取得発行
     *  @note   未処理の動画IDがあればリクエストを出す
     */
    kick() {
        for (const video_id in this.video_info_map) {
            const obj = this.video_info_map[video_id];
            if (!obj.busy && obj.channel_id == null) {
                obj.busy = true;
                // content_script内で他domainへアクセスするとCORBされるためbgへ移譲
                MessageUtil.send_message(
                    {command:MessageUtil.command_video_id_to_channel_info(),
                     video_id: video_id});
            }
        }
    }

    /*!
     *  @brief  チャンネル情報取得完了通知
     *  @param  video_id        動画ID
     *  @param  channel_info    チャンネル情報
     */
    tell_get_channel_info(video_id, channel_info) {
        if (video_id in this.video_info_map) {
            let obj = this.video_info_map[video_id];
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
