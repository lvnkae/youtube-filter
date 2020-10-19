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
     *  @param  elem        検索結果ノード
     *  @param  elem_title  タイトルノード
     *  @param  url         検索結果url
     */
    youtube_video_filter(elem, elem_title, url) {
        const channel = GoogleUtil.get_channel_from_video_node(elem);
        if (channel == null) {
            return;
        }
        const ttext = $(elem_title[0]).text();
        const title = GoogleUtil.cut_googled_youtube_title(ttext);
        if (this.storage.channel_and_title_filter(channel, title)) {
            $(elem).detach();
            return;
        }
        const video_id = GoogleFilter.get_video_id(url);
        const channel_id = this.video_info_accessor.get_channel_id(video_id);
        if (channel_id != null) {
            if (this.storage.channel_id_filter(channel_id, title)) {
                $(elem).detach();
            } else {
                // ContextMenu用に書き込んでおく
                $(elem).attr("channel_id", channel_id);
            }
        } else {
            this.video_info_accessor.entry(video_id);
        }
    }

    /*!
     *  @brief  Youtubeチャンネルフィルタ
     *  @param  elem        検索結果ノード
     *  @param  elem_title  タイトルノード
     *  @param  url         検索結果url
     */
    youtube_channel_filter(elem, elem_title, url) {
        const ctext = $(elem_title[0]).text();
        const channel = GoogleUtil.cut_googled_youtube_title(ctext);
        if (this.storage.channel_filter(channel)) {
            $(elem).detach();
            return;
        }
        if (YoutubeUtil.is_channel_url(url)) {
            const channel_id = YoutubeUtil.cut_channel_id(url);
            if (this.storage.channel_id_filter(channel_id)) {
                $(elem).detach();
                return;
            } else {
                // ContextMenu用に書き込んでおく
                $(elem).attr("channel_id", channel_id);
            }
        } else
        if (YoutubeUtil.is_userpage_url(url)) {
            const username = YoutubeUtil.cut_channel_id(url);
            const channel_id = this.author_info_accessor.get_channel_id(username);
            if (channel_id != null) {
                if (this.storage.channel_id_filter(channel_id)) {
                    $(elem).detach();
                } else {
                    // ContextMenu用に書き込んでおく
                    $(elem).attr("channel_id", channel_id);
                }
            } else {
                this.author_info_accessor.entry(username);
            }
        }
    }
    
    /*!
     *  @brief  動画(google検索)にフィルタをかける
     */
    filtering_google_movie() {
        $("div.g").each((inx, elem)=> {
            if (elem.classList[0] != "g") {
                return; // 検索要素じゃない
            }
            const elem_title = $(elem).find("h3");
            if (elem_title.length != 1) {
                return;
            }
            const a_tag = $(elem_title).parent();
            const href = $(a_tag[0]).attr("href");
            if (href == null) {
                return;
            }
            const url = new urlWrapper(GoogleUtil.cut_searched_url(href));
            if (!url.in_google_searched_youtube()) {
                return; // tubeじゃない
            }
            if (url.in_youtube_movie_page()) {
                this.youtube_video_filter(elem, elem_title, href);
            } else if (url.in_youtube_custom_channel_page() ||
                       url.in_youtube_channel_page() ||
                       url.in_youtube_user_page()) {
                this.youtube_channel_filter(elem, elem_title, href);
            } else if (url.in_youtube_playlist_page()) {
                const title = $(a_tag[0]).text();
                if (this.storage.title_filter(title)) {
                    $(elem).detach();
                }
            }
        });

        $("g-scrolling-carousel").each((inx, scr)=> {
            $(scr).find("g-inner-card").each((inx, mov)=> {
                const a_tag = $(mov).find("a");
                if (a_tag.length != 1) {
                    return;
                }
                const href = $(a_tag[0]).attr("href");
                if (href == null) {
                    return null;
                }
                const url = new urlWrapper(GoogleUtil.cut_searched_url(href));
                if (!url.in_google_searched_youtube()) {
                    return;
                }
                const title = $($($(a_tag[0]).children()[1]).children()[0]).text();
                const channel = GoogleUtil.get_channel_from_video_card_node(a_tag);
                if (this.storage.channel_and_title_filter(channel, title)) {
                    $(mov).detach();
                } else {
                    const video_id = YoutubeUtil.cut_movie_hash($(a_tag).attr("href"));
                    const channel_id = this.video_info_accessor.get_channel_id(video_id);
                    if (channel_id != null) {
                        if (this.storage.channel_id_filter(channel_id, title)) {
                            $(mov).detach();
                        } else {
                            // ContextMenu用に書き込んでおく
                            $(mov).attr("channel_id", channel_id);
                        }
                    } else {
                        this.video_info_accessor.entry(video_id);
                    }
                }
            });
        });
        this.video_info_accessor.kick();
    }

    /*!
     *  @brief  フィルタリング
     */
    filtering() {
        this.filtering_google_movie();
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
            const channel_id = this.author_info_accessor.get_channel_id(obj.username);
            if (channel_id != null) {
                this.video_info_accessor.set_channel_id(obj.video_id, channel_id);
                this.filtering();
            } else {
                this.author_info_accessor.entry(obj.username);
                this.author_info_accessor.kick();
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
            this
            .video_info_accessor
            .tell_get_json(video_id,
                           json,
                           this.post_proc_tell_get_video_json.bind(this));
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
            this
            .author_info_accessor
            .tell_get_xml(username,
                          xml,
                          this.post_proc_tell_get_videos_xml.bind(this));
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
