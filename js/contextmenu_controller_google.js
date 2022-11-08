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
        const nd_sub = HTMLUtil.search_upper_node($(element), (e)=> {
            return (e.localName == 'g-inner-card' || e.localName == 'video-voyager') && 
                   $(e).attr("channel_id") != null;
        });
        if (nd_sub.length > 0) {
            return nd_sub;
        }
        const nd_gs = HTMLUtil.search_upper_node($(element), (e)=> {
            return e.localName == 'div' &&
                   $(e).attr("channel_id") != null;
        });
        if (nd_gs.length > 0) {
            return nd_gs;
        }
       return {length:0};
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
        const ret = { type:ContextMenuController.TYPE_NONE, base_node:{length:0}};
        if (!loc.in_google()) {
            return ret;
        }
        const nd_ggl = this.get_google_node(element);
        if (nd_ggl.length > 0) {
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
