/*!
 *  @brief  Google関連Utility
 */
const YOUTUBE_TITLE_EXTRACTOR = /([^]+) - YouTube$/;
class GoogleUtil {

    /*!
     *  @brief  google検索結果のyoutube文字列切り出し
     *  @param  src 元文字列
     *  @note   検索結果においてyoutubeチャンネルページは末尾に" - YouTube"が付加される
     *  @note   ことがある。これをカットした本来の文字列を得る。
     *  @note   ※" - Youtube"を含めて表示文字列上限を超えない場合に限る
     */
    static cut_googled_youtube_title(src) {
        const match = src.match(YOUTUBE_TITLE_EXTRACTOR);
        if (match != null) {
            return match[1];
        } else {
            return src;
        }
    }

    /*!
     *  @brief  検索結果ノードからYoutube動画チャンネル名を得る
     *  @param  nd_ggl  検索結果ノード
     */
    static get_channel_name(nd_ggl) {
        return nd_ggl.getAttribute("channel_name")
    }

    /*!
     *  @brief  検索結果ノードにYoutubeチャンネル情報を書き込んでおく
     *  @param  nd_ggl  検索結果ノード
     *  @note   ContextMenus用
     */
    static set_channel_info(nd_ggl, channel_id, channel) {
        nd_ggl.setAttribute("channel_id", channel_id);
        nd_ggl.setAttribute("channel_name", channel);
    }

    /*!
     *  @brief  動画スクロールカードノードからYoutube動画チャンネル名を得る
     *  @param  nd_div  <div>ノード[チャンネル名]
     */
    static get_channel_from_video_card_node(nd_div) {
        for (const span of nd_div.getElemensByTagName("span")) {
            for (const ch_nd of span.childNodes) {
                if (ch_nd.nodeName === "#text") {
                    return text_utility.remove_blank_line_and_head_space(ch_nd.nodeValue);
                }
            }
        }
        return "";
    }

    /*!
     *  @brief  検索結果ノードからリンク先URLを切り出す
     *  @note   "https://google.com/url?"という中継リンクをカットする
     */
    static cut_searched_url(href) {
        if (!href.startsWith('/url?')) {
            return href;
        }
        const url = href.split('&url=')[1].split('&usg=')[0]
        return decodeURIComponent(url);
    }

    static get_search_node(elem) {
        return  HTMLUtil.search_parent_node(elem, e=> {
            return e.localName === "div" &&
                 ((e.hasAttribute("jscontroller") && e.hasAttribute("jsaction")) ||
                  (e.hasAttribute("jsname") && e.hasAttribute("data-hveid")));
        });
    }
    /*!
     *  @brief  Google検索ノードを消す
     */
    static detach_search_node(elem) {
        const c = GoogleUtil.get_search_node(elem);
        if (c != null) {
            c.remove();
        }
    }
}
