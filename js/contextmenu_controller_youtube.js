/*!
 *  @brief  右クリックメニュー制御(youtube用)
 */
class ContextMenuController_Youtube extends ContextMenuController {

    /*!
     *  @brief  Youtubeチャンネル名を得る
     *  @param  element 起点ノード
     */
    get_channel(element) {
        const tag = "yt-formatted-string#text.style-scope.ytd-channel-name";
        var e = YoutubeUtil.find_first_appearing_element(element, tag);
        if (e == null) {
            // grid-channel(○水平リスト)例外
            const chtag = "span#title.style-scope.ytd-grid-channel-renderer";
            const ch = $(element).find(chtag);
            if (ch.length != 0) {
                e = ch;
            }
        }
        if (e != null) {
            const channel = $(e).text();
            if (channel.length > 0) {
                return channel;
            }
        }
        // personal_channel_video
        return YoutubeUtil.get_page_channel_name();
    }
    
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
            if (nd_renderer.length > 0 &&
                super.on_usermute(nd_renderer)) {
                return;
            }
        }
        ContextMenuController.off_original_menu();
    }

    /*!
     */
    constructor(active) {
        super();
        this.filter_active = active;
    }
}
