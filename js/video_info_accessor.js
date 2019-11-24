/*!
 *  @brief  Youtube動画情報アクセスクラス
 */
class VideoInfoAccessor {

    constructor() {
        this.video_info_map = [];
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
     *  @brief  動画IDにチャンネルIDを紐付ける
     *  @param  video_id    動画ID
     *  @param  channel_id  チャンネルID
     */
    set_channel_id(video_id, channel_id) {
        if (video_id in this.video_info_map) {
            var obj = this.video_info_map[video_id];
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
            return;
        } else {
            // 新規登録
            var obj = {};
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
                    {command:MessageUtil.command_get_video_json(),
                     video_id: video_id});
            }
        }
    }

    /*!
     *  @brief  動画情報(json)取得完了通知
     *  @param  video_id    動画ID
     *  @param  json        動画情報(json)
     *  @param  post_func   後処理
     */
    tell_get_json(video_id, json, post_func) {
        if (video_id in this.video_info_map) {
            var obj = this.video_info_map[video_id];
            obj.channel_name = json.author_name;
            const author_url = json.author_url;
            if (YoutubeUtil.is_channel_url(author_url)) {
                obj.channel_id = YoutubeUtil.cut_channel_id(author_url);
                obj.busy = false;
                post_func(obj);
            } else 
            if (YoutubeUtil.is_userpage_url(author_url)) {
                // userを主として使用してる
                const username = YoutubeUtil.cut_channel_id(author_url);
                obj.username = username;
                post_func(obj);
            }
        }
    }

    /*!
     *  @brief  チャンネルID取得完了通知
     *  @param  username    ユーザページID
     *  @param  channel_id  チャンネルID
     *  @return ret_v       受け取った動画ID群
     *  @note   ユーザ名をキーに取得されたチャンネルIDを受け取る
     */
    tell_get_channel_id(username, channel_id) {
        var ret_v = [];
        for (const video_id in this.video_info_map) {
            var obj = this.video_info_map[video_id];
            if (obj.username != null && obj.username == username) {
                obj.channel_id = channel_id;
                obj.busy = false;
                ret_v.push(obj.video_id);
            }
        }
        return ret_v;
    }
}
