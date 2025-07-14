/*!
 *  @brief  YoutubeフィルタUtil
 */
class YoutubeFilteringUtil {

    /*!
     *  @brief  lockup-view-modelのdetach
     *  @note   大外は残して中身だけdetachする
     *  @note   24年11月以降のrecommend用
     */
    static detach_lower_lockup_vm_node(base_node) {
        HTMLUtil.detach_lower_node(base_node, "div.yt-lockup-view-model-wiz");
    }

    /*!
     *  @brief  <ytd-rich-grid-renderer>ごとの処理
     *  @note   Youtubeホームのsemi-root
     */
    static each_rich_grid_renderer(func) {
        $("ytd-rich-grid-renderer").each((inx, rc_grid)=>{
            func(rc_grid);
        });
    }
    /*!
     *  @brief  <ytd-item-section-renderer>ごとの処理
     *  @note   検索結果のsemi-root
     */
    static each_item_section_renderer(func) {
        $("ytd-item-section-renderer").each((inx, section)=>{
            func(section);
        });
    }
    /*!
     *  @brief  <ytd-grid-renderer>ごとの処理
     *  @note   チャンネルページ>再生リストのsemi-root
     */
    static each_grid_renderer(func) {
        $("ytd-grid-renderer").each((inx, grid)=>{
            func(grid);
        });
    }
    /*!
     *  @brief  <yt-horizontal-list-renderer>ごとの処理
     *  @note   チャンネルページ>ホームのプレイリストsemi-root
     */
    static each_horizontal_list_renderer(func) {
        $("yt-horizontal-list-renderer").each((inx, horizontal)=>{
            func(horizontal);
        });
    }

    /*!
     *  @brief  検索結果>プレイリストごとの処理
     */
    static each_searched_playlists(func) {
        $("a.yt-simple-endpoint.style-scope.ytd-playlist-renderer").each((inx, elem)=> {
            return func(elem);
        });
    }
    /*!
     *  @brief  おすすめ>動画ごとの処理
     */
    static each_recommend_videos(e_parent, func) {
        const tag_link = "a.yt-simple-endpoint.style-scope.ytd-compact-video-renderer";
        $(e_parent).find(tag_link).each((inx, elem)=> {
            func(elem);
        });
    }
    /*!
     *  @brief  おすすめ>プレイリストごとの処理
     *  @note   24年10月までの構成用
     */
    static each_recommend_playlists(e_parent, func) {
        const tag_link
            = "a.yt-simple-endpoint.style-scope.ytd-compact-playlist-renderer";
        $(e_parent).find(tag_link).each((inx, elem)=> {
            func(elem);
        });
    }

    /*!
     *  @brief  ytd-rich-grid-mediaに対するeach
     */
    static each_rich_grid_media(do_func, dismissible_tag) {
        const tag_grid = dismissible_tag + ".style-scope.ytd-rich-grid-media";
        const tag_title = "#video-title-link";
        $(tag_grid).each((inx, elem)=> {
            do_func(elem, tag_title);
        });
    }
    /*!
     *  @brief  ytd-rich-grid-mediaに対するフィルタリング
     *  @note   home等で使う
     */
    static filtering_rich_grid_media(filter_func, dismissible_tag) {
        YoutubeFilteringUtil.each_rich_grid_media((elem, tag_title)=> {
            const tag_thumbnail = "a#thumbnail";
            const tag_channel = ".yt-simple-endpoint.style-scope.yt-formatted-string";
            filter_func(elem, tag_title, tag_thumbnail, tag_channel, dismissible_tag);
        }, dismissible_tag);
    }    

    /*!
     *  @brief  <yt-lockup-view-model>ごとの処理
     *  @note   プレイ/MIXリスト用(24年11月時点)
     */
    static each_lockup_view_model(func, p_parent) {
        if (p_parent != null) {
            $(p_parent).find("yt-lockup-view-model").each((inx, elem)=> {
                return func(elem);
            });
        } else {
            $("yt-lockup-view-model").each((inx, elem)=> {
                return func(elem);
            });
        }
    }

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
