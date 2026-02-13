/*!
 *  @brief  YoutubeフィルタUtil
 */
const ATTR_STATE = "state";
class YoutubeFilteringUtil {

    static get_state(renderer_node) {
        return renderer_node.getAttribute(ATTR_STATE);
    }
    static set_state(renderer_node, state) {
        renderer_node.setAttribute(ATTR_STATE, state);
    }
    static remove_state(renderer_node) {
        renderer_node.removeAttribute(ATTR_STATE);
    }
    static STATE_WAIT = "wait";
    static set_wait(renderer_node) {
        renderer_node.setAttribute(ATTR_STATE, YoutubeFilteringUtil.STATE_WAIT);
    }
    static STATE_COMPLETE = "complete";
    static completed(renderer_node) {
        renderer_node.setAttribute(ATTR_STATE, YoutubeFilteringUtil.STATE_COMPLETE);
    }
    static STATE_REMOVE = "remove";
    static removed(renderer_node) {
        renderer_node.setAttribute(ATTR_STATE, YoutubeFilteringUtil.STATE_REMOVE);
    }

    /*!
     *  @brief  lockup-view-modelのdetach
     *  @note   大外は残して中身だけdetachする
     *  @note   24年11月以降のrecommend用
     */
    static detach_lower_lockup_vm_node(base_node) {
        HTMLUtil.detach_lower_node2(base_node, "div.yt-lockup-view-model");
        HTMLUtil.detach_lower_node2(base_node, "div.yt-lockup-view-model-wiz");
        YoutubeFilteringUtil.removed(base_node);
    }

    /*!
     *  @brief  <ytd-rich-grid-renderer>ごとの処理
     *  @note   Youtubeホームのsemi-root
     */
    static each_rich_grid_renderer(func) {
        const tag_rich_grid = "ytd-rich-grid-renderer";
        for (const rc_grid of document.body.getElementsByTagName(tag_rich_grid)) {
            func(rc_grid);
        }
    }
    /*!
     *  @brief  <ytd-item-section-renderer>ごとの処理
     *  @note   検索結果のsemi-root
     */
    static each_item_section_renderer(func) {
        const tag_item_sect = "ytd-item-section-renderer";
        for (const section of document.body.getElementsByTagName(tag_item_sect)) {
            func(section);
        }
    }
    /*!
     *  @brief  <ytd-grid-renderer>ごとの処理
     *  @note   チャンネルページ>再生リストのsemi-root
     */
    static each_grid_renderer(func) {
        for (const grid of document.body.getElementsByTagName("ytd-grid-renderer")) {
            func(grid);
        }
    }
    /*!
     *  @brief  <yt-horizontal-list-renderer>ごとの処理
     *  @note   チャンネルページ>ホームのプレイリストsemi-root
     */
    static each_horizontal_list_renderer(func) {
        const tag = "yt-horizontal-list-renderer";
        for (const horizontal of document.body.getElementsByTagName(tag)) {
            func(horizontal);
        }
    }

    /*!
     *  @brief  検索結果>プレイリストごとの処理
     */
    static each_searched_playlists(func) {
        const tag = "a.yt-simple-endpoint.style-scope.ytd-playlist-renderer";
        for (const elem of document.body.querySelectorAll(tag)) {
            func(elem);
        }
    }
    /*!
     *  @brief  おすすめ>動画ごとの処理
     *  @note   25年07月までの構成用
     */
    static each_recommend_videos(e_parent, func) {
        const tag_link = "a.yt-simple-endpoint.style-scope.ytd-compact-video-renderer";
        for (const elem of e_parent.querySelectorAll(tag_link)) {
            func(elem);
        }
    }
    /*!
     *  @brief  おすすめ>プレイリストごとの処理
     *  @note   24年10月までの構成用
     */
    static each_recommend_playlists(e_parent, func) {
        const tag_link
            = "a.yt-simple-endpoint.style-scope.ytd-compact-playlist-renderer";
        for (const elem of e_parent.querySelectorAll(tag_link)) {
            func(elem);
        }
    }

    /*!
     *  @brief  ytd-rich-grid-mediaに対するeach
     */
    static each_rich_grid_media(do_func, dismissible_tag) {
        const tag_grid = dismissible_tag + ".style-scope.ytd-rich-grid-media";
        const tag_title = "#video-title-link";
        for (const elem of document.body.querySelectorAll(tag_grid)) {
            do_func(elem, tag_title);
        };
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
     */
    static each_element(func, p_parent, tag) {
        if (p_parent != null) {
            for (const elem of p_parent.querySelectorAll(tag)) {
                func(elem);
            }
        } else {
            document.querySelectorAll(tag).forEach((elem)=> {
                func(elem);
            });
        }
    }
    /*!
     *  @brief  <yt-lockup-view-model>ごとの処理
     *  @note   プレイ/MIXリスト用(24年11月時点)
     */
    static each_lockup_view_model(func, p_parent) {
        for (const elem of p_parent.getElementsByTagName("yt-lockup-view-model")) {
            func (elem);
        }
    }
    /*!
     *  @brief  <yt-lockup-view-model>ごとの処理
     *  @note   未処理のものだけ
     */
    static each_lockup_view_model_fresh(func, p_parent) {
        const tag = 'yt-lockup-view-model:not([state])';
        YoutubeFilteringUtil.each_element(func, p_parent, tag);
    }
    /*!
     *  @brief  <yt-lockup-view-model>ごとの処理
     *  @note   問い合わせ待ちのものだけ
     */    
    static each_lockup_view_model_wait(func, p_parent) {
        const tag = 'yt-lockup-view-model[state="wait"]';
        YoutubeFilteringUtil.each_element(func, p_parent, tag);
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
                    renderer_node.remove();
                }
                return true;
            } else {
                YoutubeFilteringUtil.completed(renderer_node);
                YoutubeUtil.set_renderer_node_channel_id(renderer_node, channel_id);
            }
        }
        return false;
    }
}
