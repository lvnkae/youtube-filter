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
        if (src.search(RegExp(" \- YouTube$", "")) > 0) {
            return src.slice(0, src.length - " - Youtube".length);
        } else {
            return src;
        }
    }

    /*!
     *  @brief  検索結果動画ノードからYoutube動画チャンネル名を得る
     *  @param  nd_ggl  検索結果ノード
     */
    static get_channel_from_video_node(nd_ggl) {
        const elem_channel = $(nd_ggl).find("div.slp.f");
        if (elem_channel.length == 0) {
            return null;
        }
        const channel_div = $(elem_channel[0]).text().split(': ');
        if (channel_div.length == 0) {
            return null;
        }
        var channel = '';
        for (var inx = 1; inx < channel_div.length; inx++) {
            channel += channel_div[inx];
        }
        return channel;
    }

    /*!
     *  @brief  動画スクロールカードノードからYoutube動画チャンネル名を得る
     *  @param  nd_a    <a>ノード
     */
    static get_channel_from_video_card_node(nd_a) {
        return $($($(nd_a[0]).nextAll()[1]).children()[0]).text();
    }

    /*!
     *  @brief  検索結果URLからリンク先URLを切り出す
     *  @note   "https://google.com/url?"という中継リンクをカットする
     */
    static cut_searched_url(href) {
        if (!GoogleUtil.is_searched_url(href)) {
            return href;
        }
        const url = href.split('&url=')[1].split('&usg=')[0]
        return decodeURIComponent(url);
    }

    /*!
     *  @brief  検索結果URLが中継リンクか
     */
    static is_searched_url(href) {
        return href.startsWith('/url?');
    }
}
