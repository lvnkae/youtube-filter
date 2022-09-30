/*!
 *  @brief  Youtube関連Utility
 */
class YoutubeUtil {

    static is_channel_url(author_url) {
        return author_url.indexOf("/channel/") >= 0;
    }
    static is_userpage_url(author_url) {
        return author_url.indexOf("/user/") >= 0;
    }
    static is_custom_channel_url(author_url) {
        return author_url.indexOf("/c/") >= 0;
    }

    /*!
     *  @brief  トピック表記を含む文字列からチャンネル名を切り出す
     */
    static get_channel_from_topic(text) {
        const text_div = text.split(" -");
        const len = text_div.length;
        if (len.length <= 0) {
            return "";
        } else { 
            var channel = "";
            const num = (text_div[len-1] == " トピック" ||
                         text_div[len-1] == " Topic")
                         ?len-1 :len;
            for (var inx = 0; inx < num; inx++) {
                channel += text_div[inx];
            }
            return channel;
        }
    }

    /*!
     *  @brief  動画主情報からチャンネル名を切り出す
     */
    static get_channel_from_autor_info(text) {
        const delimiter = ' \u2022 '; // bullet
        const au_div = text.split(delimiter);
        const au_len = au_div.length;
        if (au_len > 1) {
            var channel = '';
            for (var inx = 0; inx < au_len-1; inx++) {
                channel += au_div[inx];
            }
            return channel;
        }
        return '';
    }

    /*!
     *  @brief  YoutubeチャンネルリンクからIDを切り出す
     */
    static cut_channel_id(channel_href) {
        const sp_href = channel_href.split("/");
        for (var inx = 0; inx < sp_href.length-1; inx++) {
            if (sp_href[inx] == 'user' ||
                sp_href[inx] == 'channel') {
                return sp_href[inx+1];
            } else
            if (sp_href[inx] == 'c') {
                return decodeURI(sp_href[inx+1]);
            }
        }
        return null;
    }
    /*!
     *  @brief  Youtube動画リンクからハッシュを切り出す
     */
    static cut_movie_hash(movie_href) {
        const sp_href = movie_href.split("?v=");
        return sp_href[sp_href.length-1];
    }
    /*!
     *  @brief  Youtube動画ノードからハッシュを得る
     *  @param  elem    動画ベースノード
     *  @param  tag     ハッシュ取得タグ
     */
    static get_video_hash(elem, tag) {
        const nd_hash = $(elem).find(tag);
        if (nd_hash.length > 0) {
            return YoutubeUtil.cut_movie_hash($(nd_hash).attr("href"));
        } else {
            return "";
        }
    }

    /*!
     *  @brief  short動画ノードからハッシュを得る
     *  @param  elem    動画ベースノード
     *  @param  tag     ハッシュ取得タグ
     */
    static get_short_hash(elem, tag) {
        const nd_hash = $(elem).find(tag);
        if (nd_hash.length > 0) {
            const movie_href = $(nd_hash).attr("href");
            const sp_href = movie_href.split("/");
            return sp_href[sp_href.length-1];
        } else {
            return "";
        }
    }

    /*!
     *  @brief  ページチャンネルURLを得る
     */
    static get_page_author_url() {
        return location.href;
    }

    static get_channel_name_tag() {
        return "yt-formatted-string#text.style-scope.ytd-channel-name";
    }
    /*!
     *  @brief  ページチャンネル名を得る
     */
    static get_page_channel_name() {
        const text_tag = $(YoutubeUtil.get_channel_name_tag());
        if (text_tag.length > 0) {
            return $(text_tag[0]).text();
        } else {
            return null;
        }
    }
    /*!
     *  @brief  チャンネル名を得る
     *  @note   elem    基準ノード
     */
    static get_channel_name(elem) {
        const ch_tag = YoutubeUtil.get_channel_name_tag();
        const ch_node = HTMLUtil.find_first_appearing_element(elem, ch_tag);
        if (ch_node != null) {
            return $(ch_node).text();
        } else {
            return "";
        }
    }    
    /*!
     *  @brief  チャンネル名をセットする
     *  @note   elem    基準ノード
     */
    static set_channel_name(elem, channel_name) {
        const ch_tag = YoutubeUtil.get_channel_name_tag();
        const ch_node = HTMLUtil.find_first_appearing_element(elem, ch_tag);
        if (ch_node != null) {
            return $(ch_node).text(channel_name);
        }
    }
    
    /*!
     *  @brief  コメントを得る
     *  @note   textだけでなく絵文字も切り出す
     */
    static get_comment(elem_comment) {
        var comment = "";
        for (const ch of elem_comment[0].childNodes) {
            if (ch.nodeName == "#text") {
                comment += ch.nodeValue;
            } else if (ch.className == 'style-scope yt-formatted-string') {
                comment += $(ch).text();
            } else if (ch.className == 'yt-simple-endpoint style-scope yt-formatted-string') {
                comment += $(ch).text();
            } else if (ch.className == 'small-emoji emoji style-scope yt-formatted-string') {
                comment += $(ch).attr("alt");
            }
        }
        return comment;
    }

    /*!
     *  @brief  div#dismiss(a|i)bleを得る
     *  @note   youtubeはdismissibleをdismissableとtypoしていた
     *  @note   21年2月下旬頃修正されたが、youtubeは鍼灸混在がよくあるので
     *  @note   どちらでも対応できるよう細工しておく…いずれ外す
     */
    static get_div_dismissble() {
        if ($("div#dismissable").length > 0) {
            return "div#dismissable"
        } else 
        if ($("div#dismissible").length > 0) {
            return "div#dismissible"
        } else {
            return "";
        }
    }

    /*!
     *  @brief  自動再生を無効化する
     */
    static disable_autoplay() {
        const button = "button.ytp-button";
        $(button).each((inx, btn)=> {
            var tgt_id =  $(btn).attr("data-tooltip-target-id");
            if (tgt_id != "ytp-autonav-toggle-button") {
                return;
            }
            var btn_core  = $(btn).find("div.ytp-autonav-toggle-button");
            if (btn_core.length <= 0) {
                return;
            } 
            if (HTMLUtil.in_disappearing(btn)) {
                return; // 非表示中は操作できない
            }
            const press = $(btn_core).attr("aria-checked");
            if (press == null) {
                return;
            }
            const clicked = $(btn).attr("clicked");
            if (press == "true") {
                // 連打禁止
                if (clicked == null) {
                    $(btn).attr("clicked", "true");
                    btn.click();
                }
            } else {
                $(btn).removeAttr("clicked");
            }
        });
    }

    /*!
     *  @brief  'アノテーション'か？
     *  @param  label   ラベル文字列
     *  @note   同じ構造のトグルスイッチが複数あり"アノテーション"用を
     *  @note   特定するためには文字列判定するしかなさそう
     *  @note   言語依存するのであんまりやりたくないが…
     */
    static is_annotation(label) {
        const txt = text_utility.remove_new_line_and_space(label);
        return txt == "アノテーション" ||
               txt == "Anmerkungen" ||
               txt == "Annotations" ||
               txt == "Anotações" ||
               txt == "註解";
    }
    /*!
     *  @brief  'アノテーション'を無効化する
     */
    static disable_annotation() {
        // ポップアップメニューの'アノテーション'オフ
        const menu = $("div.ytp-popup.ytp-settings-menu");
        if (menu.length > 0) {
            $(menu[0]).find("div.ytp-menuitem").each((inx, mitm)=> {
                const label = $(mitm).find("div.ytp-menuitem-label");
                if (label.length == 0 ||
                    !YoutubeUtil.is_annotation($(label[0]).text())) {
                    return true;
                }
                const press = $(mitm).attr("aria-checked");
                if (press != null && press == "true") {
                    mitm.click();
                }
                return false;
            });
        }
        // 'アノテーション'オフにした時の処理を擬似的に行う
        const disp_off_node_name = [
            "button.ytp-button.ytp-cards-button", // お知らせマーク
            "div.ytp-cards-teaser", // おすすめ動画表示
            "div.ytp-player-content.ytp-iv-player-content" // チャンネル登録ボタン等
        ];
        for (const tag of disp_off_node_name) {
            $(tag).each((inx, an_node)=> {
                $(an_node).attr("style", "display: none;");
            });
        }
    }

    static search_renderer_root(elem) {
        const is_root = function(e) {
            if (e.localName == null ) {
                return false;
            }
            const ln = e.localName.valueOf();
            return ln == 'ytd-video-renderer' ||
                   ln == 'ytd-channel-renderer' ||
                   ln == 'ytd-playlist-renderer' ||
                   ln == 'ytd-reel-item-renderer' ||
                   ln == 'ytd-reel-video-renderer' ||
                   ln == 'ytd-rich-grid-media' ||
                   ln == 'ytd-rich-grid-slim-media' ||
                   ln == 'ytd-grid-video-renderer' ||
                   ln == 'ytd-grid-channel-renderer' ||
                   ln == 'ytd-compact-video-renderer' ||
                   ln == 'ytd-rich-grid-video-renderer' ||
                   ln == 'ytd-compact-playlist-renderer';
        };
        return HTMLUtil.search_upper_node(elem, is_root);
    }
}
