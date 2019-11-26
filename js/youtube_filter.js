/*!
 *  @brief  Youtubeフィルタ
 */
class YoutubeFilter extends FilterBase {

    get_filtered_marker(element) {
        return $(element).attr("marker");
    }
    remove_filtered_marker(element) {
        $(element).removeAttr("marker");
    }
    set_filtered_marker(element, marker) {
        return $(element).attr("marker", marker);
    }

    /*!
     *  @brief  renderオブジェクトフィルタ(チャンネルID)
     *  @param  renderer_root   renderオブジェクト
     *  @param  author_url      aurhor-URL
     *  @param  title           タイトル(空の場合もある)
     */
    filtering_by_channel_id(renderer_root, author_url, title) {
        if (YoutubeUtil.is_channel_url(author_url)) {
            const channel_id = YoutubeUtil.cut_channel_id(author_url);
            if (this.storage.channel_id_filter(channel_id, title)) {
                $(renderer_root).detach();
                return true;
            }
            // ContextMenu用に書き込んでおく
            $(renderer_root).attr("channel_id", channel_id);
        } else
        if (YoutubeUtil.is_userpage_url(author_url)) {
            const username = YoutubeUtil.cut_channel_id(author_url);
            const channel_id = this.author_info_accessor.get_channel_id(username);
            if (channel_id != null) {
                if (this.storage.channel_id_filter(channel_id, title)) {
                    $(renderer_root).detach();
                    return true;
                }
                // ContextMenu用に書き込んでおく
                $(renderer_root).attr("channel_id", channel_id);
            } else {
                this.author_info_accessor.entry(username);
            }
        }
        return false;
    }

    /*!
     *  @brief  動画フィルタ
     *  @param  elem        親ノード
     *  @param  tag_title   動画タイトルタグ
     *  @param  tag_channel 動画チャンネルタグ
     *  @retval true        処理打ち切りまたは要素削除
     */
    filtering_video(elem, tag_title, tag_channel) {
        const renderer_root = YoutubeUtil.search_renderer_root($(elem));
        if (renderer_root.length == 0) {
            return true;
        }
        const elem_title = $(elem).find(tag_title);
        const elem_channel = YoutubeUtil.find_first_appearing_element(elem, tag_channel);
        if (elem_title.length != 1 || elem_channel == null) {
            return true;
        }
        const title = $(elem_title).text();
        const channel = $(elem_channel).text();
        if (this.storage.channel_and_title_filter(channel, title)) {
            $(renderer_root).detach();
            return true;
        }
        const author_url = $(elem_channel).attr("href");
        return this.filtering_by_channel_id(renderer_root, author_url, title);
    }
    /*!
     *  @brief  動画フィルタ
     *  @param  elem        親ノード
     *  @param  tag_title   動画タイトルタグ
     *  @param  channel     チャンネル名
     *  @param  channel_id  チャンネルID
     *  @retval true        処理打ち切りまたは要素削除
     */
    filtering_personal_video(elem, tag_title, channel, channel_id) {
        const renderer_root = YoutubeUtil.search_renderer_root($(elem));
        const elem_title = $(elem).find(tag_title);
        if (renderer_root.length == 0 || elem_title.length != 1) {
            return true;
        }
        const title = $(elem_title).text();
        if (this.storage.channel_and_title_filter(channel, title)) {
            $(renderer_root).detach();
            return true;
        }
        if (this.storage.channel_id_filter(channel_id, title)) {
            $(renderer_root).detach();
            return true;
        }
        // ContextMenu用に書き込んでおく
        $(renderer_root).attr("channel_id", channel_id);
    }
    /*!
     *  @brief  動画フィルタ
     *  @param  elem        親ノード
     *  @param  tag_title   動画タイトルタグ
     *  @param  tag_channel 動画チャンネルタグ
     *  @param  username    ユーザ名
     *  @param  channel_id  チャンネルID
     *  @retval true        処理打ち切りまたは要素削除
     */
    filtering_video_by_channel_id(elem, tag_title, tag_channel, username, channel_id) {
        const renderer_root = YoutubeUtil.search_renderer_root($(elem));
        if (renderer_root.length == 0) {
            return true;
        }
        const elem_channel = YoutubeUtil.find_first_appearing_element(elem, tag_channel);
        if (elem_channel == null) {
            return true;
        }
        const author_url = $(elem_channel).attr("href");
        if (!YoutubeUtil.is_userpage_url(author_url)) {
            return true;
        }
        if (username != YoutubeUtil.cut_channel_id(author_url)) {
            return true;
        }
        const elem_title = $(elem).find(tag_title);
        if (elem_title.length != 1) {
            return true;
        }
        if (this.storage.channel_id_filter(channel_id, $(elem_title).text())) {
            $(renderer_root).detach();
            return true;
        }
        // ContextMenu用に書き込んでおく
        $(renderer_root).attr("channel_id", channel_id);
        return false;
    }


    /*!
     *  @brief  動画(Youtube検索)にフィルタを掛ける
     */
    filtering_searched_video() {
        $(".text-wrapper.style-scope.ytd-video-renderer").each((inx, elem)=> {
            const tag_title = "a#video-title";
            const tag_channel = ".yt-simple-endpoint.style-scope.yt-formatted-string";
            //
            const marker = this.get_filtered_marker(elem);
            // ytd-video-rendererノードは使い回されることがあり(フィルタ条件変更時など)
            // ただマークするだけだと動画が差し替えられた時にフィルタされない
            // → 動画ハッシュをマーカーとし、前回と一致した場合のみ弾く
            const hash = YoutubeUtil.get_video_hash(elem, tag_title);
            if (marker != null && hash == marker) {
                return;
            }
            this.remove_filtered_marker(elem);
            //
            if (this.filtering_video(elem, tag_title, tag_channel)) {
                return;
            }
            //
            this.set_filtered_marker(elem, hash);
        });
        this.author_info_accessor.kick();
    }
    /*!
     *  @brief  動画(Youtube検索)にフィルタを掛ける
     *  @param  username    ユーザ名
     *  @param  channel_id  チャンネルID
     *  @note   ユーザページを持つ動画のフィルタリング
     *  @note   動画更新情報取得通知から呼ばれる
     */
    filtering_searched_video_by_channel_id(username, channel_id) {
        $(".text-wrapper.style-scope.ytd-video-renderer").each((inx, elem)=> {
            const tag_title = "a#video-title";
            const tag_channel = ".yt-simple-endpoint.style-scope.yt-formatted-string";
            if (this.filtering_video_by_channel_id(elem, tag_title, tag_channel,
                                                   username, channel_id)) {
                return;
            }
        });
    }
    /*!
     *  @brief  動画(Youtube検索)のマーカーをクリアする
     *  @note   ContextMenu用
     */
    clear_searched_video_marker(username, channel_id) {
        $(".text-wrapper.style-scope.ytd-video-renderer").each((inx, elem)=> {
            this.remove_filtered_marker(elem);
        });
    }

    /*!
     *  @brief  チャンネル(Youtube検索)にフィルタを掛ける
     *  @note   動画検索(フィルタなし)時に差し込まれるチャンネルタイルの除去
     */
    filtering_searched_channel() {
        $(".yt-simple-endpoint.style-scope.ytd-channel-renderer").each((inx, elem)=> {
            const renderer_root = YoutubeUtil.search_renderer_root($(elem));
            if (renderer_root.length == 0) {
                return;
            }
            const tag_channel = 
                "yt-formatted-string#text.style-scope.ytd-channel-name";
            const elem_channel = $(elem).find(tag_channel);
            if (elem_channel.length != 1) {
                return;
            }
            const channel = $(elem_channel[0]).text();
            if (this.storage.channel_filter(channel)) {
                $(renderer_root).detach();
                return;
            }
            const author_url = $(elem).attr("href");
            if (this.filtering_by_channel_id(renderer_root, author_url)) {
                return;
            }
        });
    }
    /*!
     *  @brief  チャンネル(Youtube検索)にフィルタを掛ける
     *  @param  username    ユーザ名
     *  @param  channel_id  チャンネルID
     *  @note   ユーザページのフィルタリング
     *  @note   動画更新情報取得通知から呼ばれる
     */
    filtering_searched_channel_by_channel_id(username, channel_id) {
        $(".yt-simple-endpoint.style-scope.ytd-channel-renderer").each((inx, elem)=> {
            const renderer_root = YoutubeUtil.search_renderer_root($(elem));
            if (renderer_root.length == 0) {
                return;
            }
            const author_url = $(elem).attr("href");
            if (!YoutubeUtil.is_userpage_url(author_url)) {
                return;
            }
            if (username != YoutubeUtil.cut_channel_id(author_url)) {
                return;
            }
            if (this.storage.channel_id_filter(channel_id)) {
                $(renderer_root).detach();
                return;
            }
            // ContextMenu用に書き込んでおく
            $(renderer_root).attr("channel_id", channel_id);
        });
    }

    /*!
     *  @brief  プレイリスト(Youtube検索)にフィルタを掛ける
     */
    filtering_searched_playlist_core(filtering_func) {
        $("a.yt-simple-endpoint.style-scope.ytd-playlist-renderer").each((inx, elem)=> {
            const tag_title = "span#video-title"
            const tag_channel = "a.yt-simple-endpoint.style-scope.yt-formatted-string";
            if (filtering_func(elem, tag_title, tag_channel)) {
                return;
            }
        });
    }
    /*!
     */
    filtering_searched_playlist() {
        this.filtering_searched_playlist_core((elem, tag_title, tag_channel)=> {
            return this.filtering_video(elem, tag_title, tag_channel);
        });
    }
    /*!
     *  @param  username    ユーザ名
     *  @param  channel_id  チャンネルID
     *  @note   ユーザページを持つプレイリストのフィルタリング
     *  @note   動画更新情報取得通知から呼ばれる
     */
    filtering_searched_playlist_by_channel_id(username, channel_id) {
        this.filtering_searched_playlist_core((elem, tag_title, tag_channel)=> {
            return this.filtering_video_by_channel_id(elem, tag_title, tag_channel,
                                                      username, channel_id)
        });
    }

    /*!
     *  @brief  動画(チャンネルページ)にフィルタを掛ける
     *  @note   大区分(ゲーム、スポーツなど)用
     */
    filtering_channel_video_core(filtering_func) {
        $("div#meta.style-scope.ytd-grid-video-renderer").each((inx, elem)=> {
            const tag_title = "a#video-title";
            const tag_channel = "a.yt-simple-endpoint.style-scope.yt-formatted-string";
            if (filtering_func(elem, tag_title, tag_channel)) {
                return;
            }
        });
        $("ytd-expanded-shelf-contents-renderer").each((inx, ctg)=> {
            const tag_elem = ".text-wrapper.style-scope.ytd-video-renderer";
            $(ctg).find(tag_elem).each((inx, elem)=> {
                const tag_title = "a#video-title";
                const tag_channel
                    = "a.yt-simple-endpoint.style-scope.yt-formatted-string";
                if (filtering_func(elem, tag_title, tag_channel)) {
                    return;
                }
            });
            if ($(ctg).find(tag_elem).length == 0) {
                YoutubeUtil.detach_upper_node($(ctg), "ytd-item-section-renderer");
            }
        });
        this.author_info_accessor.kick();
    }
    /*!
     */
    filtering_channel_video() {
        this.filtering_channel_video_core((elem, tag_title, tag_channel)=> {
            return this.filtering_video(elem, tag_title, tag_channel);
        });
    }
    /*!
     *  @param  username    ユーザ名
     *  @param  channel_id  チャンネルID
     *  @note   ユーザページを持つ動画のフィルタリング
     *  @note   動画更新情報取得通知から呼ばれる
     */
    filtering_channel_video_by_channel_id(username, channel_id) {
        this.filtering_channel_video_core((elem, tag_title, tag_channel)=> {
            return this.filtering_video_by_channel_id(elem, tag_title, tag_channel,
                                                      username, channel_id);
        });
    }
    /*!
     *  @note   個人チャンネル動画のフィルタリング
     *  @note   チャンネル名表示が省略されてるパターン
     */
    filtering_channel_personal_video() {
        const author_url = YoutubeUtil.get_page_author_url();
        var channel_id = null;
        if (YoutubeUtil.is_userpage_url(author_url)) {
            const username = YoutubeUtil.cut_channel_id(author_url);
            channel_id = this.author_info_accessor.get_channel_id(username);
            if (channel_id == null) {
                this.author_info_accessor.entry(username);
                this.author_info_accessor.kick();
                return;
            }
        } else
        if (YoutubeUtil.is_channel_url(author_url)) {
            channel_id = YoutubeUtil.cut_channel_id(author_url);
        } else {
            return;
        }
        const channel = YoutubeUtil.get_page_channel_name();
        if (channel == null) {
            return;
        }
        this.filtering_channel_video_core((elem, tag_title, tag_channel)=> {
            const elem_channel = YoutubeUtil.find_first_appearing_element(elem, tag_channel);
            if (elem_channel != null) {
                return;
            }
            return this.filtering_personal_video(elem, tag_title, channel, channel_id);
        });
    }
    /*!
     *  @note   個人チャンネル動画のフィルタリング
     *  @param  username    ユーザ名
     *  @param  channel_id  チャンネルID
     *  @note   チャンネル名表示が省略されてるパターン
     *  @note   ユーザページを持つ動画のフィルタリング
     *  @note   動画更新情報取得通知から呼ばれる
     */
    filtering_channel_personal_video_by_channel_id(username, channel_id) {
        const author_url = YoutubeUtil.get_page_author_url();
        if (!YoutubeUtil.is_userpage_url(author_url) ||
            username != YoutubeUtil.cut_channel_id(author_url)) {
            return;
        }
        const channel = YoutubeUtil.get_page_channel_name();
        if (channel == null) {
            return;
        }
        this.filtering_channel_video_core((elem, tag_title, tag_channel)=> {
            const elem_channel = YoutubeUtil.find_first_appearing_element(elem, tag_channel);
            if (elem_channel != null) {
                return;
            }
            return this.filtering_personal_video(elem, tag_title, channel, channel_id);
        });
    }


    /*!
     *  @brief  チャンネル(チャンネルページ)にフィルタを掛ける
     */
    filtering_channel_channel() {
        //  大区分(ゲーム、スポーツ等)ページ用 - ○水平リスト
        $("div#channel.style-scope.ytd-grid-channel-renderer").each((inx, elem)=> {
            const renderer_root= YoutubeUtil.search_renderer_root($(elem));
            if (renderer_root.length == 0) {
                return;
            }
            const elem_chname = $(elem).find("span#title");
            const elem_chlink = $(elem).find("a#channel-info");
            if (elem_chname.length == 0 || elem_chlink.length == 0) {
                return;
            }
            const channel = YoutubeUtil.get_channel_from_topic($(elem_chname).text());
            if (this.storage.channel_filter(channel)) {
                $(renderer_root).detach();
                return;
            }
            const author_url = $(elem_chlink).attr("href");
            if (this.filtering_by_channel_id(renderer_root, author_url)) {
                return;
            }
        });
        this.author_info_accessor.kick();
    }
    /*!
     *  @brief  チャンネル(チャンネルページ)にフィルタを掛ける
     *  @param  username    ユーザ名
     *  @param  channel_id  チャンネルID
     *  @note   ユーザページのフィルタリング
     *  @note   動画更新情報取得通知から呼ばれる
     */
    filtering_channel_channel_by_channel_id(username, channel_id) {
        $("div#channel.style-scope.ytd-grid-channel-renderer").each((inx, elem)=> {
            const renderer_root= YoutubeUtil.search_renderer_root($(elem));
            if (renderer_root.length == 0) {
                return;
            }
            const elem_chlink = $(elem).find("a#channel-info");
            if (elem_chlink.length == 0) {
                return;
            }
            const author_url = $(elem_chlink).attr("href");
            if (!YoutubeUtil.is_userpage_url(author_url) ||
                username != YoutubeUtil.cut_channel_id(author_url)) {
                return;
            }
            if (this.storage.channel_id_filter(channel_id)) {
                $(renderer_root).detach();
                return;
            }
            // ContextMenu用に書き込んでおく
            $(renderer_root).attr("channel_id", channel_id);
        });
    }
    
    /*!
     *  @brief  おすすめ動画フィルタ
     */
    filtering_recommend_video_core(tag_link) {
        $(tag_link).each((inx, elem)=> {
            const renderer_root = YoutubeUtil.search_renderer_root($(elem));
            if (renderer_root.length == 0) {
                return;
            }
            $(renderer_root).removeAttr("channel_id");
            //
            const title_tag = "span#video-title";
            const elem_title = $(elem).find(title_tag);
            const channnel_tag
                = "yt-formatted-string#text.style-scope.ytd-channel-name";
            const elem_channel
                = $(elem).find(channnel_tag);
            if (elem_title.length != 1 || elem_channel.length != 1) {
                return;
            }
            const title = $(elem_title[0]).text();
            const channel = $(elem_channel[0]).text();
            if (this.storage.channel_and_title_filter(channel, title)) {
                $(renderer_root).detach();
                return;
            }
            const video_id = YoutubeUtil.cut_movie_hash($(elem).attr("href"));
            const channel_id = this.video_info_accessor.get_channel_id(video_id);
            if (channel_id != null) {
                if (this.storage.channel_id_filter(channel_id, title)) {
                    $(renderer_root).detach();
                } else {
                    // ContextMenu用に書き込んでおく
                    $(renderer_root).attr("channel_id", channel_id);
                }
            } else {
                this.video_info_accessor.entry(video_id);
            }
        });
    }
    filtering_recommend_video() {
        const tag_video_link
            = "a.yt-simple-endpoint.style-scope.ytd-compact-video-renderer";
        this.filtering_recommend_video_core(tag_video_link);
        const tag_playlist_link
            = "a.yt-simple-endpoint.style-scope.ytd-compact-playlist-renderer";
        this.filtering_recommend_video_core(tag_playlist_link);
        this.video_info_accessor.kick();
    }
    /*!
     *  @brief  おすすめ動画フィルタ
     *  @param  video_id    動画ID
     *  @param  channel_id  チャンネルID
     *  @note   動画詳細取得コールバック
     */
    filtering_recommend_video_by_channel_id_core(video_id, channel_id, tag_link) {
        $(tag_link).each((inx, elem)=> {
            if (video_id != YoutubeUtil.cut_movie_hash($(elem).attr("href"))) {
                return true;
            }
            const renderer_root = YoutubeUtil.search_renderer_root($(elem));
            if (renderer_root.length == 0) {
                return true;
            }
            const title_tag = "span#video-title";
            const elem_title = $(elem).find(title_tag);
            if (elem_title.length != 1) {
                return true;
            }
            if (this.storage.channel_id_filter(channel_id, $(elem_title).text())) {
                $(renderer_root).detach();
            } else {
                // ContextMenu用に書き込んでおく
                $(renderer_root).attr("channel_id", channel_id);
            }
            return false;
        });
    }
    filtering_recommend_video_by_channel_id(video_id, channel_id) {
        const tag_video_link
            = "a.yt-simple-endpoint.style-scope.ytd-compact-video-renderer";
        this.filtering_recommend_video_by_channel_id_core(video_id, channel_id,
                                                          tag_video_link);
        const tag_playlist_link
            = "a.yt-simple-endpoint.style-scope.ytd-compact-playlist-renderer";
        this.filtering_recommend_video_by_channel_id_core(video_id, channel_id,
                                                          tag_playlist_link);
    }

    /*!
     *  @brief  動画(動画再生ページ)にフィルタを掛ける
     */
    filtering_watch_video() {
        this.filtering_recommend_video();

        // コメントフィルタ
        if (this.storage.have_ng_comment_data()) {
            var candidate_of_additional_ng_id = [];
            const author_tag
                = "a#author-text.yt-simple-endpoint.style-scope.ytd-comment-renderer";
            const comment_tag
                = "yt-formatted-string#content-text.style-scope.ytd-comment-renderer";
            $("div#main.style-scope.ytd-comment-renderer").each((inx, elem)=> {
                const elem_author = $(elem).find(author_tag);
                if (elem_author.length != 1) {
                    return;
                }
                const elem_user = $(elem_author).find("span");
                if (elem_user.length != 1) {
                    return;
                }
                const elem_comment = $(elem).find(comment_tag)
                if (elem_comment.length != 1) {
                    return;
                }
                const username
                    = text_utility
                      .remove_line_head_space(text_utility
                                              .remove_blank_line($(elem_user).text()));
                const userid = YoutubeUtil.cut_channel_id($(elem_author).attr("href"));
                const comment = $(elem_comment).text();
                const ret = this.storage.comment_filter(username, userid, comment);
                if (ret.result) {
                    const comment_root = $(elem).parent().parent();
                    if ($(comment_root).attr("is-reply") != null) {
                        // リプライのみ削除
                        $(comment_root).detach();
                    } else {
                        // コメントスレッドごと削除
                        $(comment_root).parent().detach();
                    }
                    if (ret.add_ng_id) {
                        candidate_of_additional_ng_id.push(userid);
                    }
                }
            });
            {
                var additional_ng_id = [];
                for (const ng_id of candidate_of_additional_ng_id) {
                    if (!this.storage.json.ng_comment_by_id.includes(ng_id)) {
                        additional_ng_id.push(ng_id);
                    }
                }
                if (additional_ng_id.length > 0) {
                    for (const ng_id of additional_ng_id) {
                        this.storage.json.ng_comment_by_id.push(ng_id);
                    }
                    this.storage.save();
                }
            }
        }
    }

    /*!
     *  @brief  動画(Youtubeホーム)にフィルタを掛ける
     */
    filtering_home_video() {
        const dismissable_tag
            = "div#dismissable.style-scope.ytd-rich-grid-video-renderer"
        $(dismissable_tag).each((inx, elem)=> {
            const tag_title = "a#video-title";
            const tag_channel = ".yt-simple-endpoint.style-scope.yt-formatted-string";
            //
            const marker = this.get_filtered_marker(elem);
            const hash = YoutubeUtil.get_video_hash(elem, tag_title);
            if (marker != null && hash == marker) {
                return;
            }
            this.remove_filtered_marker(elem);
            //
            if (this.filtering_video(elem, tag_title, tag_channel)) {
                return;
            }
            //
            this.set_filtered_marker(elem, hash);
        });
        this.author_info_accessor.kick();
    }
    /*!
     *  @brief  動画(Youtubeホーム)にフィルタを掛ける
     *  @param  username    ユーザ名
     *  @param  channel_id  チャンネルID
     *  @note   ユーザページを持つ動画のフィルタリング
     *  @note   動画更新情報取得通知から呼ばれる
     */
    filtering_home_video_by_channel_id(username, channel_id) {
        const dismissable_tag
            = "div#dismissable.style-scope.ytd-rich-grid-video-renderer"
        $(dismissable_tag).each((inx, elem)=> {
            const tag_title = "a#video-title";
            const tag_channel = ".yt-simple-endpoint.style-scope.yt-formatted-string";
            if (this.filtering_video_by_channel_id(elem, tag_title, tag_channel,
                                                   username, channel_id)) {
                return;
            }
        });
    }
    /*!
     *  @brief  動画(Youtubeホーム)のマーカーをクリアする
     *  @note   ContextMenu用
     */
    clear_home_video_marker(username, channel_id) {
        const dismissable_tag
            = "div#dismissable.style-scope.ytd-rich-grid-video-renderer"
        $(dismissable_tag).each((inx, elem)=> {
            this.remove_filtered_marker(elem);
        });
    }

    /*!
     *  @brief  「ゲーム」にフィルタリングを掛ける
     *  @note   BEST OF YOUTUBE > ゲーム
     *  @note   channelから専用ページ化された(19年春頃？)
     */
    filtering_youtube_gaming() {
        // 背景画面に動画出すやつ(選択式+自動切り替え)をまるごと消す
        // ※フィルタ対象動画が含まれていても、部分的には消せないため
        var elem = $("div#carousel.style-scope.ytd-carousel-header-renderer");
        if (elem != null) {
            $(elem).detach();
        }
    }

    /*!
     *  @brief  フィルタリング
     */
    filtering() {
        const loc = this.current_location;
        if (loc.in_youtube_search_page() || loc.in_youtube_trending()) {
            this.filtering_searched_video();
            this.filtering_searched_channel();
            this.filtering_searched_playlist();
        } else if (loc.in_youtube_channel_page() || loc.in_youtube_user_page()) {
            this.filtering_channel_video();
            this.filtering_channel_personal_video();
            this.filtering_channel_channel();
        } else if (loc.in_youtube_gaming()) {
            this.filtering_youtube_gaming();
            this.filtering_channel_video();
            this.filtering_channel_channel();
        } else if (loc.in_youtube_movie_page()) {
            this.filtering_watch_video();
        } else if (loc.in_top_page()) {
            this.filtering_home_video();
        }
    }


    /*!
     *  @brief  動画情報(json)取得完了通知後処理
     *  @param  obj 動画オブジェクト
     */
    post_proc_tell_get_video_json(obj) {
        if (obj.channel_id != null) {
            this.filtering_recommend_video_by_channel_id(obj.video_id, obj.channel_id);
        } else
        if (obj.username) {
            const channel_id = this.author_info_accessor.get_channel_id(obj.username);
            if (channel_id != null) {
                this.video_info_accessor.set_channel_id(obj.video_id, channel_id);
                this.filtering_recommend_video_by_channel_id(obj.video_id, channel_id);
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
        for (const video_id of video_ids) {
            this.filtering_recommend_video_by_channel_id(video_id, obj.channel_id);
        }
        this.filtering_searched_video_by_channel_id(obj.username, obj.channel_id);
        this.filtering_searched_channel_by_channel_id(obj.username, obj.channel_id);
        this.filtering_searched_playlist_by_channel_id(obj.username, obj.channel_id);
        this.filtering_channel_video_by_channel_id(obj.username, obj.channel_id);
        this.filtering_channel_personal_video_by_channel_id(obj.username,
                                                            obj.channel_id);
        this.filtering_home_video_by_channel_id(obj.username, obj.channel_id);
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

    /*!
     *  @brief  高速化用マーカーをクリアする
     */
    clear_marker() {
        const loc = this.current_location;
        if (loc.in_youtube_search_page() || loc.in_youtube_trending()) {
            this.clear_searched_video_marker();
        } else if (loc.in_top_page()) {
            this.clear_home_video_marker();
        }
    }

    /*!
     *  @brief  DOM要素追加callback
     *  @note   DOM要素追加タイミングで行いたい処理群
     */
    callback_domelement_adition() {
        // 自動再生をオフにする
        if (this.storage.json.stop_autoplay) {
            const button0
                = "paper-toggle-button#toggle.style-scope.ytd-compact-autoplay-renderer";
            $(button0).each((inx, btn)=> {
                const press = $(btn).attr("aria-pressed");
                if (press != null && press == "true") {
                    btn.click();
                }
            });
            const button1
                = "paper-toggle-button#improved-toggle.style-scope.ytd-compact-autoplay-renderer";
            $(button1).each((inx, btn)=> {
                const press = $(btn).attr("aria-pressed");
                if (press != null && press == "true") {
                    btn.click();
                }
            });
        }
    }

    get_observing_node(elem) {
        const tag = "ytd-page-manager#page-manager.style-scope.ytd-app";
        $(tag).each((inx, e)=>{ elem.push(e); });
    }

    callback_domloaded() {
        super.filtering();
        super.callback_domloaded();
    }

    /*!
     *  @brief  無効な追加DOM要素か？
     *  @retun  true    無効
     */
    is_valid_records(records) {
        // マウスオーバによるアイテム追加は弾きたい
        if (records[0].target.id.indexOf('-overlay') >= 0) {
            return; true;
        }
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
