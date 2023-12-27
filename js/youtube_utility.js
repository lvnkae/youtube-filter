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
    static is_handle_channel_url(author_url) {
        return author_url.indexOf("/@") >= 0;
    }
    static is_uniquepage_url(author_url) {
        return YoutubeUtil.is_custom_channel_url(author_url) ||
               YoutubeUtil.is_handle_channel_url(author_url);
    }

    static is_shorts(author_url) {
        return author_url.indexOf("/shorts/") >= 0;
    }

    static is_list_link(link) {
        return link.indexOf("&list=") >= 0 ||
               link.indexOf("?list=") >= 0;
    }

    /*!
     *  @brief  動画主情報からチャンネル名を切り出す
     */
    static get_channel_from_author_info(text) {
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
                return 'c/' + decodeURI(sp_href[inx+1]);
            }
        }
        for (var inx = 1; inx < sp_href.length; inx++) {
            if (sp_href[inx].startsWith('@')) {
                return sp_href[inx];
            }
        }
        return null;
    }
    /*!
     *  @brief  Youtube動画リンクからハッシュを切り出す
     *  @param  link    動画リンク
     */
    static cut_movie_hash(link) {
        const sp_href = link.split("?v=");
        const sp_href_no_opt = sp_href[sp_href.length-1].split("&");
        return sp_href_no_opt[0];
    }
    static cut_short_movie_hash(link) {
        const sp_href = link.split("/");
        return sp_href[sp_href.length-1];
    }

    /*!
     *  @brief  Youtube動画ノードからハッシュを得る
     *  @param  nd_hash ハッシュ取得ノード
     */
    static get_video_hash_by_node(nd_hash) {
        if (nd_hash.length > 0) {
            const link = $(nd_hash).attr("href");
            if (link.indexOf("watch?v=") >= 0) {
                return YoutubeUtil.cut_movie_hash(link);
            } else
            if (link.indexOf("/shorts/") >= 0) {
                return YoutubeUtil.cut_short_movie_hash(link);
            }
        }
        return "";
    }
    /*!
     *  @brief  Youtube動画ノードからハッシュを得る
     *  @param  elem    動画ベースノード
     *  @param  tag     ハッシュ取得タグ
     */
    static get_video_hash(elem, tag) {
        return YoutubeUtil.get_video_hash_by_node($(elem).find(tag));
    }

    /*!
     *  @brief  Youtubeプレイリストノードからハッシュを得る
     *  @param  nd_hash ハッシュ取得ノード
     */
    static cut_playlist_hash(link, delimiter) {
        if (link.indexOf(delimiter) >= 0) {
            const sp_href = link.split(delimiter);
            const sp_href_no_opt = sp_href[sp_href.length-1].split("&");
            return sp_href_no_opt[0];
        }
        return "";
    }
    static get_playlist_hash(link) {
        let hash = "";
        const delimiter = ["&list=", "?list="];
        delimiter.forEach(det=> {
            if (hash.length == 0) {
                hash = YoutubeUtil.cut_playlist_hash(link, det);
            }
        });
        return hash;
    }
    static get_playlist_hash_by_node(nd_hash) {
        if (nd_hash.length > 0) {
            const link = $(nd_hash).attr("href");
            return YoutubeUtil.get_playlist_hash(link);
        } else {
            return "";
        }
    }

    static get_content_title_tag() {
        return "a#video-title";
    }
    static get_channel_name_tag() {
        return "yt-formatted-string#text.style-scope.ytd-channel-name";
    }
    static get_channel_topic_tag() {
        return "div#title.style-scope.ytd-interactive-tabbed-header-renderer";
    }
    static get_channel_sp_tag() {
        return "div#page-header.style-scope.ytd-tabbed-page-header";
    }
    static get_channel_link_tag() {
        return "a.yt-simple-endpoint.style-scope.yt-formatted-string";
    }
    static get_popup_container_tag() {
        return "ytd-popup-container.style-scope.ytd-app";
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
        const e_channel_name
            = $("div#channel-header").find(YoutubeUtil.get_channel_name_tag());
        if (e_channel_name.length > 0) {
            return $(e_channel_name).text();
        }
        const tag_topic_name = YoutubeUtil.get_channel_topic_tag();
        const e_channel_topic = $(tag_topic_name);
        if (e_channel_topic.length > 0) {
            return $(e_channel_topic).text();
        }
        const tag_sp_name = YoutubeUtil.get_channel_sp_tag();
        const e_channel_sp = $(tag_sp_name);
        if (e_channel_sp.length > 0) {
            const txt = $($(tag_sp_name)[0]).text();
            return text_utility.remove_blank_line_and_head_space(txt);
        }
        return null;
    }

    /*!
     *  @brief  チャンネル名ノードを得る
     *  @note   elem    基準ノード
     */
    static get_channel_name_element(elem) {
        const ch_tag = YoutubeUtil.get_channel_name_tag();
        return HTMLUtil.find_first_appearing_element(elem, ch_tag);
    } 
    /*!
     *  @brief  チャンネルリンクノードを得る
     *  @note   elem    基準ノード
     */
    static get_channel_link_element(elem) {
        const e_channel_name = YoutubeUtil.get_channel_name_element(elem);
        if (e_channel_name != null) {
            const ch_tag = YoutubeUtil.get_channel_link_tag();
            return HTMLUtil.find_first_appearing_element(e_channel_name, ch_tag);
        } else {
            return null;
        }
    }

    /*!
     *  @brief  チャンネル名を得る
     *  @note   elem    基準ノード
     */
    static get_channel_name(elem) {
        const ch_node = YoutubeUtil.get_channel_name_element(elem);
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
        let ch_node = YoutubeUtil.get_channel_name_element(elem);
        if (ch_node != null) {
            return $(ch_node).text(channel_name);
        }
    }
    /*!
     *  @brief  チャンネル名を削除する
     *  @note   elem    基準ノード
     */
    static remove_channel_name(elem) {
        let ch_node = YoutubeUtil.get_channel_name_element(elem);
        if (ch_node != null) {
            $(ch_node).text("");
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
     *  @brief  コメントIDを得る
     *  @note   コメント毎に割り振られるUniqueID
     */
    static get_comment_id(elem) {
        const tag_timestamp = "yt-formatted-string.published-time-text";
        const nd_timestamp = HTMLUtil.find_first_appearing_element(elem, tag_timestamp);
        const nd_a = $(nd_timestamp).find("a");
        if (nd_a.length > 0) {
            const href = $(nd_a).attr("href");
            const sp_href = href.split("&lc=");
            return sp_href[sp_href.length-1];
        }
        return "";
    }
    /*!
     *  @brief  返信数をセットする
     *  @note   0ならheaderごと削除
     *  @note   ※headerの使いまわしがあるらしくtextをいじると
     *  @note   ※コメント並べ替え時に不具合が生じるので
     *  @note   ※返信数変更機能は削除
     *  @note   (element追加/削除で処理されるせいでeventが消える？)
     */
    static set_num_reply_or_remove(comment_root, num) {
        const tag_cont = "ytd-continuation-item-renderer";
        const nd_continuation = $(comment_root).find(tag_cont);
        if (nd_continuation.children().length > 0) {
            return; // "他の返信を表示"があればスルー
        }
        if (num == 0) {
            const nd_replies = $(comment_root).find("div#replies");
            $(nd_replies).detach();
        }
    }

    /*!
     *  @brief  div#dismiss(a|i)bleを得る
     *  @note   youtubeはdismissibleをdismissableとtypoしていた
     *  @note   21年2月下旬頃修正されたが、youtubeは鍼灸混在がよくあるので
     *  @note   どちらでも対応できるよう細工しておく…いずれ外す
     */
    static get_div_dismissible() {
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
     *  @brief  水平配置動画群のヘッダタグを得る
     */
    static get_section_list_header_tag() {
        return "ytd-item-section-renderer.style-scope.ytd-section-list-renderer";
    }
    static get_reel_shelf_header_tag() {
        return "ytd-reel-shelf-renderer.style-scope.ytd-item-section-renderer";
    }
    static get_horizontal_list_header_tag() {
        return "ytd-horizontal-card-list-renderer.style-scope.ytd-item-section-renderer";
    }

    /*!
     *  @brief  水平配置動画群のヘッダクリアリングを許可する
     *  @note   要素未生成段階(準備中)でのヘッダ削除禁止
     */
    static permit_clearing_section_list_header_core(tag) {
        $(tag).each((inx, elem)=> {
            const sc_container = $(elem).find("div#scroll-container");
            if (sc_container.length <= 0) {
                return;
            }
            const items = $(sc_container).find("div#items");
            if (items.length <= 0) {
                return;
            }
            if (items[0].childNodes.length > 0) {
                $(elem).attr('ready', '');
            }
        });
    }
    static permit_clearing_section_list_header() {
        const t_reel = YoutubeUtil.get_reel_shelf_header_tag();
        YoutubeUtil.permit_clearing_section_list_header_core(t_reel);
        const t_horizontal = YoutubeUtil.get_horizontal_list_header_tag();
        YoutubeUtil.permit_clearing_section_list_header_core(t_horizontal);
    }
    /*!
     *  @brief  動画群のヘッダをクリアリングする
     *  @note   属する動画が(フィルタリングされて)空ならヘッダも削除
     */
    static clearing_section_list_header_core(tag) {
        $(tag).each((inx, elem)=> {
            if ($(elem).attr('ready') == null) {
                return;
            }
            const sc_container = $(elem).find("div#scroll-container");
            if (sc_container.length == 0) {
                return;
            }
            const items = $(sc_container).find("div#items");
            const right_arrow = $(elem).find("div#right-arrow");
            if (items.length == 0 ||
                right_arrow.length == 0 ||
                items[0].childNodes.length > 0) {
                return;
            }
            const button_renderer = $(right_arrow).find("ytd-button-renderer");
            if ($(button_renderer).is(':visible')) {
                // 右矢印ボタンが表示されていたらclick(scroll)してみる
                // (未取得の要素取得要求)
                if ($(button_renderer).attr('clicked') == null) {
                    // 連射禁止
                    $(button_renderer).attr('clicked', '');
                    $(button_renderer).click();
                }
            } else {
                // 要素が空かつ追加要素もない
                $(elem).detach();
            }
        });
    }    
    static clearing_section_list_header() {
        const t_reel = YoutubeUtil.get_reel_shelf_header_tag();
        YoutubeUtil.clearing_section_list_header_core(t_reel);
        const t_horizontal = YoutubeUtil.get_horizontal_list_header_tag();
        YoutubeUtil.clearing_section_list_header_core(t_horizontal);
    }

    /*!
     *  @brief  水平配置shortsをヘッダごと消し去る
     *  @note   属する動画が(フィルタリングされて)空ならヘッダも削除
     */
    static remove_shorts_whole_header_core(tag) {
        $(tag).each((inx, elem)=> {
            let num_thumb = 0;
            let num_shorts = 0;
            $(elem).find("a#thumbnail").each((inx, e_thumb)=> {
                num_thumb++;
                const url = $(e_thumb).attr("href");
                if (url == null) {
                    return;
                }
                if (YoutubeUtil.is_shorts(url)) {
                    num_shorts++;
                }
            });
            if (num_thumb > 0 && num_thumb == num_shorts) {
                $(elem).detach();
            }
        });
    }
    static remove_shorts_whole_header() {
        const t_reel = YoutubeUtil.get_reel_shelf_header_tag();
        YoutubeUtil.remove_shorts_whole_header_core(t_reel);
        const t_shelf
            = "ytd-rich-shelf-renderer.style-scope.ytd-rich-section-renderer";
        YoutubeUtil.remove_shorts_whole_header_core(t_shelf);
    }

    /*!
     *  @brief  ぐるぐる対策
     *  @note   コンテンツdetachで読み込み中マークが残ってしまう件
     */
    static remove_spiner_renderer(e_parent) {            
        $(e_parent).find("ytd-continuation-item-renderer").each((inx, spin)=> {
            const e_next = $(spin).next();
            if (e_next.length > 0 && $(e_next).attr("hidden") == null) {
                $(spin).detach();
            }
        });
    }

    /*!
     *  @brief  回転式動画バナーを除去する
     *  @note   gamingはchannelから専用ページ化された(19年春頃？)
     *  @note   sportsははやく専用ページ化してほしい
     */
    static remove_carousel_banner() {
        // フィルタ対象動画が含まれていても部分的には消せないので全消し
        var elem = $("div#carousel-item.style-scope.ytd-carousel-item-renderer");
        if (elem.length > 0) {
            $(elem).detach();
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
    /*!
     *  @brief  thumbnailのborder-radiusを無効化する
     */
    static disable_border_radius_of_thumbnail() {
        // inlineed-cssの置き換え
        const NLC = text_utility.new_line_code_lf();
        const anti_border_radius_head =
            'ytd-thumbnail[size=large] a.ytd-thumbnail,ytd-thumbnail[size=large]:before { border-radius: 0px; }' + NLC +
            'ytd-thumbnail[size=medium] a.ytd-thumbnail,ytd-thumbnail[size=medium]:before { border-radius: 0px; }' + NLC +
            'ytd-playlist-thumbnail[size=large] a.ytd-playlist-thumbnail,ytd-playlist-thumbnail[size=large]:before { border-radius: 0px; }' + NLC +
            'ytd-playlist-thumbnail[size=medium] a.ytd-playlist-thumbnail,ytd-playlist-thumbnail[size=medium]:before { border-radius: 0px; }' + NLC +
            'ytd-channel-video-player-renderer[rounded] #player.ytd-channel-video-player-renderer { border-radius: 0px; }' + NLC +
            'ytd-reel-video-renderer[is-watch-while-mode] .player-container.ytd-reel-video-renderer { border-radius: 0px; }' + NLC + /* short */
            'ytd-watch-flexy[rounded-player-large][default-layout] #ytd-player.ytd-watch-flexy { border-radius: 0px; }' + NLC + /* watch */
            '.image-wrapper.ytd-hero-playlist-thumbnail-renderer { border-radius: 0px; }' + NLC +
            '.player-container.ytd-reel-video-renderer { border-radius: 0px; }';
        $('head').append('<style>' + anti_border_radius_head + '</style>');
        // www.player.cssの置き換え(headだと負ける)
        const anti_border_radius_body =
            'ytd-video-preview:not([has-endorsement]) #inline-preview-player.ytp-rounded-inline-preview' +
            ',ytd-video-preview:not([has-endorsement]) #inline-preview-player.ytp-rounded-inline-preview' +
            ' .html5-main-video { border-radius: 0px; }' + NLC +
            '.ytp-ce-video.ytp-ce-large-round, .ytp-ce-playlist.ytp-ce-large-round, .ytp-ce-large-round' +
            ' .ytp-ce-expanding-overlay-background { border-radius: 0px }'
        $('body').append('<style>' + anti_border_radius_body + '</style>');
    }

    static search_renderer_root(elem) {
        const is_root = function(e) {
            if (e.localName == null ) {
                return false;
            }
            const ln = e.localName.valueOf();
            return ln == 'ytd-video-renderer' ||
                   ln == 'ytd-channel-renderer' ||
                   ln == 'ytd-radio-renderer' ||
                   ln == 'ytd-playlist-renderer' ||
                   ln == 'ytd-reel-item-renderer' ||
                   ln == 'ytd-reel-video-renderer' ||
                   ln == 'ytd-rich-grid-media' ||
                   ln == 'ytd-rich-grid-slim-media' ||
                   ln == 'ytd-rich-grid-video-renderer' ||
                   ln == 'ytd-grid-video-renderer' ||
                   ln == 'ytd-grid-channel-renderer' ||
                   ln == 'ytd-grid-show-renderer' ||
                   ln == 'ytd-grid-playlist-renderer' ||
                   ln == 'ytd-compact-video-renderer' ||
                   ln == 'ytd-compact-radio-renderer' ||
                   ln == 'ytd-compact-playlist-renderer';
        };
        return HTMLUtil.search_upper_node(elem, is_root);
    }

    static search_preview_node(elem) {
        const is_preview = function(e) {
            if (e.localName == null) {
                return false;
            }
            const ln = e.localName.valueOf();
            return ln.indexOf('ytd-video-preview') >= 0 ||
                   ln.indexOf('ytd-inline-preview') >= 0 ||
                   ln.indexOf('ytd-rounded-inline-preview') >= 0;
        };
        if (is_preview(elem)) {
            return elem;
        }
        return HTMLUtil.search_upper_node(elem, is_preview);
    }

    static get_filtered_marker(element) {
        return $(element).attr("marker");
    }
    static remove_filtered_marker(element) {
        $(element).removeAttr("marker");
    }
    static set_filtered_marker(element, marker) {
        return $(element).attr("marker", marker);
    }

    static set_renderer_node_channel_id(element, channel_id) {
        $(element).attr("channel_id", channel_id);
    }
    static remove_renderer_node_channel_id(element) {
        $(element).removeAttr("channel_id");
    }
    static debug_output_channel_id(element) {
        const channel_id = $(element).attr("channel_id")
        if (channel_id != null) {
            console.log("ch = " + channel_id);
        } else {
            console.log("ch = null");
        }
    }
}
