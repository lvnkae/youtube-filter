/*!
 *  @brief  Googleフィルタ
 */
class GoogleFilter extends FilterBase {

    /*!
     *  @brief  動画URLから動画IDを得る
     *  @param  url 動画URL
     *  @note   Firefoxで検索結果に触るとURLが中間URLに書き換えられてしまう
     */
    static get_video_id(url) {
        var url_t = url;
        if (GoogleUtil.is_searched_url(url)) {
            url_t = GoogleUtil.cut_searched_url(url);
        }
        return YoutubeUtil.cut_movie_hash(url_t);
    }

    /*!
     *  @brief  Youtube動画フィルタ
     *  @param  elem    検索結果ノード
     *  @param  title   検索結果タイトル
     *  @param  url     検索結果url
     *  @param  detach  detach関数
     */
    youtube_video_filter(elem, title, url, detach) {
        const mv_title = GoogleUtil.cut_googled_youtube_title(title);
        if (this.storage.title_filter(mv_title)) {
            detach(elem);
            return;
        }
        const video_id = YoutubeUtil.cut_movie_hash(url);
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
        $(carousel).find("g-inner-card").each((inx, mov)=> {
            const a_tag = $(mov).find("a");
            if (a_tag.length < 2) {
                return;
            }
            const href = $(a_tag[1]).attr("href");
            if (href == null) {
                return null;
            }
            const url = new urlWrapper(GoogleUtil.cut_searched_url(href));
            if (!url.in_google_searched_youtube()) {
                return;
            }
            const divs = $(a_tag[1]).find("div");
            if (divs.length < 6) {
                return;
            }
            const title = $(divs[3]).text();
            const channel = GoogleUtil.get_channel_from_video_card_node(divs[5]);
            if (channel == "") {
                return;
            }
            if (this.storage.channel_and_title_filter(channel, title)) {
                $(mov).detach();
            } else {
                const video_id = YoutubeUtil.cut_movie_hash(url.url);
                const channel_id = this.video_info_accessor.get_channel_id(video_id);
                if (channel_id != null) {
                    if (this.storage.channel_id_filter(channel_id, title)) {
                        $(mov).detach();
                    } else {
                        GoogleUtil.set_channel_info(mov, channel_id, channel);
                    }
                } else {
                    this.video_info_accessor.entry(video_id);
                }
            }
        });        
    }

    filtering_video_list(mvlist) {
        const check_nd = HTMLUtil.search_upper_node($(mvlist), (e)=>{
            return e.localName == "g-section-with-header";
        });
        if (check_nd.length != 0) {
            return;
        }
        const root = HTMLUtil.search_upper_node($(mvlist), (e)=>{
            return e.localName == "div" &&
                   $(e).attr("jscontroller") != null &&
                   $(e).attr("jsaction") != null &&
                   $(e).attr("data-hveid") != null;
        });
        if (root.length == 0) {
            return;
        }
        $(root).find("a").each((inx, a)=>{
            if ($(a).attr("ping") == null) {
                return;
            }
            const url = $(a).attr("href");
            const urlW = new urlWrapper(url);
            if (!urlW.in_google_searched_youtube()) {
                return;
            }
            let title = "";
            $(a).find("span").each((inx, spn)=>{
                const cld = $(spn).children();
                if (cld.length != 0) {
                    return true;
                } else {
                    title = $(spn).text();
                    return false;
                }
            });
            this.youtube_video_filter($(a).parent(), title, url, (e)=>{
                $(e).parent().detach();
            });
        });
    }
    filtering_thumb_header(header) {
        $(header).find("div").each((inx, elem)=> {
            const url = $(elem).attr("data-lpage");
            const atr = $(elem).attr("data-attrid");
            if (url == null || atr == null) {
                return;
            }
            const a_tag = $(elem).find("a");
            if (a_tag.length <= 0) {
                return;
            }
            const title = $(a_tag[0].firstChild).text();
            const detach = (elem) => { $(elem).detach(); };
            const urlW = new urlWrapper(url);
            if (!urlW.in_google_searched_youtube()) {
                return;
            }
            if (urlW.in_youtube_movie_page()) {
                this.youtube_video_filter(elem, title, url, detach);
            } else if (urlW.in_youtube_channel_page() ||
                       urlW.in_youtube_user_page() ||
                       urlW.in_youtube_custom_channel_page() ||
                       urlW.in_youtube_handle_page()) {
                this.youtube_channel_filter(elem, title, url, detach);
            }
        });        
    }

    filtering_searched_movie_part(elem) {
        $(elem).find("video-voyager").each((inx, video)=> {
            $(video).find("a").each((inx, lnk)=> {
                const url = $(lnk).attr("href");
                if (url == null) {
                    return;
                }
                const urlW = new urlWrapper(url);
                if (urlW.in_youtube_movie_page()) {
                    const divs = $(lnk).find("div");
                    if (divs.length < 3) {
                        return;
                    }
                    const title = $(divs[1]).text();
                    const channel = GoogleUtil.get_channel_from_video_card_node(divs[3]);
                    if (this.storage.channel_and_title_filter(channel, title)) {
                        $(video).detach();
                    } else {
                        const video_id = YoutubeUtil.cut_movie_hash(url);
                        const channel_id = this.video_info_accessor.get_channel_id(video_id);
                        if (channel_id != null) {
                            if (this.storage.channel_id_filter(channel_id, title)) {
                                $(video).detach();
                            } else {
                                GoogleUtil.set_channel_info(video, channel_id, channel);
                            }
                        } else {
                            this.video_info_accessor.entry(video_id);
                        }
                    }
                };
            });
        });
    }

    filtering_google_pic_search() {
        const pic_root = $("div#islrg");
        if (pic_root.length <= 0) {
            return;
        }
        $(pic_root).find("div").each((inx, pict)=>{
            if ($(pict).attr("data-ved") == null ||
                $(pict).attr("data-hveid") == null) {
                return
            }
            const role = $(pict).attr("role");
            if (role == null || role != "listitem") {
                return;
            }
            const a_elm = HTMLUtil.search_node(pict, "a", (e)=>{
                return $(e).attr("data-ved") != null;
            });
            if (a_elm == null) {
                return;
            }
            const url = $(a_elm).attr("href");
            const title = $(a_elm).attr("title");
            const detach = (elem) => { $(elem).detach(); };
            const urlW = new urlWrapper(url);
            if (!urlW.in_google_searched_youtube()) {
                return;
            }
            if (urlW.in_youtube_movie_page()) {
                this.youtube_video_filter(pict, title, url, detach);
            } else if (urlW.in_youtube_channel_page() ||
                urlW.in_youtube_user_page() ||
                urlW.in_youtube_custom_channel_page() ||
                urlW.in_youtube_handle_page()) {
                this.youtube_channel_filter(pict, title, url, detach);
            } else if (urlW.in_youtube_playlist_page()) {
                this.youtube_playlist_filter(pict, title, url, detach);
            }
        });
    }

    /*!
     *  @brief  google検索結果にフィルタをかける
     */
    filtering_google_search_unit(elem) {
        const elem_title = $(elem).find("h3");
        if (elem_title.length != 1) {
            return false;
        }
        const s_node = GoogleUtil.get_search_node(elem);
        const href = $(elem).attr("href");
        if (href == null) {
            // 動画検索部分表示
            if ($(s_node).find("g-more-link").length == 1) {
                this.filtering_searched_movie_part(elem);
            }
            return false;
        }
        const urlW = new urlWrapper(GoogleUtil.cut_searched_url(href));
        if (!urlW.in_google_searched_youtube()) {
            return false; // tubeじゃない
        }
        const title = $(elem_title[0]).text();
        const detach = GoogleUtil.detach_search_node;
        if (urlW.in_youtube_movie_page()) {
            this.youtube_video_filter(s_node, title, urlW.url, detach);
        } else if (urlW.in_youtube_channel_page() ||
                urlW.in_youtube_user_page() ||
                urlW.in_youtube_custom_channel_page() ||
                urlW.in_youtube_handle_page()) {
            const channel_url = HTMLUtil.cut_url_query_param(urlW.url);
            this.youtube_channel_filter(s_node, title, channel_url, detach);
        } else if (urlW.in_youtube_playlist_page()) {
            this.youtube_playlist_filter(s_node, title, urlW.url, detach);
        }
        return true;
    }    
    filtering_google_search_core(elem) {
        $(elem).find("a").each((inx, a)=>{
            if ($(a).attr("jsname") == null) {
                return;
            }
            this.filtering_google_search_unit(a);
        });
    }
    filtering_google_search_group(key_tag) {
        const e_search = HTMLUtil.collect_node($(key_tag), "div", (elem)=> {
            return $(elem).attr("data-async-context") != null;
        });
        e_search.forEach((e, index, arr)=>{
            $(e).children().each((inx, elem)=> {
                if (this.filtering_google_search_core(elem)) {
                    return;
                }
                // 動画スライド表示
                $(elem).find("g-scrolling-carousel").each((inx, carousel)=> {
                    this.filtering_carousel(carousel);
                });
                // 画像(サムネ)水平表示
                $(elem).find("g-section-with-header").each((inx, header)=> {
                    this.filtering_thumb_header(header);
                });
                // 動画リスト表示
                $(elem).find("g-more-link").each((inx, mvlist)=> {
                    this.filtering_video_list(mvlist);
                });
            });
        });
    }
    filtering_google_search() {
        this.filtering_google_search_group("div#search");
        this.filtering_google_search_group("div#botstuff");
        this.filtering_google_pic_search();

        this.video_info_accessor.kick();
        this.author_info_accessor.kick();
        this.channel_info_accessor.kick();
        this.video_searcher.kick();
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
        if (result == "success") {
            this.video_info_accessor
                .tell_get_json(video_id,
                               json,
                               this.post_proc_tell_get_video_json.bind(this));
        } else if (result == "unauthorized") {
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
        if (result == "success") {
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
        if (result == "success") {
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
    post_proc_tell_search_video_html(video_id, author_url, channel_name) {
        let obj = { video_id: video_id };
        const channel_code = YoutubeUtil.cut_channel_id(author_url);
        this.video_info_accessor.set_channel_name(video_id, channel_name);
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
        if (result == "success") {
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
    post_proc_parse_search_playlist_html(list_id, author_url, channel) {
        if (author_url == null) {
            return; // 特殊チャンネル
        }
        let obj = { list_id: list_id };
        const channel_code = YoutubeUtil.cut_channel_id(author_url);
        this.playlist_searcher.set_channel_name(list_id, channel);
        if (YoutubeUtil.is_channel_url(author_url)) {
            this.playlist_searcher.set_channel_id(list_id, channel_code);
            obj.channel_id = channel_code;
        } else if (YoutubeUtil.is_userpage_url(author_url)) {
            obj.username = channel_code;_            
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
        if (result == "success") {
            PlaylistSearcher
                .parse_html(list_id,
                             html,
                             this.post_proc_parse_search_playlist_html.bind(this));
        }
    }

    get_observing_node(elem) {
        const tag = "div#center_col";
        $(tag).each((inx, e)=>{ elem.push(e); });
        const pic_tag = "div#islmp";
        $(pic_tag).each((inx, e)=>{ elem.push(e); });
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
