const detach_func = (elem) => { elem.remove(); }
/*!
 *  @brief  Googleフィルタ
 */
class GoogleFilter extends FilterBase {

    youtube_video_filter_core(elem, title, video_id, detach) {
        const mv_title = GoogleUtil.cut_googled_youtube_title(title);
        if (this.storage.title_filter(mv_title)) {
            detach(elem);
            return;
        }
        const channel_info = this.video_info_accessor.get_channel_info(video_id);
        if (channel_info != null) {
            if (this.storage.channel_id_filter(channel_info.id, mv_title)) {
                detach(elem);
            } else {
                GoogleUtil.set_channel_info(elem, channel_info.id, channel_info.name);
            }
        } else {
            this.video_info_accessor.entry(video_id);
        }
    }

    /*!
     *  @brief  Youtube動画フィルタ
     *  @param  elem    検索結果ノード
     *  @param  title   検索結果タイトル
     *  @param  url     検索結果url
     *  @param  detach  detach関数
     */
    youtube_video_filter(elem, title, url, detach) {
        const video_id = YoutubeUtil.cut_movie_hash(url);
        this.youtube_video_filter_core(elem, title, video_id, detach);
    }
    /*!
     *  @brief  YoutubeShortsフィルタ
     *  @param  elem    検索結果ノード
     *  @param  title   検索結果タイトル
     *  @param  url     検索結果url
     *  @param  detach  detach関数
     */
    youtube_shorts_filter(elem, title, url, detach) {
        const video_id = YoutubeUtil.cut_short_movie_hash(url);
        this.youtube_video_filter_core(elem, title, video_id, detach);
    }

    /*!
     *  @brief  Youtubeチャンネルフィルタ
     *  @param  elem    検索結果ノード
     *  @param  title   検索結果タイトル
     *  @param  url     検索結果url
     *  @param  detach  detach関数
     */
    youtube_channel_filter(elem, title, url, detach) {
        const channel = GoogleUtil.cut_googled_youtube_title(title);
        if (this.storage.channel_filter(channel)) {
            detach(elem);
            return;
        }
        if (YoutubeUtil.is_channel_url(url)) {
            const channel_id = YoutubeUtil.cut_channel_id(url);
            if (this.storage.channel_id_filter(channel_id)) {
                detach(elem);
            } else {
                GoogleUtil.set_channel_info(elem, channel_id, channel);
            }
        } else
        if (YoutubeUtil.is_userpage_url(url)) {
            const username = YoutubeUtil.cut_channel_id(url);
            const channel_id = this.author_info_accessor.get_channel_id(username);
            if (channel_id != null) {
                if (this.storage.channel_id_filter(channel_id)) {
                    detach(elem);
                } else {
                    GoogleUtil.set_channel_info(elem, channel_id, channel);
                }
            } else {
                this.author_info_accessor.entry(username);
            }
        } else
        if (YoutubeUtil.is_uniquepage_url(url)) {
            const unique_name = YoutubeUtil.cut_channel_id(url);
            const channel_id = this.channel_info_accessor.get_channel_id(unique_name);
            if (channel_id != null) {
                if (this.storage.channel_id_filter(channel_id)) {
                    detach(elem);
                } else {
                    GoogleUtil.set_channel_info(elem, channel_id, channel);
                }
            } else {
                this.channel_info_accessor.entry(unique_name);
            }
        }
    }

    /*!
     *  @brief  Youtubeプレイリストフィルタ
     *  @param  elem    検索結果ノード
     *  @param  title   検索結果タイトル
     *  @param  url     検索結果url
     *  @param  detach  detach関数
     */
    youtube_playlist_filter(elem, title, url, detach) {
        const listname = GoogleUtil.cut_googled_youtube_title(title);
        if (this.storage.title_filter(listname)) {
            detach(elem);
            return;
        }
        const list_id = YoutubeUtil.get_playlist_hash(url);
        const channel_info = this.playlist_searcher.get_channel_info(list_id);
        if (channel_info != null) {
            if (channel_info.id == null || channel_info.name == null) {
                return;
            }
            if (this.storage.channel_and_title_filter(channel_info.name, listname) ||
                this.storage.channel_id_filter(channel_info.id, listname)) {
                detach(elem);
            } else {
                GoogleUtil.set_channel_info(elem, channel_info.id, channel_info.name);
            }
        } else {
            this.playlist_searcher.entry(list_id);
        }
    }

    filtering_carousel(carousel) {
        const storage = this.storage;
        const video_info_accessor = this.video_info_accessor;
        for (const mov of carousel.getElementsByTagName("g-inner-card")) {
            const a_tags = mov.getElementsByTagName("a");
            if (a_tags.length < 2) {
                continue;
            }
            const link = GoogleUtil.cut_searched_url(a_tags[1].href);
            const url = new urlWrapper(link);
            if (!url.in_google_searched_youtube()) {
                continue;
            }
            const divs = a_tags[1].getElementsByTagName("div");
            if (divs.length < 6) {
                continue;
            }
            const title = divs[3].textContent;
            const channel = GoogleUtil.get_channel_from_video_card_node(divs[5]);
            if (channel === '') {
                continue;
            }
            if (storage.channel_and_title_filter(channel, title)) {
                mov.remove();
            } else {
                const video_id = YoutubeUtil.cut_movie_hash(link);
                const channel_id = video_info_accessor.get_channel_id(video_id);
                if (channel_id != null) {
                    if (storage.channel_id_filter(channel_id, title)) {
                        mov.remove();
                    } else {
                        GoogleUtil.set_channel_info(mov, channel_id, channel);
                    }
                } else {
                    video_info_accessor.entry(video_id);
                }
            }
        }
    }

    filtering_video_list(mvlist) {
        const check_nd = HTMLUtil.search_parent_node(mvlist, e=>{
            return e.localName === "g-section-with-header";
        });
        if (check_nd != null) {
            return;
        }
        const root = HTMLUtil.search_parent_node(mvlist, e=>{
            return e.localName === "div" &&
                   e.hasAttribute("jscontroller") &&
                   e.hasAttribute("jsaction") &&
                   e.hasAttribute("data-hveid");
        });
        if (root == null) {
            return;
        }
        for (const a of root.getElementsByTagName("a")) {
            if (!a.hasAttribute("ping")) {
                continue;
            }
            const url = a.href;
            const urlW = new urlWrapper(url);
            if (!urlW.in_google_searched_youtube()) {
                continue;
            }
            let title = '';
            for (const spn of a.getElementsByTagName("span")) {
                if (spn.children.length != 0) {
                    continue;
                } else {
                    title = spn.textContent;
                    break;
                }
            }
            const detach = (e)=> { e.parentNode.remove(); };
            if (urlW.in_youtube_movie_page()) {
                this.youtube_video_filter(a.parentNode, title, url, detach);
            } else if (urlW.in_youtube_short_page()) {
                this.youtube_shorts_filter(a.parentNode, title, url, detach);
            }
        }
    }
    filtering_thumb_header(header) {
        for (const elem of header.getElementsByTagName("div")) {
            const url = elem.getAttribute("data-lpage");
            if (url == null || !elem.hasAttribute("data-attrid")) {
                continue;
            }
            const urlW = new urlWrapper(url);
            if (!urlW.in_google_searched_youtube()) {
                continue;
            }
            const a_tag = elem.querySelector("a");
            if (a_tag == null) {
                continue;
            }
            const title = a_tag.firstChild.textContent;
            if (urlW.in_youtube_movie_page()) {
                this.youtube_video_filter(elem, title, url, detach_func);
            } else if (urlW.in_youtube_any_channel_page()) {
                this.youtube_channel_filter(elem, title, url, detach_func);
            }
        }
    }

    filtering_searched_movie_part(elem) {
        const storage = this.storage;
        const video_info_accessor = this.video_info_accessor;
        for (const video of elem.getElementsByTagName("video-voyager")) {
            for (const lnk of video.getElementsByTagName("a")) {
                const url = lnk.href;
                const urlW = new urlWrapper(url);
                if (urlW.in_youtube_movie_page()) {
                    const divs = lnk.getElementsByTagName("div");
                    if (divs.length < 3) {
                        continue;
                    }
                    const title = divs[1].textContent;
                    const channel = GoogleUtil.get_channel_from_video_card_node(divs[3]);
                    if (storage.channel_and_title_filter(channel, title)) {
                        video.remove();
                    } else {
                        const video_id = YoutubeUtil.cut_movie_hash(url);
                        const channel_id = video_info_accessor.get_channel_id(video_id);
                        if (channel_id != null) {
                            if (storage.channel_id_filter(channel_id, title)) {
                                video.remove();
                            } else {
                                GoogleUtil.set_channel_info(video, channel_id, channel);
                            }
                        } else {
                            video_info_accessor.entry(video_id);
                        }
                    }
                };
            }
        }
    }

    filtering_google_pic_search() {
        const e_search = HTMLUtil.collect_node_by_tag("div#search", "div", elem => {
            return elem.hasAttribute("data-async-context");
        });
        if (e_search.length == 0) {
            return;
        }
        for (const dac of e_search) {
            if (dac.childNodes.length != 1) {
                continue;
            }
            const root = dac.childNodes[0];
            if (root.localName !== "div" ||
                !root.hasAttribute("class") ||
                root.childNodes.length != 1) {
                continue;
            }
            const jscontroller = root.childNodes[0];
            if (jscontroller.localName !== "div" ||
                !jscontroller.hasAttribute("jscontroller") ||
                jscontroller.childNodes.length == 0) {
                continue;
            }
            const jsmodel = jscontroller.childNodes[0];
            if (jsmodel.localName !== "div" ||
                !jsmodel.hasAttribute("jsmodel") ||
                !jsmodel.hasAttribute("data-fw") ||
                jsmodel.childNodes.length != 1) {
                continue;
            }
            for (const pict of jsmodel.getElementsByTagName("div")) {
                if (!pict.hasAttribute("jsname") ||
                    !pict.hasAttribute("data-lpage")) {
                    continue;
                }
                let title = null;
                let url = null;
                const elem_a = pict.querySelectorAll("a");
                for (const a of elem_a) {
                    if (a.hasAttribute("class")) {
                        url = a.href;
                    } else {
                        const elem_img = a.querySelector("img");
                        if (elem_img != null) {
                            const alt = elem_img.getAttribute("alt");
                            if (alt != null) {
                                title = GoogleUtil.cut_googled_youtube_title(alt);
                            }
                        }
                    }
                }
                if (title == null || url == null) {
                    continue;
                }
                const urlW = new urlWrapper(url);
                if (!urlW.in_google_searched_youtube()) {
                    continue;
                }
                //
                if (urlW.in_youtube_movie_page()) {
                    this.youtube_video_filter(pict, title, url, detach_func);
                } else if (urlW.in_youtube_any_channel_page()) {
                    this.youtube_channel_filter(pict, title, url, detach_func);
                } else if (urlW.in_youtube_playlist_page()) {
                    this.youtube_playlist_filter(pict, title, url, detach_func);
                }
            }
        }
    }

    /*!
     *  @brief  google検索結果にフィルタをかける
     */
    filtering_google_search_unit(elem) {
        const elem_title = elem.querySelector("h3");
        if (elem_title == null) {
            return false;
        }
        const s_node = GoogleUtil.get_search_node(elem);
        const href = elem.href;
        if (href == null) {
            // 動画検索部分表示
            if (s_node.getElementsByTagName("g-more-link").length == 1) {
                this.filtering_searched_movie_part(elem);
            }
            return false;
        }
        const url = GoogleUtil.cut_searched_url(href);
        const urlW = new urlWrapper(url);
        if (!urlW.in_google_searched_youtube()) {
            return false; // tubeじゃない
        }
        const title = elem_title.textContent;
        const detach = GoogleUtil.detach_search_node;
        if (urlW.in_youtube_movie_page()) {
            this.youtube_video_filter(s_node, title, url, detach);
        } else if (urlW.in_youtube_short_page()) {
            this.youtube_shorts_filter(s_node, title, url, detach);
        } else if (urlW.in_youtube_any_channel_page()) {
            const channel_url = HTMLUtil.cut_url_query_param(url);
            this.youtube_channel_filter(s_node, title, channel_url, detach);
        } else if (urlW.in_youtube_playlist_page()) {
            this.youtube_playlist_filter(s_node, title, url, detach);
        }
        return true;
    }
    filtering_google_search_core(elem) {
        let ret = false;
        for (const a of elem.getElementsByTagName("a")) {
            if (!a.hasAttribute("jsname")) {
                continue;
            }
            if (this.filtering_google_search_unit(a)) {
                ret = true;
            }
        };
        return ret;
    }
    /*!
     *  @brief  google検索結果にフィルタをかける
     *  @note   26/02/28時点でのリスト/画像表示用
     */
    filtering_google_search_group_unit(elem, span_func) {
        const elem_link = elem.querySelector("a");
        if (elem_link == null) {
            return;
        }
        const href = elem_link.href;
        const url = GoogleUtil.cut_searched_url(href);
        const urlW = new urlWrapper(url);
        if (!urlW.in_google_searched_youtube()) {
            return; // tubeじゃない
        }
        const e_span = span_func(elem_link);
        if (e_span == null) {
            return;
        }
        const title = e_span.textContent;
        if (urlW.in_youtube_movie_page()) {
            this.youtube_video_filter(elem, title, url, detach_func);
        } else if (urlW.in_youtube_short_page()) {
            this.youtube_shorts_filter(elem, title, url, detach_func);
        } else if (urlW.in_youtube_any_channel_page()) {
        const channel_url = HTMLUtil.cut_url_query_param(url);
            this.youtube_channel_filter(elem, title, url, detach_func);
        }
        return true;
    }
    filtering_video_list2(root) {
        const list_top = HTMLUtil.search_node(root, "div", elem => {
            return elem.hasAttribute("jscontroller") &&
                   elem.hasAttribute("class");
        });
        if (list_top == null) {
            return false;
        }
        const jsc_grp = HTMLUtil.collect_node(list_top, "div", elem => {
            return elem.hasAttribute("jscontroller") &&
                   elem.hasAttribute("data-curl");
        });
        if (jsc_grp.length == 0) {
            return false;
        }
        const span_func = (e)=>{ return e.querySelector("span"); };
        for (const jsc of jsc_grp) {
            this.filtering_google_search_group_unit(jsc, span_func);
        }
        return true;
    }
    filtering_thumb_header2(root) {
        const list_top = HTMLUtil.search_node(root, "div", elem => {
            return elem.hasAttribute("jscontroller") &&
                   elem.hasAttribute("data-q");
        });
        if (list_top == null) {
            return false;
        }
        const jsc_grp = HTMLUtil.collect_node(list_top, "div", elem => {
            return elem.hasAttribute("jscontroller") &&
                   elem.hasAttribute("data-d") &&
                   elem.hasAttribute("id");
        });
        if (jsc_grp.length == 0) {
            return false;
        }
        const span_func = (e)=>{ return e.parentNode.querySelector("span"); };
        for (const jsc of jsc_grp) {
            this.filtering_google_search_group_unit(jsc, span_func);
        }
        return true;
    }
    filtering_google_search_group(key_tag) {
        const e_search = HTMLUtil.collect_node_by_tag(key_tag, "div", elem => {
            return elem.hasAttribute("data-async-context");
        });
        // rootから2階層下まで検索
        let div_classes = [];
        for (const e of e_search) {
            const collect_func = (e) => {
                return e.localName === "div" && e.hasAttribute("class") &&
                       e.childNodes.length != 0 && e.childNodes[0].localName === "div";
            }
            for (const ec of e.children) {
                if (collect_func(ec)) {
                    div_classes.push(ec);
                } else {
                    for (const ecc of ec.children) {
                        if (collect_func(ecc)) {
                            div_classes.push(ecc);
                        }
                    }
                }
            }
        }
        for (const e of div_classes) {
            // 動画リスト表示2 26/02版
            if (this.filtering_video_list2(e)) {
                continue;
            }
            // 画像水平サムネ表示2 26/02版
            if (this.filtering_thumb_header2(e)) {
                continue;
            }
            if (this.filtering_google_search_core(e)) {
                continue;
            }
            // これより↓は多分もう要らない(古い処理)
            // 動画スライド表示
            for (const carousel of e.getElementsByTagName("g-scrolling-carousel")) {
                this.filtering_carousel(carousel);
            }
            // 画像(サムネ)水平表示
            for (const header of e.getElementsByTagName("g-section-with-header")) {
                this.filtering_thumb_header(header);
            }
            // 動画リスト表示
            for (const mvlist of e.getElementsByTagName("g-more-link")) {
                this.filtering_video_list(mvlist);
            }
        }
    }
    filtering_google_search() {
        this.filtering_google_search_group("div#search");
        this.filtering_google_search_group("div#botstuff");
        this.filtering_google_pic_search();

        this.video_info_accessor.kick();
        this.author_info_accessor.kick();
        this.channel_info_accessor.kick();
        this.playlist_searcher.kick();
    }

    /*!
     *  @brief  フィルタリング
     */
    filtering() {
        this.filtering_google_search();
    }

    /*!
     *  @brief  動画情報(json)取得完了通知後処理
     *  @param  obj 動画オブジェクト
     */
    post_proc_tell_get_video_json(obj) {
        if (obj.channel_id != null) {
            this.filtering();
        } else
        if (obj.username) {
            // jsonからチャンネルIDを得られなかった場合はこっち
            const channel_id = this.author_info_accessor.get_channel_id(obj.username);
            if (channel_id != null) {
                if (obj.video_id != null) {
                    this.video_info_accessor.set_channel_id(obj.video_id, channel_id);
                } else if (obj.list_id != null) {
                    this.playlist_searcher.set_channel_id(obj.list_id, channel_id);
                }
                this.filtering();
            } else {
                this.author_info_accessor.entry(obj.username);
                this.author_info_accessor.kick();
            }
        } else {
            // jsonからチャンネルIDもuserも得られなかった場合の最終手段
            const unique_name = obj.unique_name;
            const channel_id = this.channel_info_accessor.get_channel_id(unique_name);
            if (channel_id != null) {
                if (obj.video_id != null) {
                    this.video_info_accessor.set_channel_id(obj.video_id, channel_id);
                } else if (obj.list_id != null) {
                    this.playlist_searcher.set_channel_id(obj.list_id, channel_id);
                }
                this.filtering();
            } else {
                this.channel_info_accessor.entry(obj.unique_name);
                this.channel_info_accessor.kick();
            }
        }
    }
    /*!
     *  @brief  動画情報(json)取得完了通知
     *  @param  result      結果
     *  @param  video_id    動画ID
     *  @param  json        動画情報(json)
     */
    tell_get_video_json(result, video_id, json) {
        if (result === "success") {
            this.video_info_accessor
                .tell_get_json(video_id,
                               json,
                               this.post_proc_tell_get_video_json.bind(this));
        } else if (result === "unauthorized") {
            this.video_searcher.entry(video_id);
            this.video_searcher.kick();
        }
    }

    /*!
     *  @brief  動画更新情報(feed)取得完了通知後処理
     *  @param  obj 動画オブジェクト
     */
    post_proc_tell_get_videos_xml(obj) {
        const video_ids
            = this.video_info_accessor.tell_get_channel_id(obj.username, obj.channel_id);
        this.filtering();
    }
    /*!
     *  @brief  動画更新情報(feed)取得完了通知
     *  @param  result      結果
     *  @param  username    ユーザページID
     *  @param  xml         動画更新情報(xml)
     */
    tell_get_videos_xml(result, username, xml) {
        if (result === "success") {
            this.author_info_accessor
                .tell_get_xml(username,
                              xml,
                              this.post_proc_tell_get_videos_xml.bind(this));
        }
    }

    /*!
     *  @brief  カスタムチャンネル情報(html)取得完了通知後処理
     *  @param  obj 動画オブジェクト
     */
    post_proc_tell_get_channel_html(obj) {
        this.video_info_accessor
            .tell_get_channel_id_by_unique_channel(obj.unique_name,
                                                   obj.channel_id);
        this.playlist_searcher
            .tell_get_channel_id_by_unique_channel(obj.unique_name,
                                                   obj.channel_id);
        this.filtering();
    }
    /*!
     *  @brief  チャンネル情報(html)取得完了通知
     *  @param  result      結果
     *  @param  unique_name カスタムチャンネル名/ハンドル
     *  @param  html        チャンネル情報(html)
     */
    tell_get_channel_html(result, unique_name, html) {
        if (result === "success") {
            this.channel_info_accessor
                .tell_get_html(unique_name,
                               html,
                               this.post_proc_tell_get_channel_html.bind(this));
        }
    }

    /*!
     *  @brief  動画検索結果(html)取得完了通知後処理
     *  @param  video_id        動画ID
     *  @param  author_url      チャンネルURL
     */
    post_proc_tell_search_video_html(video_id, author_url, channel_name, channel_id) {
        let obj = { video_id: video_id, channel_id: channel_id };
        const channel_code = YoutubeUtil.cut_channel_id(author_url);
        this.video_info_accessor.set_channel_name(video_id, channel_name);
        this.video_info_accessor.set_channel_id(video_id, channel_id);
        if (YoutubeUtil.is_channel_url(author_url)) {
            this.video_info_accessor.set_channel_id(video_id, channel_code);
            obj.channel_id = channel_code;
        } else if (YoutubeUtil.is_userpage_url(author_url)) {
            obj.username = channel_code;
            this.video_info_accessor.set_username(video_id, channel_code);
        } else if (YoutubeUtil.is_uniquepage_url(author_url)) {
            obj.unique_name = channel_code;
            this.video_info_accessor.set_unique_name(video_id, channel_code);
        } else {
            return; // 何らかの不具合
        }
        this.post_proc_tell_get_video_json(obj);
    }
    /*!
     *  @brief  動画検索結果(html)取得完了通知
     *  @param  result      結果
     *  @param  video_id    動画ID
     *  @param  html        検索結果(html)
     */
    tell_search_video_html(result, video_id, html) {
        if (result === "success") {
            this.video_searcher
                .tell_get_html(video_id,
                               html,
                               this.post_proc_tell_search_video_html.bind(this));
        }
    }

    /*!
     *  @brief  プレイリスト検索結果(html)解析後処理
     *  @param  list_id     リストID
     *  @param  author_url  チャンネルURL
     *  @param  channel     チャンネル名
     */
    post_proc_parse_search_playlist_html(list_id, author_url, channel, channel_id) {
        if (author_url == null) {
            return; // 特殊チャンネル
        }
        let obj = { list_id: list_id, channel_id: channel_id };
        const channel_code = YoutubeUtil.cut_channel_id(author_url);
        this.playlist_searcher.set_channel_name(list_id, channel);
        this.playlist_searcher.set_channel_id(list_id, channel_id);
        if (YoutubeUtil.is_channel_url(author_url)) {
            this.playlist_searcher.set_channel_id(list_id, channel_code);
            obj.channel_id = channel_code;
        } else if (YoutubeUtil.is_userpage_url(author_url)) {
            obj.username = channel_code;
            this.playlist_searcher.set_username(list_id, channel_code);
        } else if (YoutubeUtil.is_uniquepage_url(author_url)) {
            obj.unique_name = channel_code;
            this.playlist_searcher.set_unique_name(list_id, channel_code);
        } else {
            return; // 何らかの不具合
        }
        this.post_proc_tell_get_video_json(obj);
    }
    /*!
     *  @brief  プレイリスト検索結果(html)取得完了通知
     *  @param  result  結果
     *  @param  list_id 動画ID
     *  @param  html    検索結果(html)
     */
    tell_search_playlist_html(result, list_id, html) {
        if (result === "success") {
            PlaylistSearcher
                .parse_html(list_id,
                            html,
                            this.post_proc_parse_search_playlist_html.bind(this));
        }
    }

    get_observing_node(elem) {
        for (const e of document.body.querySelectorAll("div#center_col")) {
            elem.push(e);
        }
        for (const e of document.body.querySelectorAll("div#islmp")) {
            elem.push(e);
        }
    }

    callback_domloaded() {
        super.filtering();
        super.callback_domloaded();
    }

    /*!
     *  @brief  無効な追加elementか？
     *  @retun  true    無効
     */
    is_valid_records(records) {
        return false;
    }

    /*!
     *  @param storage  ストレージインスタンス
     */
    constructor(storage) {
        super(storage);
        super.create_after_domloaded_observer(this.is_valid_records.bind(this));
    }
}
