/*!
 *  @brief  YoutubeフィルタUtil
 */
class YoutubeFilteringUtil {

    /*!
     *  @brief  renderer_nodeにchannel_idでフィルタをかける
     *  @param  renderer_node   コンテンツ(動画/チャンネル/playlist)ノード(1つ分)
     *  @param  channel_id      チャンネルID
     *  @param  title           コンテンツ名
     *  @param  detach_func     削除関数
     *  @param  storage
     *  @retval true    ミュート(ノード削除)された
     *  @note   ミュート対象外ならattrにchannel_id書き込み(ContextMenus用)
     */
    static filtering_renderer_node_by_channel_id(renderer_node,
                                                 channel_id,
                                                 title,
                                                 detach_func,
                                                 storage) {
        if (channel_id != null) {
            if (storage.channel_id_filter(channel_id, title)) {
                if (detach_func) {
                    detach_func(renderer_node);
                } else {
                    $(renderer_node).detach();
                }
                return true;
            } else {
                YoutubeUtil.set_renderer_node_channel_id(renderer_node, channel_id);
            }
        }
        return false;
    }
}
