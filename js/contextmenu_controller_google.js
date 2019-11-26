/*!
 *  @brief  右クリックメニュー制御(google用)
 */
class ContextMenuController_Google extends ContextMenuController {


    static get_searched_node_chanel(nd_ggl) {
        const a_tag = $(nd_ggl).find("a");
        if (a_tag.length == 0) {
            return null;
        }
        const href = $(a_tag[0]).attr("href");
        if (href == null) {
            return null;
        }
        const url = new urlWrapper(GoogleUtil.cut_searched_url(href));
        if (!url.in_google_searched_youtube()) {
            return null;
        }
        if (url.in_youtube_movie_page()) {
            return GoogleUtil.get_channel_from_video_node(nd_ggl);
        } else
        if (url.in_youtube_channel_page() || url.in_youtube_user_page()) {
            return null; // 右クリミュート不要
        } else
        if (url.in_youtube_playlist_page()) {
            return null; // ?playlistは旧仕様っぽい(動画＋list=に統合？)
        }
        return null;
    }

    static get_inner_card_node_channel(nd_ggl) {
        if (nd_ggl[0].localName != 'g-inner-card') {
            return null;
        }
        const a_tag = $(nd_ggl).find("a");
        if (a_tag.length ==0) {
            return null;
        }
        const href = $(a_tag[0]).attr("href");
        if (href == null) {
            return null;
        }
        const url = new urlWrapper(GoogleUtil.cut_searched_url(href));
        if (!url.in_google_searched_youtube()) {
            return null;
        }
        return GoogleUtil.get_channel_from_video_card_node(a_tag);
    }

    /*!
     *  @brief  Youtubeチャンネル名を得る
     *  @param  element 検索結果起点ノード
     */
    get_channel(nd_ggl) {
        const ch = ContextMenuController_Google.get_searched_node_chanel(nd_ggl);
        if (ch != null) {
            return ch;
        }
        return ContextMenuController_Google.get_inner_card_node_channel(nd_ggl);
    }
    
    /*!
     *  @brief  検索結果起点ノードを得る
     *  @param  element 右クリックされたelement
     */
    get_google_node(element) {
        const nd_gs = YoutubeUtil.search_upper_node($(element), (e)=> {
            return e.localName == 'div' &&
                   e.classList.length > 0 &&
                   e.classList[0] == 'g';
        });
        if (nd_gs.length > 0) {
            return nd_gs;
        }
        return YoutubeUtil.search_upper_node($(element), (e)=> {
            return e.localName == 'g-inner-card';
                   e.className != '';
        });
    }

    /*!
     *  @brief  event:右クリック
     *  @param  loc     現在location(urlWrapper)
     *  @param  element 右クリックされたelement
     */
    event_mouse_right_click(loc, element) {
        if (!loc.in_google()) {
            return;
        }
        if (this.filter_active) {
            const nd_ggl = this.get_google_node(element);
            if (nd_ggl.length > 0 &&
                super.on_usermute(nd_ggl)) {
                return;
            }
        }
        ContextMenuController.off_original_menu();
    }

    /*!
     */
    constructor(active) {
        super();
        this.filter_active = true;
    }
}
