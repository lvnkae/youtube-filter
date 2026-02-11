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

    static hide_element(e) {
        if ($(e).is(":visible")) {
            $(e).hide();
        }
    }

    /*!
     *  @brief  key要素を探す
     *  @param  start_elem  探索起点
     *  @param  key         探索キー
     *  @note   first-hit
     *  @note   非表示(hidden, display none)は除外する
     */
    static find_first_appearing_element(start_elem, key) {
        const elements = start_elem.querySelectorAll(key)
        for (var e of elements) {
            if (!HTMLUtil.in_disappearing(e)) {
                return e;
            }
        }
        return null
    }
    /*!
     *  @note   非表示判定をoffsetParentで行う高速版
     *  @note   home/検索のchannel名ノード取得には使えない
     */
    static find_first_appearing_element_fast(start_elem, key) {
        const elements = start_elem.querySelectorAll(key)
        for (var e of elements) {
            if (e.offsetParent != null) {
                return e;
            }
        }
        return null
    }    

    static is_visible(e) {
        return $(e).is(":visible");
    }

    /*!
     *  @brief  最初のvisible要素を返す
     *  @param  elements    要素配列
     */
    static find_first_visible_element(elements) {
        for (var e of elements) {
            if (HTMLUtil.is_visible(e)) {
                return e;
            }
        }
        return null
    }    

    static search_node(elem, key, func) {
        let e_ret = null;
        $(elem).find(key).each((inx, elem)=> {
            if (func(elem)) {
                e_ret = elem;
                return false;
            } else {
                return true;
            }
        });
        return e_ret;
    }

    static collect_node(elem, key, func) {
        let e_ret = [];
        $(elem).find(key).each((inx, elem)=> {
            if (func(elem)) {
                e_ret.push(elem);
            }
        });
        return e_ret;
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
    static search_parent_node(elem, func) {
        while(elem != null) {
            if (func(elem)) {
                return elem;
            }
            elem = elem.parentNode;
        }
        return null;
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
    static detach_lower_node2(elem, tag) {
        const dt_node = elem.querySelector(tag);
        if (dt_node == null) {
            return;
        }
        dt_node.remove();
    }

    static search_children(e_parent, func) {
        let e_ret = null;
        for (const e of e_parent.children) {
            if (func(e)) {
                e_ret = e;
                break;
            }
        }
        return e_ret;
    }

    static detach_children_all(elem) {
        const len = elem.children.length;
        for (let inx = 0; inx < len; inx++) {
            // childrenは減っていく
            $(elem.children[0]).detach();
        }
    }
    static remove_children_all(elem) {
        const len = elem.children.length;
        for (let inx = 0; inx < len; inx++) {
            // childrenは減っていく
            elem.children[0].remove();
        }
    }    

    /*!
     *  @brief  urlからqueryパラメータをカットする
     */
    static cut_url_query_param(url) {
        return url.split("?")[0];
    }

    /*!
     *  @brief  カーソル(caret)が何行目にあるか？
     *  @param  elem    textarea
     */
    static get_caret_row(elem) {
        let row = 0;
        if (elem.length < 0) {
            return row;
        }
        let caret_pos = elem[0].selectionStart;
        let t_len = 0;
        const split_text = text_utility.split_by_new_line(elem.val());
        for (const word of split_text) {
            t_len += word.length + 1; // 1はsplit前改行
            if (caret_pos < t_len) {
                return row;
            } else {
                row++;
            }
        }
        return row;
    }

    /*!
     *  @brief  カーソル(caret)のrowとそこまでのtextを得る
     *  @param  elem    textarea
     */
    static get_text_before_caret_and_row(elem) {
        let ret = { row:0, text:""};
        if (elem.length < 0) {
            return ret;
        }
        let caret_pos = elem[0].selectionStart;
        let t_len = 0;
        const NLC = text_utility.new_line_code_lf();
        const split_text = text_utility.split_by_new_line(elem.val());
        for (const word of split_text) {
            t_len += word.length + 1; // 1はsplit前改行
            if (caret_pos < t_len) {
                ret.text += word;
                return ret;
            } else {
                ret.text += word + NLC;
                ret.row++;
            }
        }
        return ret;
    }    

    /*!
     *  @brief  elemのフォントサイズを得る
     *  @note   elem固有の指定がなければ根っこのcssを採用
     */
    static get_font_size(elem) {
        const font_size = elem[0].style.fontSize;
        if (font_size != "") {
            return parseFloat(font_size);
        }
        let font_size_str
            = window.getComputedStyle(elem[0]).getPropertyValue('font-size');
        return parseFloat(font_size_str);
    }

    static get_selected_element(elements) {
        let ret_elem = null;
        $(elements).each((inx, elem)=>{
            if (elem.className.indexOf("selected") >= 0) {
                ret_elem = elem;
                return false;
            }
            return true;
        });
        return ret_elem;
    }
}
