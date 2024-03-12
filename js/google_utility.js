/*!
 *  @brief  Google関連Utility
 */
class GoogleUtil {

    /*!
     *  @brief  google検索結果のyoutube文字列切り出し
     *  @param  src 元文字列
     *  @note   検索結果においてyoutubeページ(動画,チャンネル等)は末尾に" - YouTube"が付加される
     *  @note   これをカットした本来の文字列を得る
     *  @note   ※" - Youtube"を含めて表示文字列上限を超えない場合に限る
     */
    static cut_googled_youtube_title(src) {
        if (src.search(RegExp(" \- YouTube$", "")) >= 0) {
            return src.slice(0, src.length - " - Youtube".length);
        } else {
            return src;
        }
    }

    /*!
     *  @brief  検索結果ノードからYoutube動画チャンネル名を得る
     *  @param  nd_ggl  検索結果ノード
     */
    static get_channel_name(nd_ggl) {
        return $(nd_ggl).attr("channel_name")
    }

    /*!
     *  @brief  検索結果ノードにYoutubeチャンネル情報を書き込んでおく
     *  @param  nd_ggl  検索結果ノード
     *  @note   ContextMenus用
     */
    static set_channel_info(nd_ggl, channel_id, channel) {
        $(nd_ggl).attr("channel_id", channel_id);
        $(nd_ggl).attr("channel_name", channel);
    }

    /*!
     *  @brief  動画スクロールカードノードからYoutube動画チャンネル名を得る
     *  @param  nd_div  <div>ノード[チャンネル名]
     */
    static get_channel_from_video_card_node(nd_div) {
        const nd_span = $(nd_div).find("span");
        for (const span of nd_span) {
            for (const ch_nd of span.childNodes) {
                if (ch_nd.nodeName == "#text") {
                    return text_utility.remove_blank_line_and_head_space(ch_nd.nodeValue);
                }
            }
        }
        return "";
    }

    /*!
     *  @brief  検索結果URLからリンク先URLを切り出す
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
        return  HTMLUtil.search_upper_node($(elem), (e)=> {
            return e.localName == "div" &&
                 (($(e).attr("jscontroller") != null && $(e).attr("jsaction") != null) ||
                 ($(e).attr("jsname") != null && $(e).attr("data-hveid") != null));
        });
    }
    /*!
     *  @brief  Google検索ノードを消す
     */
    static detach_search_node(elem) {
        const c = GoogleUtil.get_search_node(elem);
        if (c.length != 0) {
            $(c).detach();
        }
    }
}
