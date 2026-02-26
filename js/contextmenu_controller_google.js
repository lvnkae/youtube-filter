/*!
 *  @brief  右クリックメニュー制御(google用)
 */
class ContextMenuController_Google extends ContextMenuController {

    static TYPE_CHANNEL = 1;

    /*!
     *  @brief  Youtubeチャンネル名を得る
     *  @param  element 検索結果起点ノード
     */
    get_channel(element) {
        return GoogleUtil.get_channel_name(element);
    }
    
    /*!
     *  @brief  検索結果起点ノードを得る
     *  @param  element 右クリックされたelement
     */
    get_google_node(element) {
        const nd_sub = HTMLUtil.search_parent_node(element, e=> {
            return (e.localName === 'g-inner-card' || e.localName === 'video-voyager') &&
                    e.hasAttribute("channel_id");
        });
        if (nd_sub != null) {
            return nd_sub;
        }
        const nd_gs = HTMLUtil.search_parent_node(element, e=> {
            return e.localName === 'div' && e.hasAttribute("channel_id");
        });
        if (nd_gs != null) {
            return nd_gs;
        }
       return null;
    }

    /*!
     *  @brief  右クリックメニューの独自項目を有効化
     *  @param  element
     */
    on_mute_menu(type, element) {
        if (type == ContextMenuController_Google.TYPE_CHANNEL) {
            return super.on_usermute(element);
        } else {
            return false;
        }
    }

    /*!
     *  @brief  elementの基準ノード取得
     *  @param  loc     現在location(urlWrapper)
     *  @param  target  注目element
     */
    get_base_node(loc, element) {
        const ret = { type:ContextMenuController.TYPE_NONE, base_node:null};
        if (!loc.in_google()) {
            return ret;
        }
        const nd_ggl = this.get_google_node(element);
        if (nd_ggl != null) {
            ret.type = ContextMenuController_Google.TYPE_CHANNEL;
            ret.base_node = nd_ggl;
            return ret;
        }
        return ret;
    }

    /*!
     */
    constructor(active) {
        super(active);
    }
}
