/*!
 *  @brief  Youtubeに問い合わせて得たデータの窓口
 */
class YoutubeDataCounter {

    /*!
     *  @brief  チャンネルURLからチャンネルIDを得る
     *  @note   取得できなければ必要な情報をネットワーク経由で得る
     *  @note   (要求をentryするだけ)
     *  @param  author_url  チャンネルURL
     */
    get_channel_id_from_author_url_or_entry_request(author_url) {
        const channel_code = YoutubeUtil.cut_channel_id(author_url);
        if (YoutubeUtil.is_channel_url(author_url)) {
            return YoutubeUtil.cut_channel_id(author_url);
        } else if (YoutubeUtil.is_userpage_url(author_url)) {
            const channel_id = this.author_info_accessor.get_channel_id(channel_code);
            if (channel_id != null) {
                return channel_id;
            }
            this.author_info_accessor.entry(channel_code);
        } else if (YoutubeUtil.is_uniquepage_url(author_url)) {
            const channel_id = this.channel_info_accessor.get_channel_id(channel_code);
            if (channel_id != null) {
                return channel_id;
            }
            this.channel_info_accessor.entry(channel_code);
        }
        return null;
    }

    /*!
     *  @brief  renderer_nodeにchannel_infoでフィルタをかける
     *  @note   channel_infoが取得できなければ必要な情報をネットワーク経由で得る
     *  @param  renderer_node   コンテンツ(動画)ノード(1つ分)
     *  @param  video_id        動画ID
     *  @param  title           動画タイトル
     *  @param  storage
     *  @retval true            指定動画(renderオブジェクト)がdetachされた
     *  @note   主にshort動画(チャンネル表記なし)用
     */
    filtering_renderer_node_by_channel_info_or_entry_request(renderer_node,
                                                             video_id,
                                                             title,
                                                             storage) {
        const channel_info = this.video_info_accessor.get_channel_info(video_id);
        if (channel_info == null || channel_info.id == null) {
            this.video_info_accessor.entry(video_id);
            return false;
        }
        if (channel_info.name == null) {
            return false;
        }
        if (storage.channel_id_filter(channel_info.id, title) ||
            storage.channel_filter(channel_info.name, title)) {
            $(renderer_node).detach();
            return true;
        } else {
            // ContextMenu用に書き込んでおく
            YoutubeUtil.set_renderer_node_channel_id(renderer_node, channel_info.id);
            if (!YoutubeUtil.set_channel_name(renderer_node, channel_info.name)) {
                // channel_nameノードがなかったら作る(V2用)
                $(renderer_node).attr("channel_name", channel_info.name);
            }
            return false;
        }
    }

    entry_channel_id_request(video_id) {
        this.video_info_accessor.entry(video_id);
    }
    get_channel_info(video_id) {
        return this.video_info_accessor.get_channel_info(video_id);
    }    
    get_channel_name(channel_code) {
        return this.channel_info_accessor.get_channel_name(channel_code);
    }

    /*!
     */
    constructor(author_info_accessor, 
                channel_info_accessor,
                video_info_accessor) {
        this.author_info_accessor = author_info_accessor;
        this.channel_info_accessor = channel_info_accessor;
        this.video_info_accessor = video_info_accessor;
    }
}
