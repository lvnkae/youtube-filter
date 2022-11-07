/*!
 *  @brief  Googleフィルタ
 */
class GoogleFilter extends FilterBase {

    /*!
     *  @brief  Youtube動画フィルタ
     *  @param  elem    検索結果ノード
     *  @param  title   検索結果タイトル
     *  @param  url     検索結果url
     */
    youtube_video_filter(elem, title, url) {
        const mv_title = GoogleUtil.cut_googled_youtube_title(title);
        if (this.storage.title_filter(mv_title)) {
            GoogleUtil.detach_search_node(elem);
            return;
        }
        const video_id = YoutubeUtil.cut_movie_hash(url);
        const channel_info = this.video_info_accessor.get_channel_info(video_id);
        if (channel_info != null) {
            if (this.storage.channel_id_filter(channel_info.id, mv_title)) {
                GoogleUtil.detach_search_node(elem);
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
     */
    youtube_channel_filter(elem, title, url) {
        const channel = GoogleUtil.cut_googled_youtube_title(title);
        if (this.storage.channel_filter(channel)) {
            GoogleUtil.detach_search_node(elem);
            return;
        }
        if (YoutubeUtil.is_channel_url(url)) {
            const channel_id = YoutubeUtil.cut_channel_id(url);
            if (this.storage.channel_id_filter(channel_id)) {
                GoogleUtil.detach_search_node(elem);
            } else {
                GoogleUtil.set_channel_info(elem, channel_id, channel);
            }
        } else
        if (YoutubeUtil.is_userpage_url(url)) {
            const username = YoutubeUtil.cut_channel_id(url);
            const channel_id = this.author_info_accessor.get_channel_id(username);
            if (channel_id != null) {
                if (this.storage.channel_id_filter(channel_id)) {
                    GoogleUtil.detach_search_node(elem);
                } else {
                    GoogleUtil.set_channel_info(elem, channel_id, channel);
                }
            } else {
                this.author_info_accessor.entry(username);
            }
        } else
        if (YoutubeUtil.is_custom_channel_url(url)) {
            const custom_name = YoutubeUtil.cut_channel_id(url);
            const channel_id = this.channel_info_accessor.get_channel_id(custom_name);
            if (channel_id != null) {
                if (this.storage.channel_id_filter(channel_id)) {
                    GoogleUtil.detach_search_node(elem);
                } else {
                    GoogleUtil.set_channel_info(elem, channel_id, channel);
                }
            } else {
                this.channel_info_accessor.entry(custom_name);
            }
        }
    }

    /*!
     *  @brief  Youtubeプレイリストフィルタ
     *  @param  elem    検索結果ノード
     *  @param  title   検索結果タイトル
     *  @param  url     検索結果url
     */
    youtube_playlist_filter(elem, title, url) {
        if (this.storage.title_filter(title)) {
            GoogleUtil.detach_search_node(elem);
            return;
        }
        const list_id = YoutubeUtil.get_playlist_hash(url);
        const channel_info = this.playlist_searcher.get_channel_info(list_id);
        if (channel_info != null) {
            if (channel_info.id == null || channel_info.name == null) {
                return;
            }
            if (this.storage.channel_and_title_filter(channel_info.name, title) ||
                this.storage.channel_id_filter(channel_info.id, title)) {
                GoogleUtil.detach_search_node(elem);
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

    /*!
     *  @brief  google検索結果にフィルタをかける
     */
    filtering_google_search() {
        const e_search = HTMLUtil.search_node($("div#search"), "div", (elem)=> {
            return $(elem).attr("data-async-context") != null;
        });
        $(e_search).children().each((inx, elem)=> {
            const elem_title = $(elem).find("h3");
            if (elem_title.length != 1) {
                return;
            }
            const a_tag = $(elem_title).parent();
            const href = $(a_tag[0]).attr("href");
            if (href == null) {
                // 動画検索部分表示
                if ($(elem).find("g-more-link").length == 1) {
                    this.filtering_searched_movie_part(elem);
                }
                return;
            }
            const urlW = new urlWrapper(GoogleUtil.cut_searched_url(href));
            if (!urlW.in_google_searched_youtube()) {
                return; // tubeじゃない
            }
            const title = $(elem_title[0]).text();
            if (urlW.in_youtube_movie_page()) {
                this.youtube_video_filter(elem, title, urlW.url);
            } else if (urlW.in_youtube_channel_page() ||
                       urlW.in_youtube_user_page() ||
                       urlW.in_youtube_custom_channel_page()) {
                const channel_url = HTMLUtil.cut_url_query_param(urlW.url);
                this.youtube_channel_filter(elem, title, channel_url);
            } else if (urlW.in_youtube_playlist_page()) {
                this.youtube_playlist_filter(elem, title, urlW.url);
            }
            // 動画スライド表示
            $(elem).find("g-scrolling-carousel").each((inx, carousel)=> {
                this.filtering_carousel(carousel);
            });
        });

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
            const custom_name = obj.custom_name;
            const channel_id = this.channel_info_accessor.get_channel_id(custom_name);
            if (channel_id != null) {
                if (obj.video_id != null) {
                    this.video_info_accessor.set_channel_id(obj.video_id, channel_id);
                } else if (obj.list_id != null) {
                    this.playlist_searcher.set_channel_id(obj.list_id, channel_id);
                }
                this.filtering();
            } else {
                this.channel_info_accessor.entry(obj.custom_name);
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
                  .tell_get_channel_id_by_custom_channel(obj.custom_name, 
                                                         obj.channel_id);
        this.playlist_searcher
            .tell_get_channel_id_by_custom_channel(obj.custom_name,
                                                   obj.channel_id);
        this.filtering();
    }
    /*!
     *  @brief  カスタムチャンネル情報(html)取得完了通知
     *  @param  result      結果
     *  @param  custom_name カスタムチャンネル名
     *  @param  html        チャンネル情報(html)
     */
    tell_get_channel_html(result, custom_name, html) {
        if (result == "success") {
            this.channel_info_accessor
                .tell_get_html(custom_name,
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
        } else if (YoutubeUtil.is_custom_channel_url(author_url)) {
            obj.custom_name = channel_code;
            this.video_info_accessor.set_custom_name(video_id, channel_code);
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
        } else if (YoutubeUtil.is_custom_channel_url(author_url)) {
            obj.custom_name = channel_code;
            this.playlist_searcher.set_custom_name(list_id, channel_code);
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
