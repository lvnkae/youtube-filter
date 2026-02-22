/*!
 *  @brief  Youtube関連Utility
 */
const AUTHOR_EXTRACTOR = /(@|user\/|channel\/|c\/)([^/?#]+)/;
// 日|米|瑞|伯|繁|独
const COLLABO_EXTRACTOR
    = /^([^"]+?)(?:、他 \d+ チャンネル| and \d+ more| och \d+ till| e mais \d+|和\d+| und \d+(\s|\u00A0)weitere)$/u;
function cut_collabo_channel(text) {
    const match = text.match(COLLABO_EXTRACTOR);
    if (match != null) {
        return match[1];
    } else {
        return "";
    }
}
function cut_collabo_channel_2nd(channel, collabo_ch) {
    const match = collabo_ch.match(
        RegExp('^' + channel +  '\s?(、|and |och |e |和|und )([^"]+?)$', "u"));
    if (match != null) {
        return match[2];
    } else {
        return null;
    }
}

const ATTR_CLICKED = "clicked";
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

    static is_channel_link(author_url) {
        return YoutubeUtil.is_channel_url(author_url) ||
               YoutubeUtil.is_userpage_url(author_url) ||
               YoutubeUtil.is_uniquepage_url(author_url);
    }

    static is_shorts(author_url) {
        return author_url.indexOf("/shorts/") >= 0;
    }

    static is_list_link(link) {
        return link.indexOf("&list=") >= 0 ||
               link.indexOf("?list=") >= 0;
    }
    static is_mixlist_link(link) {
        return link.indexOf("&start_radio") >= 0;
    }

    static is_handle_author(author) {
        return author[1] === '@';
    }
    static is_channel_id_author(author) {
        return author[1] === 'channel/';
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
     *  @brief  Youtubeチャンネルリンクから主を切り出す
     *  @retval ret[1] '@'          / ret[0] handle
     *  @retval ret[0] 'c/'         / ret[2] custom-channel
     *  @retval ret[0] 'user/'      / ret[2] username
     *  @retval ret[1] 'channel/'   / ret[2] channel-id
     *  @note   正規表現高速化版
     */
    static cut_channel_author(channel_href) {
        return channel_href.match(AUTHOR_EXTRACTOR);
    }
    static cut_channel_author2(channel_href) {
        const author = YoutubeUtil.cut_channel_author(channel_href);
        if (author == null) {
            return null;
        }
        if (YoutubeUtil.is_handle_author(author)) {
            return author[0];
        } else {
            return author[2];
        }
    }    
    /*!
     *  @brief  YoutubeチャンネルリンクからIDを切り出す
     *  @retval null    channel_hrefが/channel/でない
     */
    static cut_channel_id2(channel_href) {
        if (channel_href != null) {
            const ret = YoutubeUtil.cut_channel_author(channel_href);
            if (ret != null) {
                if (ret[1] === "channel/") {
                    return ret[2];
                }
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
    static cut_live_hash(link) {
        const sp_href = link.split("/");
        const sp_href_no_opt = sp_href[sp_href.length-1].split("?");
        return sp_href_no_opt[0];
    }
    static cut_short_movie_hash(link) {
        const sp_href = link.split("/");
        return sp_href[sp_href.length-1];
    }

    /*!
     *  @brief  Youtube動画linkからハッシュを得る
     *  @param  link    url
     */
    static get_video_hash_by_link(link) {
        if (link.indexOf("watch?v=") >= 0) {
            return YoutubeUtil.cut_movie_hash(link);
        } else
        if (link.indexOf("/live/") >= 0) {
            return YoutubeUtil.cut_live_hash(link);
        } else
        if (link.indexOf("/shorts/") >= 0) {
            return YoutubeUtil.cut_short_movie_hash(link);
        }
        return "";
    }

    /*!
     *  @brief  Youtube動画ノードからハッシュを得る
     *  @param  nd_hash ハッシュ取得ノード
     */
    static get_video_hash_by_node(nd_hash) {
        if (nd_hash != null) {
            const link = nd_hash.href;
            return YoutubeUtil.get_video_hash_by_link(link);
        }
        return "";
    }
    /*!
     *  @brief  Youtube動画ノードからハッシュを得る
     *  @param  elem    動画ベースノード
     *  @param  tag     ハッシュ取得タグ
     */
    static get_video_hash(elem, tag) {
        return YoutubeUtil.get_video_hash_by_node(elem.querySelector(tag));
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
        if (nd_hash != null) {
            const link = nd_hash.href;
            return YoutubeUtil.get_playlist_hash(link);
        } else {
            return "";
        }
    }

    static get_content_title_tag() {
        return "a#video-title";
    }
    static get_span_content_title_tag() {
        return "span#video-title";
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
    static get_lockup_vm_title_tag() {
        return "a.yt-lockup-metadata-view-model-wiz__title";
    }
    static get_lockup_vm_title_tag2() { /* 2025/08/28以降 */
        return "a.yt-lockup-metadata-view-model__title";
    }
    static get_lockup_vm_link_tag() {
        return "a.yt-lockup-view-model-wiz__content-image";
    }
    static get_lockup_vm_link_tag2() { /* 2025/08/28以降 */
        return "a.yt-lockup-view-model__content-image";
    }    
    static get_lockup_vm_metadata_tag() {
        return "div.yt-content-metadata-view-model-wiz__metadata-row";
    }
    static get_lockup_vm_metadata_tag2() {/* 2025/08/28以降 */
        return "div.yt-content-metadata-view-model__metadata-row";
    }    
    static get_lockup_vm_channel_tag() {
        return "a.yt-core-attributed-string__link";
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
        const e_channel_header = document.querySelector("div#channel-header");
        if (e_channel_header != null) {
            const e_channel_name =
                e_channel_header.querySelector(YoutubeUtil.get_channel_name_tag());
            if (e_channel_name != null) {
                return e_channel_name.textContent;
            }
        }
        const tag_topic_name = YoutubeUtil.get_channel_topic_tag();
        const e_channel_topic = document.querySelector(tag_topic_name);
        if (e_channel_topic != null) {
            return e_channel_topic.textContent;
        }
        const e_channel_sp_grp
            = document.body.querySelectorAll(YoutubeUtil.get_channel_sp_tag());
        const e_channel_sp = HTMLUtil.find_first_visible_element(e_channel_sp_grp);
        if (e_channel_sp != null) {
            const e_h1 = HTMLUtil.search_node(e_channel_sp, "h1", e=>{
                return e.hasAttribute("aria-label") && HTMLUtil.is_visible(e);
            });
            if (e_h1 != null) {
                return e_h1.textContent;
            }
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
            return HTMLUtil.find_first_appearing_element_fast(e_channel_name, ch_tag);
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
            return ch_node.textContent;
        } else {
            return "";
        }
    }
    /*!
     *  @brief  チャンネル名を得る
     *  @note   short(チャンネル名なし)/collabo-channelで使用
     */
    static get_attribute_channel_name(elem) {
        return elem.getAttribute("channel_name");
    }
    /*!
     *  @brief  チャンネル名をセットする
     *  @note   short(チャンネル名なし)/collabo-channelで使用
     */
    static set_attribute_channel_name(elem, channel_name) {
        elem.setAttribute("channel_name", channel_name);
    }
    static clear_attribute_channel_name(elem) {
        elem.removeAttribute("channel_name");
    }    
    /*!
     *  @brief  チャンネル名を得る
     *  @note   collabo-channelでYoutubeが使用
     */
    static get_attributed_channel_name(elem) {
        const e_channel = elem.querySelector("div#attributed-channel-name");
        if (e_channel != null) {
            return e_channel.textContent;
        } else {
            return '';
        }
    }    

    /*!
     *  @brief  複合チャンネル情報取得(home/sports/live)
     */
    static get_home_collabo_channel_info(elem, collabo_ch) {
        let ret = {};
        const elem_avatar = elem.querySelector("a#avatar-link")
        ret.channel = cut_collabo_channel(collabo_ch);
        ret.author_url = elem_avatar.href;
        return ret;
    }
    /*!
     *  @brief  複合チャンネル情報取得(検索ページ)
     */
    static get_searched_collabo_channel_info(elem, collabo_ch) {
        let ret = {};
        const elem_thumb = elem.querySelector("a#channel-thumbnail")
        ret.channel = cut_collabo_channel(collabo_ch);
        ret.author_url = elem_thumb.href;
        return ret;
    }
    /*!
     *  @brief  複合チャンネルの2チャンネル目切り出し
     *  @param  channel     親チャンネル名
     *  @param  collabo_ch  複合チャンネル文字列
     *  @retval null        pair-collaboではない
     */
    static cut_collabo_channel_2nd(channel, collabo_ch) {
        if (!COLLABO_EXTRACTOR.test(collabo_ch)) {
            return cut_collabo_channel_2nd(channel, collabo_ch);
        }
        return null;
    }
    /*!
     *  @brief  channel主体の複合チャンネルか
     *  @param  channel     親チャンネル名
     *  @param  collabo_ch  複合チャンネル文字列
     */    
    static is_collabo_channel(channel, collabo_ch) {
        let result = true;
        let ch2nd = null;
        if (COLLABO_EXTRACTOR.test(collabo_ch)) {
            result = true;
        } else {
            ch2nd = cut_collabo_channel_2nd(channel, collabo_ch);
            result = ch2nd != null;
        }
        return { result:result, ch2nd:ch2nd }
    }    

    /*!
     *  @brief  ショート動画(reel)のチャンネル名ノードを得る
     *  @note   24年11月以降の構成対応
     */
    static get_short_reel_channel_elem(elem) {
        return elem.querySelector("yt-reel-channel-bar-view-model");
    }
    static get_short_reel_channel_name(elem) {
        const e_channel = YoutubeUtil.get_short_reel_channel_elem(elem);
        if (e_channel != null) {
            const e_a = e_channel.querySelector("a");
            if (e_a != null) {
                return e_a.textContent;
            }
        }
        return "";
    }

    /*!
     *  @note   25年07月以降の構成(lockup-view-model)用
     */
    static get_lockup_vm_metadata_elem(elem) {
        const elem_rows = elem.querySelector(YoutubeUtil.get_lockup_vm_metadata_tag2());
        if (elem_rows != null) {
            return elem_rows;
        } else {
            return elem.querySelector(YoutubeUtil.get_lockup_vm_metadata_tag());
        }
    }
    /*!
     *  @brief  動画linkノードを得る
     *  @note   25年07月以降の構成(lockup-view-model)用
     */
    static get_lockup_vm_link_elem(elem) {
        const elem_link = elem.querySelector(YoutubeUtil.get_lockup_vm_link_tag2());
        if (elem_link != null) {
            return elem_link;
        } else {
            return elem.querySelector(YoutubeUtil.get_lockup_vm_link_tag());
        }        
    }
    /*!
     *  @brief  動画タイトルノードを得る
     *  @note   25年07月以降の構成(lockup-view-model)用
     */
    static get_lockup_vm_title_elem(elem) {
        const elem_title = elem.querySelector(YoutubeUtil.get_lockup_vm_title_tag2());
        if (elem_title != null) {
            return elem_title;
        } else {
            return elem.querySelector(YoutubeUtil.get_lockup_vm_title_tag());
        }
    }
    /*!
     *  @brief  チャンネルノードを得る
     *  @note   25年07月以降の構成(lockup-view-model)用
     */
    static get_lockup_vm_channel_element(elem) {
        if (elem == null) {
            return null;
        }
        const rows = YoutubeUtil.get_lockup_vm_metadata_elem(elem);
        if (rows == null) {
            return null;
        }
        return rows.querySelector("span.yt-core-attributed-string");
    }
    /*!
     *  @note   チャンネルページ専用/チャンネル名なしを考慮
     */
    static get_lockup_vm_channel_page_channel_element(elem) {
        const elem_link = YoutubeUtil.get_lockup_vm_channel_link_element(elem);
        if (elem_link == null) {
            return null;
        } else {
            return HTMLUtil.search_parent_node(elem_link, (e)=> {
                return e.localName === "span" &&
                       e.className.startsWith("yt-core-attributed-string");
            });
        }
    }
    /*!
     *  @brief  link付きチャンネルノードを得る
     *  @note   25年07月以降の構成(lockup-view-model)用
     */    
    static get_lockup_vm_channel_link_element(elem) {
        if (elem == null) {
            return null;
        }
        const rows = YoutubeUtil.get_lockup_vm_metadata_elem(elem);
        if (rows == null) {
            return null;
        }
        const elem_link = rows.querySelector(YoutubeUtil.get_lockup_vm_channel_tag());
        if (elem_link == null) {
            // チャンネル名ノードが無いパターン/[MIXリスト]含む
            return null;
        }
        const author_url = elem_link.href;
        if (!YoutubeUtil.is_channel_link(author_url)) {
            // チャンネル名ノードはあるが他の使い方されてるパターン[MIXリスト]
            return null;
        }
        return elem_link;
    }    
    /*!
     *  @brief  チャンネル名を得る
     *  @note   25年07月以降の構成(lockup-view-model)用
     */
    static get_lockup_vm_channel_name(elem) {
        const elem_channel = YoutubeUtil.get_lockup_vm_channel_element(elem);
        if (elem_channel == null) {
            return null;
        }
        return elem_channel.textContent;
    }

    /*!
     *  @brief  コメントを得る
     *  @note   textだけでなく絵文字も切り出す
     */
    static get_comment(elem_comment) {
        let ret = {};
        ret.comment = "";
        ret.reply_id = null;
        const wrap
            = "span"
            + ".yt-core-attributed-string"
            + ".yt-core-attributed-string--white-space-pre-wrap";
        const elem_wrap = elem_comment.querySelector(wrap);
        let err = 0;
        if (elem_wrap != null) {
            for (const ch of elem_wrap.childNodes) {
                if (ch.nodeName === "#text") {
                    ret.comment += ch.nodeValue;
                } else if (ch.nodeName === "SPAN") {
                    const attr_dir = ch.getAttribute("dir");
                    if (attr_dir != null && attr_dir === "auto") {
                        const elem_a = ch.querySelector("a");
                        if (elem_a != null) {
                            ret.reply_id = YoutubeUtil.cut_channel_id2(elem_a.href);
                        }
                    } else if (ch.className.indexOf("string--inline") > 0) {
                        const elem_img = ch.querySelector("img");
                        const src = elem_img.getAttribute("src");
                        if (src != null) {
                            const emoji_key = '/emoji_u';
                            const emoji_top = src.indexOf(emoji_key);
                            if (emoji_top > 0) {
                                const emoji_end = src.indexOf('.', emoji_top);
                                if (emoji_end > emoji_top) {
                                    const sbs_top = emoji_top + emoji_key.length;
                                    const sbs_end = emoji_end;
                                    const emoji_u
                                        = src.substring(sbs_top, sbs_end).split('_');
                                    emoji_u.forEach((emoji_code)=> {
                                        ret.comment
                                            += String.fromCodePoint('0x' + emoji_code);
                                    });
                                }
                            }
                        }
                    }
                }
            }
         }
        return ret;
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
    static get_reel_shelf_header2_tag() {
        return "ytd-reel-shelf-renderer.style-scope.ytd-watch-next-secondary-results-renderer";
    }
    static get_rich_shelf_header_tag() {
        return "ytd-rich-shelf-renderer.style-scope.ytd-rich-section-renderer";
    }
    static get_rich_grid_header_tag() {
        return "ytd-rich-grid-renderer.style-scope";
    }
    static get_horizontal_list_header_tag() {
        return "ytd-horizontal-card-list-renderer.style-scope.ytd-item-section-renderer";
    }

    /*!
     *  @brief  水平配置動画群のヘッダクリアリングを許可する
     *  @note   要素未生成段階(準備中)でのヘッダ削除禁止
     */
    static permit_clearing_section_list_header_core(tag) {
        for (const elem of document.body.querySelectorAll(tag)) {
            const sc_container = elem.querySelector("div#scroll-container");
            if (sc_container == null) {
                continue;
            }
            const items = HTMLUtil.search_children(sc_container, e=> {
                return e.localName === "div" && e.id === "items";
            });
            if (items != null && items.childNodes.length > 0) {
                elem.setAttribute('ready', '');
            }
        }
    }
    static permit_clearing_section_list_header() {
        const t_reel = YoutubeUtil.get_reel_shelf_header_tag();
        YoutubeUtil.permit_clearing_section_list_header_core(t_reel);
        const t_ytd_reel = "ytd-shelf-renderer";
        YoutubeUtil.permit_clearing_section_list_header_core(t_ytd_reel);
        const t_horizontal = YoutubeUtil.get_horizontal_list_header_tag();
        YoutubeUtil.permit_clearing_section_list_header_core(t_horizontal);
    }
    /*!
     *  @brief  動画群のヘッダをクリアリングする
     *  @note   属する動画が(フィルタリングされて)空ならヘッダも削除
     */
    static clearing_section_list_header_core(tag) {
        for (const elem of document.body.querySelectorAll(tag)) {
            if (elem.hasAttribute('ready') == null) {
                continue;
            }
            const sc_container = elem.querySelector("div#scroll-container");
            if (sc_container == null) {
                continue;
            }
            const items = HTMLUtil.search_children(sc_container, e=> {
                return e.localName === "div" && e.id === "items";
            });
            const right_arrow = elem.querySelector("div#right-arrow");
            if (items == null ||
                right_arrow == null ||
                items.childNodes.length > 0) {
                continue;
            }
            const button_renderer = right_arrow.querySelector("ytd-button-renderer");
            if (HTMLUtil.is_visible(button_renderer)) {
                // 右矢印ボタンが表示されていたらclick(scroll)してみる
                // (未取得の要素取得要求)
                if (!button_renderer.hasAttribute(ATTR_CLICKED)) {
                    // 連射禁止
                    button_renderer.setAttribute(ATTR_CLICKED, '');
                    button_renderer.click();
                }
            } else {
                // 要素が空かつ追加要素もない
                elem.remove();
            }
        }
    }    
    static clearing_section_list_header() {
        // shorts(slim)
        const t_reel = YoutubeUtil.get_reel_shelf_header_tag();
        YoutubeUtil.clearing_section_list_header_core(t_reel);
        // チャンネル/spチャンネルページホーム動画群
        const t_ytd_reel = "ytd-shelf-renderer";
        YoutubeUtil.clearing_section_list_header_core(t_ytd_reel);
        // spチャンネルページ動画群
        const t_horizontal = YoutubeUtil.get_horizontal_list_header_tag();
        YoutubeUtil.clearing_section_list_header_core(t_horizontal);
    }

    /*!
     *  @brief  ぐるぐる対策
     *  @note   コンテンツdetachで読み込み中マークが残ってしまう件
     */
    static remove_spiner_renderer(e_parent) {
        const tag_continuation = "ytd-continuation-item-renderer";
        for (const spin of e_parent.getElementsByTagName(tag_continuation)) {
            const e_next = spin.nextSibling;
            if (e_next != null && e_next.offsetParent != null) {
                spin.remove();
            }
        }
    }

    /*!
     *  @brief  回転式動画バナーを除去する
     *  @note   gamingはchannelから専用ページ化された(19年春頃？)
     *  @note   sportsははやく専用ページ化してほしい
     */
    static remove_carousel_banner() {
        // フィルタ対象動画が含まれていても部分的には消せないので全消し
        const tag = "div#carousel-item.style-scope.ytd-carousel-item-renderer";
        const elem = document.querySelector(tag);
        if (elem != null) {
            elem.remove();
        }
    }

    /*!
     *  @brief  自動再生を無効化する
     */
    static disable_autoplay() {
        const e_controls = document.querySelector("div.ytp-right-controls-left");
        if (e_controls == null) {
            return;
        }
        const button = "button.ytp-button";
        for (const btn of e_controls.querySelectorAll(button)) {
            const tgt_id = btn.getAttribute("data-tooltip-target-id");
            if (tgt_id !== "ytp-autonav-toggle-button") {
                continue;
            }
            const btn_core = btn.querySelector("div.ytp-autonav-toggle-button");
            if (btn_core == null) {
                break;
            } 
            if (btn.offsetParent == null) {
                break; // 非表示中は操作できない
            }
            const press = btn_core.getAttribute("aria-checked");
            if (press == null) {
                break;
            }
            const ATTR_CLICKED = "clicked";
            if (press === "true") {
                // 連打禁止
                if (!btn.hasAttribute(ATTR_CLICKED)) {
                    btn.setAttribute(ATTR_CLICKED, "");
                    btn.click();
                }
            } else
            if (btn.hasAttribute(ATTR_CLICKED)) {
                btn.removeAttribute(ATTR_CLICKED);
            }
            break;
        }
    }

    /*!
     *  @brief  動画再生設定から指定項目を得る
     *  @param  func    判定関数
     */
    static get_player_setting_elem(func) {
        let ret_item = null;
        const menu = document.querySelector("div.ytp-popup.ytp-settings-menu");
        if (menu != null) {
            for (const menuitem of menu.querySelectorAll("div.ytp-menuitem")) {
                const e_label = HTMLUtil.search_children(menuitem, (e)=>{
                    return e.className === "ytp-menuitem-label";
                });
                if (e_label != null) {
                    if (func(e_label.textContent)) {
                        ret_item = menuitem;
                        break;
                    }
                }
            }
        }
        return ret_item;
    }

    /*!
     *  @brief  'アノテーション'か？
     *  @param  label   ラベル文字列
     *  @note   同じ構造のトグルスイッチが複数あり"アノテーション"用を
     *  @note   特定するためには文字列判定するしかなさそう
     *  @note   言語依存するのであんまりやりたくないが…
     */
    static is_annotation(label) {
        return label === "アノテーション" ||
               label === "Annoteringar" ||  /* 瑞 */
               label === "Anmerkungen" ||   /* 独 */
               label === "Annotations" ||
               label === "Anotações" ||     /* 伯 */
               label === "註解";            /* 繁 */
    }
    /*!
     *  @brief  'アノテーション'を無効化する
     */
    static disable_annotation() {
        const e_player = document.querySelector("div.html5-video-player");
        if (e_player == null) {
            return;
        }
        // 動画再生設定の'アノテーション'オフ
        let menu_item = YoutubeUtil.get_player_setting_elem(YoutubeUtil.is_annotation);
        if (menu_item != null) {
            const press = menu_item.getAttribute("aria-checked");
            if (press != null && press === "true") {
                menu_item.click();
            }
        }
        // 'アノテーション'オフにした時の処理を擬似的に行う
        const disp_off_node_name = [
            "button.ytp-button.ytp-cards-button", // お知らせマーク
            "div.ytp-cards-teaser", // おすすめ動画表示
            "div.ytp-player-content.ytp-iv-player-content", // チャンネル登録ボタン等
            "div.annotation.annotation-type-custom.iv-branding", // 右下チャンネルアイコン
        ];
        for (const tag of disp_off_node_name) {
            for (const an_node of e_player.querySelectorAll(tag)) {
                an_node.hidden = true;
            }
        }
    }

    /*!
     *  @brief  'スリープタイマー'か？
     *  @param  label   ラベル文字列
     */
    static is_sleeptimer(label) {
        return label === "Timerdesuspensão" ||  /* 伯 */
               label === "スリープタイマー" ||
               label === "スリープ タイマー" ||
               label === "Ruhemodus-Timer" ||   /* 独 */
               label === "Sleeptimer" ||
               label === "睡眠計時器" ||        /* 繁 */
               label === "Sovtimer";            /* 瑞 */
    }
    /*!
     *  @brief  動画再生設定から'スリープタイマー'を消す
     */
    static remove_sleeptimer() {
        const menu_item = YoutubeUtil.get_player_setting_elem(YoutubeUtil.is_sleeptimer);
        if (menu_item != null) {
            menu_item.hidden = true;
        }
    }

    /*!
     *  @brief  thumbnailのborder-radiusを無効化する
     */
    static disable_border_radius_of_thumbnail() {
        // inlineed-cssの置き換え
        const NLC = text_utility.new_line_code_lf();
        let head_style = document.createElement('style');
        head_style.textContent =
            'ytd-thumbnail[size=large] a.ytd-thumbnail,ytd-thumbnail[size=large]:before { border-radius: 0px; }' + NLC +
            'ytd-thumbnail[size=large][large-margin] a.ytd-thumbnail, ytd-thumbnail[size=large][large-margin]:before { border-radius: 0px; }' + NLC +
            'ytd-thumbnail[size=medium] a.ytd-thumbnail,ytd-thumbnail[size=medium]:before { border-radius: 0px; }' + NLC +
            'ytd-playlist-thumbnail[size=large] a.ytd-playlist-thumbnail,ytd-playlist-thumbnail[size=large]:before { border-radius: 0px; }' + NLC +
            'ytd-playlist-thumbnail[size=medium] a.ytd-playlist-thumbnail,ytd-playlist-thumbnail[size=medium]:before { border-radius: 0px; }' + NLC +
            '.yt-thumbnail-view-model--medium { border-radius: 0px; }' + NLC + /* home(24/11) */
            '.yt-thumbnail-view-model--large { border-radius: 0px; }' + NLC + /* home(25/07) */
            '.ytThumbnailViewModelLarge { border-radius: 0px; }' + NLC + /* home(25/08) */
            '.ytThumbnailViewModelMedium { border-radius: 0px; }' + NLC + /* recommend(25/08) */
            'ytd-channel-video-player-renderer[rounded] #player.ytd-channel-video-player-renderer { border-radius: 0px; }' + NLC +
            'ytd-reel-video-renderer[is-watch-while-mode]:not([enable-player-metadata-container]) .player-container.ytd-reel-video-renderer { border-radius: 0px; }' + NLC + /* short */
            'ytd-reel-video-renderer[enable-anchored-panel][is-persistent-panel-active]:not([enable-player-metadata-container]) .player-container.ytd-reel-video-renderer { border-radius: 0px; }' + NLC + /* shortV2 */
            'ytd-reel-video-renderer[is-watch-while-mode] .player-container.ytd-reel-video-renderer { border-radius: 0px; }' + NLC + /* short(old) */
            '.metadata-container.ytd-reel-player-overlay-renderer { border-radius: 0px; }' + NLC + /* short(overlay) */
            '.ShortsLockupViewModelHostThumbnailContainerRounded { border-radius: 0px; }' + NLC + /* insert-shorts(V2) */
            '.shortsLockupViewModelHostThumbnailContainerRounded { border-radius: 0px; }' + NLC + /* insert-shorts(V2-2) */
            '.shortsLockupViewModelHostThumbnailParentContainerRounded { border-radius: 0px; }' + NLC + /* insert-shorts(V2-2-250815) */
            'ytd-watch-flexy[rounded-player-large][default-layout] #ytd-player.ytd-watch-flexy { border-radius: 0px; }' + NLC + /* watch */
            'ytd-watch-flexy[rounded-player] #ytd-player.ytd-watch-flexy { border-radius: 0px; }' + NLC + /* watch(25/07) */
            'ytd-watch-grid[rounded-player-large][default-layout] #ytd-player.ytd-watch-grid { border-radius: 0px; }' + NLC + /* watch */
            '.image-wrapper.ytd-hero-playlist-thumbnail-renderer { border-radius: 0px; }' + NLC +
            '.player-container.ytd-reel-video-renderer { border-radius: 0px; }';
        document.head.appendChild(head_style);
        // www-player.cssの置き換え(headだと負ける)
        let body_style = document.createElement('style');
        body_style.textContent = 
            'ytd-video-preview:not([has-endorsement]) #inline-preview-player.ytp-rounded-inline-preview' +
            ',ytd-video-preview:not([has-endorsement]) #inline-preview-player.ytp-rounded-inline-preview' +
            ' .html5-main-video { border-radius: 0px; }' + NLC +
            '.ytp-ce-video.ytp-ce-large-round, .ytp-ce-playlist.ytp-ce-large-round, .ytp-ce-large-round' +
            '.ytp-ce-expanding-overlay-background { border-radius: 0px }' + NLC +
            '.ytp-videowall-still-round-large .ytp-videowall-still-image { border-radius: 0px }' + NLC + /* thumb(endscreen 25/07) */
            '.ytp-modern-videowall-still-image { border-radius: 0px }';
        document.body.appendChild(body_style);
    }

    static search_renderer_root(elem) {
        const is_root = function(e) {
            if (e.localName == null ) {
                return false;
            }
            const ln = e.localName;
            return ln === 'ytd-video-renderer' ||
                   ln === 'ytd-channel-renderer' ||
                   ln === 'ytd-playlist-renderer' ||
                   ln === 'ytd-reel-item-renderer' ||
                   ln === 'ytd-reel-video-renderer' ||
                   ln === 'ytd-rich-grid-media' ||
                   ln === 'ytd-rich-grid-slim-media' ||
                   ln === 'ytd-rich-grid-video-renderer' ||
                   ln === 'ytd-rich-item-renderer' ||
                   ln === 'ytd-grid-video-renderer' ||
                   ln === 'ytd-grid-channel-renderer' ||
                   ln === 'ytd-grid-show-renderer' ||
                   ln === 'ytd-grid-playlist-renderer' ||
                   ln === 'ytd-compact-video-renderer' ||
                   ln === 'yt-lockup-view-model';
        };
        return HTMLUtil.search_parent_node(elem, is_root);
    }
    static search_shorts_renderer_root(elem) {
        const is_root = function(e) {
            if (e.localName == null ) {
                return false;
            }
            const ln = e.localName;
            return ln == 'ytm-shorts-lockup-view-model-v2';
        };
        return HTMLUtil.search_parent_node(elem, is_root);
    }

    static search_preview_node(elem) {
        const is_preview = function(e) {
            if (e.localName == null) {
                return false;
            }
            const ln = e.localName;
            return ln.indexOf('ytd-video-preview') >= 0 ||
                   ln.indexOf('ytd-inline-preview') >= 0 ||
                   ln.indexOf('ytd-rounded-inline-preview') >= 0;
        };
        if (is_preview(elem)) {
            return elem;
        }
        return HTMLUtil.search_parent_node(elem, is_preview);
    }

    static get_filtered_marker(element) {
        return element.getAttribute("marker");
    }
    static set_filtered_marker(element, marker) {
        element.setAttribute("marker", marker);
    }    
    static remove_filtered_marker(element) {
        element.removeAttribute("marker");
    }

    static has_renderer_node_channel_id(element) {
        return element.hasAttribute("channel_id")
    }
    static get_renderer_node_channel_id(element) {
        return element.getAttribute("channel_id");
    }
    static set_renderer_node_channel_id(element, channel_id) {
        element.setAttribute("channel_id", channel_id);
    }
    static remove_renderer_node_channel_id(element) {
        element.removeAttribute("channel_id");
    }
}
