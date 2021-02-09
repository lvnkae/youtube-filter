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
     *  @brief  ページチャンネルURLを得る
     */
    static get_page_author_url() {
        return location.href;
    }
    /*!
     *  @brief  ページチャンネル名を得る
     */
    static get_page_channel_name() {
        const tag = "yt-formatted-string#text.style-scope.ytd-channel-name";
        const text_tag = $(tag);
        if (text_tag.length > 0) {
            return $(text_tag[0]).text();
        } else {
            return null;
        }
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
            if (!this.in_disappearing(e)) {
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

    static search_renderer_root(elem) {
        const is_root = function(e) {
            if (e.localName == null ) {
                return false;
            }
            const ln = e.localName.valueOf();
            return ln == 'ytd-video-renderer' ||
                   ln == 'ytd-channel-renderer' ||
                   ln == 'ytd-playlist-renderer' ||
                   ln == 'ytd-rich-grid-media' ||
                   ln == 'ytd-grid-video-renderer' ||
                   ln == 'ytd-grid-channel-renderer' ||
                   ln == 'ytd-compact-video-renderer' ||
                   ln == 'ytd-rich-grid-video-renderer' ||
                   ln == 'ytd-compact-playlist-renderer';
        };
        return YoutubeUtil.search_upper_node(elem, is_root);
    }

    static detach_upper_node(elem, tag) {
        const check_tag = function(e) {
            return e.localName == tag;
        }
        const nd = YoutubeUtil.search_upper_node(elem, check_tag);
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
}
