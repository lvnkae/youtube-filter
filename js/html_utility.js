/*!
 *  @brief  html関連Utility
 */
class HTMLUtil {

    /*!
     *  @brief  要素が非表示であるか
     *  @param  e   調べる要素
     */
    static in_disappearing(e) {
        if ($(e).attr("hidden") != null) {
            return true;
        }
        const attr_style = $(e).attr("style");
        if (attr_style != null && attr_style.indexOf("display: none;") >= 0) {
            return true;
        }
        return false;
    }

    /*!
     *  @brief  key要素を探す
     *  @param  start_elem  探索起点
     *  @param  key         探索キー
     *  @note   first-hit
     *  @note   非表示(hidden, display none)は除外する
     */
    static find_first_appearing_element(start_elem, key) {
        const elements = $(start_elem).find(key)
        for (var e of elements) {
            if (!HTMLUtil.in_disappearing(e)) {
                return e;
            }
        }
        return null
    }


    static search_upper_node(elem, func) {
        while(elem.length > 0) {
            if (func(elem[0])) {
                return elem;
            }
            elem = elem.parent();
        }
        return {length:0};
    }

    static detach_upper_node(elem, tag) {
        const check_tag = function(e) {
            return e.localName == tag;
        }
        const nd = HTMLUtil.search_upper_node(elem, check_tag);
        if (nd.length == 0) {
            return;
        }
        $(nd).detach();
    }

    static detach_lower_node(elem, tag) {
        const dt_node = $(elem).find(tag);
        if (dt_node.length == 0) {
            return;
        }
        $(dt_node).detach();
    }

    static detach_children_all(elem) {
        const len = elem.children.length;
        for (let inx = 0; inx < len; inx++) {
            // childrenは減っていく
            $(elem.children[0]).detach();
        }
    }
}
