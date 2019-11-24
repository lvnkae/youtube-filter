/*!
 *  @brief  右クリックメニュー制御(youtube用)
 */
class ContextMenuController_Youtube extends ContextMenuController {

    /*!
     *  @brief  renderノードを得る
     *  @param  element 起点ノード
     */
    get_renderer_node(element) {
        return YoutubeUtil.search_renderer_root($(element));
    }

    /*!
     *  @brief  event:右クリック
     *  @param  loc     現在location(urlWrapper)
     *  @param  target  右クリックされたelement
     */
    event_mouse_right_click(loc, element) {
        if (!loc.in_youtube_channel_page() &&
            !loc.in_youtube_search_page() &&
            !loc.in_youtube_movie_page() &&
            !loc.in_youtube_user_page() &&
            !loc.in_youtube_trending() &&
            !loc.in_youtube_gaming() &&
            !loc.in_top_page()) {
            return;
        }
        if (this.filter_active) {
            const nd_renderer = this.get_renderer_node(element);
            if (nd_renderer.length == 0) {
                ContextMenuController.off_original_menu();
            } else {
                ContextMenuController.on_usermute(nd_renderer);
            }
        } else {
            ContextMenuController.off_original_menu();
        }
    }

    /*!
     */
    constructor(active) {
        super();
        this.filter_active = active;
    }
}
