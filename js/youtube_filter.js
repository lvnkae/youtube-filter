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
     *  @brief  カスタムチャンネル名からチャンネルIDを得る
     *  @param  custom_name カスタムチャンネル名
     */
    get_custom_channel_channel_id(custom_name) {
        const channel_id = this.channel_info_accessor.get_channel_id(custom_name);
        if (channel_id != null) {
            return channel_id;
        }
        return this.video_info_accessor.get_channel_id_by_cunstom_channel(custom_name);
    }

    /*!
     *  @brief  チャンネルURLからチャンネルIDを得る
     *  @note   取得できなければ必要な情報をネットワーク経由で得る
     *  @note   (要求をentryするだけ)
     *  @param  author_url  チャンネルURL
     */
    get_channel_id_from_author_url_or_entry_request(author_url) {
        const channel_code = YoutubeUtil.cut_channel_id(author_url);
        if (YoutubeUtil.is_channel_url(author_url)) {
            return YoutubeUtil.cut_channel_id(author_url);
        } else if (YoutubeUtil.is_userpage_url(author_url)) {
            const channel_id = this.author_info_accessor.get_channel_id(channel_code);
            if (channel_id != null) {
                return channel_id;
            }
            this.author_info_accessor.entry(channel_code);
        } else if (YoutubeUtil.is_custom_channel_url(author_url)) {
            const channel_id = this.get_custom_channel_channel_id(channel_code);
            if (channel_id != null) {
                return channel_id;
            }
            this.channel_info_accessor.entry(channel_code);
        }
        return null;
    }

    /*!
     *  @brief  動画群のヘッダをクリアリングする
     *  @note   属する動画が(フィルタリングされて)空ならヘッダも削除
     */
    clearing_section_list_header() {
        const tag = "ytd-item-section-renderer.style-scope.ytd-section-list-renderer";
        $(tag).each((inx, elem)=> {
            const sc_container = $(elem).find("div#scroll-container");
            if (sc_container.length <= 0) {
                return;
            }
            const items = $(sc_container).find("div#items");
            if (items.length <= 0) {
                return;
            }
            if (items[0].childNodes.length == 0) {
                $(elem).detach();
            }
        });
    }

    /*!
     *  @brief  動画フィルタ(チャンネルページURL)
     *  @param  renderer_root   renderオブジェクト
     *  @param  author_url      チャンネルページURL
     *  @param  title           動画タイトル(空の場合もある)
     *  @param  detach_func     detach関数(空の場合もある)
     *  @retval true            指定動画(renderオブジェクト)がdetachされた
     *  @note   チャンネルページURLを基点とした動画フィルタ
     *  @note   チャンネルページURLからチャンネルIDを取り出せない場合は
     *  @note   Youtubeへ問い合わせる(非同期処理)
     */
    filtering_video_by_author_url(renderer_root, author_url, title, detach_func) {
        var channel_id = null;
        if (YoutubeUtil.is_channel_url(author_url)) {
            channel_id = YoutubeUtil.cut_channel_id(author_url);
        } else if (YoutubeUtil.is_userpage_url(author_url)) {
            const username = YoutubeUtil.cut_channel_id(author_url);
            channel_id = this.author_info_accessor.get_channel_id(username);
            if (channel_id == null) {
                this.author_info_accessor.entry(username);
                return false;
            }
        } else if (YoutubeUtil.is_custom_channel_url(author_url)) {
                return false; // ロジックエラー
        }
        if (this.storage.channel_id_filter(channel_id, title)) {
            if (detach_func != null) {
                detach_func(renderer_root);
            } else {
                $(renderer_root).detach();
            }
            return true;
        } else {
            // ContextMenu用に書き込んでおく
            $(renderer_root).attr("channel_id", channel_id);
            return false;
        }
    }

    /*!
     *  @brief  動画フィルタ(カスタムチャンネルURL)
     *  @param  renderer_root   renderオブジェクト
     *  @param  custom_url      カスタムチャンネルURL
     *  @param  title           動画タイトル
     *  @param  video_id        動画ID
     *  @param  detach_func     detach関数(空の場合もある)
     *  @retval true            指定動画(renderオブジェクト)がdetachされた
     *  @note   カスタムチャンネルURLを基点とした動画フィルタ
     *  @note   チャンネルIDはYoutubeへ問い合わせる(非同期処理)
     */
    filtering_custom_channel_video(renderer_root,
                                   custom_url,
                                   title,
                                   video_id,
                                   detach_func) {
        if (!YoutubeUtil.is_custom_channel_url(custom_url)) {
            return false; // ロジックエラー
        }
        const custom_name = YoutubeUtil.cut_channel_id(custom_url);
        const channel_id = this.get_custom_channel_channel_id(custom_name);
        if (channel_id == null) {
            this.video_info_accessor.entry(video_id, custom_name);
            return false;
        } else {
            if (this.storage.channel_id_filter(channel_id, title)) {
                if (detach_func == null) {
                    $(renderer_root).detach();
                } else {
                    detach_func(renderer_root);
                }
                return true;
            } else {
                // ContextMenu用に書き込んでおく
                $(renderer_root).attr("channel_id", channel_id);
                return false;
            }
        }
    }

        /*!
     *  @brief  動画フィルタ(動画ID)
     *  @param  renderer_root   renderオブジェクト
     *  @param  video_id        動画ID
     *  @param  title           動画タイトル
     *  @retval true            指定動画(renderオブジェクト)がdetachされた
     *  @note   動画ID(ハッシュ)を基点とした動画フィルタ
     *  @note   Youtubeからjsonを得て詳細フィルタをかける(非同期処理)
     */
    filtering_video_by_id(renderer_root, video_id, title) {
        const channel_info = this.video_info_accessor.get_channel_info(video_id);
        if (channel_info == null) {
            this.video_info_accessor.entry(video_id);
            return false;
        }
        if (this.storage.channel_id_filter(channel_info.id, title) ||
            this.storage.channel_filter(channel_info.name, title)) {
            $(renderer_root).detach();
            return true;
        } else {
            // ContextMenu用に書き込んでおく
            $(renderer_root).attr("channel_id", channel_info.id);
            YoutubeUtil.set_channel_name(renderer_root, channel_info.name);
            return false;
        }
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
            return false;
        }
        const elem_title = $(elem).find(tag_title);
        const elem_channel = HTMLUtil.find_first_appearing_element(elem, tag_channel);
        if (elem_title.length != 1 || elem_channel == null) {
            return false;
        }
        const title = $(elem_title).text();
        const channel = $(elem_channel).text();
        if (this.storage.channel_and_title_filter(channel, title)) {
            $(renderer_root).detach();
            return true;
        }
        const author_url = $(elem_channel).attr("href");
        if (author_url == null) {
            return false;
        }
        if (YoutubeUtil.is_custom_channel_url(author_url)) {
            const video_id = YoutubeUtil.get_video_hash(renderer_root, "a#thumbnail");
            return this.filtering_custom_channel_video(renderer_root,
                                                       author_url,
                                                       title,
                                                       video_id);
        } else {
            return this.filtering_video_by_author_url(renderer_root, author_url, title);
        }
    }
    /*!
     *  @brief  動画フィルタ(個人チャンネルページ)
     *  @param  elem        親ノード
     *  @param  tag_title   動画タイトルタグ
     *  @param  channel     チャンネル名
     *  @param  channel_id  チャンネルID
     *  @retval true        処理打ち切りまたは要素削除
     *  @note   個人チャンネルページの
     *  @note   「チャンネル名表示が省略された動画」をフィルタリング
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
        if (channel_id == null) {
            const author_url = YoutubeUtil.get_page_author_url();
            if (!YoutubeUtil.is_custom_channel_url(author_url)) {
                return true;
            }
            // カスタムチャンネル例外
            const custom_name = YoutubeUtil.cut_channel_id(author_url);
            channel_id = this.get_custom_channel_channel_id(custom_name);
            if (channel_id == null) {
                const video_id
                    = YoutubeUtil.get_video_hash(renderer_root, "a#thumbnail");
                this.video_info_accessor.entry(video_id, custom_name);
                return false;
            }
        }
        if (this.storage.channel_id_filter(channel_id, title)) {
            $(renderer_root).detach();
            return true;
        }
        // ContextMenu用に書き込んでおく
        $(renderer_root).attr("channel_id", channel_id);
        return false;
    }
    /*!
     *  @brief  動画フィルタ(チャンネルコード)
     *  @param  elem            親ノード
     *  @param  tag_title       動画タイトルタグ
     *  @param  tag_channel     動画チャンネルタグ
     *  @param  channel_code    ユーザ名
     *  @param  channel_id      チャンネルID
     *  @param  chk_func        チャンネル判別関数
     *  @retval true            処理打ち切りまたは要素削除
     *  @note   チャンネルコードを基点とした動画フィルタ
     */
    filtering_video_by_channel_code(elem, tag_title, tag_channel,
                                    channel_code, channel_id, chk_func) {
        const renderer_root = YoutubeUtil.search_renderer_root($(elem));
        if (renderer_root.length == 0) {
            return true;
        }
        const elem_channel = HTMLUtil.find_first_appearing_element(elem, tag_channel);
        if (elem_channel == null) {
            return true;
        }
        const author_url = $(elem_channel).attr("href");
        if (!chk_func(author_url)) {
            return true;
        }
        if (channel_code != YoutubeUtil.cut_channel_id(author_url)) {
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
     *  @brief  動画フィルタ(ユーザ名)
     *  @param  elem        親ノード
     *  @param  tag_title   動画タイトルタグ
     *  @param  tag_channel 動画チャンネルタグ
     *  @param  username    ユーザ名
     *  @param  channel_id  チャンネルID
     *  @retval true        処理打ち切りまたは要素削除
     */
    filtering_video_by_username(elem, tag_title, tag_channel, username, channel_id) {
        return this.filtering_video_by_channel_code(elem,
            tag_title,
            tag_channel,
            username,
            channel_id,
            YoutubeUtil.is_userpage_url);
    }
    /*!
     *  @brief  動画フィルタ(カスタムチャンネル名)
     *  @param  elem        親ノード
     *  @param  tag_title   動画タイトルタグ
     *  @param  tag_channel 動画チャンネルタグ
     *  @param  custom_name カスタムチャンネル名
     *  @param  channel_id  チャンネルID
     *  @retval true        処理打ち切りまたは要素削除
     */
    filtering_video_by_custom_name(elem, tag_title, tag_channel,
                                   custom_name, channel_id) {
        return this.filtering_video_by_channel_code(elem,
            tag_title,
            tag_channel,
            custom_name,
            channel_id,
            YoutubeUtil.is_custom_channel_url);
    }

    /*!
     *  @brief  short動画フィルタ
     *  @param  elem        親ノード
     *  @param  tag_title   動画タイトルタグ
     *  @param  video_id    動画ID
     *  @retval true        処理打ち切りまたは要素削除
     *  @note   チャンネル名表記が省略されてるタイプ
     */
    filtering_short_slim_video(elem, tag_title, video_id) {
        const renderer_root = YoutubeUtil.search_renderer_root($(elem));
        if (renderer_root.length == 0) {
            return true;
        }
        const elem_title = $(elem).find(tag_title);
        if (elem_title.length != 1) {
            return true;
        }
        const title = $(elem_title).text();
        if (this.storage.title_filter(title)) {
            $(renderer_root).detach();
            return true;
        }
        return this.filtering_video_by_id(renderer_root, video_id, title);
    }
    /*!
     *  @brief  short動画群にフィルタをかける
     *  @note   "ホーム"、"ゲーム"などに差し込まれるshort動画用
     */
    filtering_short_slim_videos(tag) {
        const dismissible_tag_short = this.dismissible_tag + tag;
        $(dismissible_tag_short).each((inx, elem)=> {
            const tag_title = "#video-title";
            const tag_thumbnail = "a#thumbnail";
            //
            const marker = this.get_filtered_marker(elem);
            const hash = YoutubeUtil.get_video_hash(elem, tag_thumbnail);
            if (marker != null && hash == marker) {
                return;
            }
            this.remove_filtered_marker(elem);
            //
            if (this.filtering_short_slim_video(elem, tag_title, hash)) {
                return;
            }
            //
            this.set_filtered_marker(elem, hash);
        });
    }
    /*!
     *  @brief  short動画フィルタ(動画ID)
     *  @param  video_id        動画ID
     *  @note   動画情報(json)取得完了通知後処理から呼ばれる
     */
    filtering_short_slim_video_by_video_id_core(tag, video_id) {
        const dismissible_tag_short = this.dismissible_tag + tag;
        $(dismissible_tag_short).each((inx, elem)=> {
            const tag_title = "#video-title";
            const tag_thumbnail = "a#thumbnail";
            //
            const hash = YoutubeUtil.get_video_hash(elem, tag_thumbnail);
            if (hash != video_id) {
                return true;
            }
            const renderer_root = YoutubeUtil.search_renderer_root($(elem));
            const elem_title = $(elem).find(tag_title);
            const channel_info = this.video_info_accessor.get_channel_info(video_id);
            if (renderer_root.length == 0 ||
                elem_title.length == 0 ||
                channel_info == null) {
                return false;
            }
            const title = $(elem_title).text();
            if (this.storage.channel_id_filter(channel_info.id, title) ||
                this.storage.channel_filter(channel_info.name, title)) {
                $(renderer_root).detach();
            } else {
                // ContextMenu用に書き込んでおく
                $(renderer_root).attr("channel_id", channel_info.id);
                YoutubeUtil.set_channel_name(renderer_root, channel_info.name);
            }
            return false;
        });
    }
    filtering_short_slim_video_by_video_id(video_id) {
        const tag_grid = ".style-scope.ytd-rich-grid-slim-media";
        this.filtering_short_slim_video_by_video_id_core(tag_grid, video_id);
        const tag_reel = ".style-scope.ytd-reel-item-renderer";
        this.filtering_short_slim_video_by_video_id_core(tag_reel, video_id);
    }

    /*!
     *  @brief  動画(ショート)にフィルタを翔ける
     */
    filtering_short_video() {
        const tag_short = ".reel-video-in-sequence.style-scope.ytd-shorts"
        $(tag_short).each((inx, elem)=> {
            const e_title = $(elem).find("h2.title");
            const e_channel = $(elem).find("div#channel-info");
            if (e_title.length <= 0 || e_channel.length <= 0) {
                return;
            }
            const title = $(e_title).text();
            const channel = YoutubeUtil.get_channel_name(e_channel);
            if (this.storage.channel_and_title_filter(channel, title)) {
                HTMLUtil.detach_children_all(elem);
                return;
            }
            const author_url = $($(e_channel).find("a")[0]).attr("href");
            const channel_id
                = this.get_channel_id_from_author_url_or_entry_request(author_url);
            if (channel_id == null) {
                //
            } else if (this.storage.channel_id_filter(channel_id, title)) {
                HTMLUtil.detach_children_all(elem);
            } else {
                // ContextMenu用に書き込んでおく
                $(elem).attr("channel_id", channel_id);
            }
        });
    }
    /*!
     *  @brief  short動画フィルタ(チャンネルコード)
     *  @param  channel_code    ユーザ名/カスタムチャンネル名
     *  @param  channel_id      チャンネルID
     *  @param  chk_func        チャンネル判別関数
     *  @note   動画更新情報(xml)またはカスタムチャンネル情報(html)↓
     *  @note   取得完了通知後処理から呼ばれる
     */
    filtering_short_video_by_channel_code(channel_code, channel_id, chk_func) {
        const tag_short = ".reel-video-in-sequence.style-scope.ytd-shorts"
        $(tag_short).each((inx, elem)=> {
            const e_title = $(elem).find("h2.title");
            const e_channel = $(elem).find("div#channel-info");
            if (e_title.length <= 0 || e_channel.length <= 0) {
                return;
            }
            //
            const author_url = $($(e_channel).find("a")[0]).attr("href");
            if (!chk_func(author_url)) {
                return;
            }
            if (channel_code != YoutubeUtil.cut_channel_id(author_url)) {
                return;
            }
            if (this.storage.channel_id_filter(channel_id, $(e_title).text())) {
                HTMLUtil.detach_children_all(elem);
                return;
            }
            // ContextMenu用に書き込んでおく
            $(elem).attr("channel_id", channel_id);
        });
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
    }
    /*!
     *  @brief  動画(Youtube検索)にフィルタを掛ける
     *  @param  channel_code    チャンネルコード
     *  @param  channel_id      チャンネルID
     *  @param  fl_func         フィルタ関数
     *  @note   チャンネルコードを持つ動画のフィルタリング
     *  @note   チャンネルID受信処理から呼ばれる
     */
    filtering_searched_video_by_channel_id(channel_code, channel_id, fl_func) {
        $(".text-wrapper.style-scope.ytd-video-renderer").each((inx, elem)=> {
            const tag_title = "a#video-title";
            const tag_channel = ".yt-simple-endpoint.style-scope.yt-formatted-string";
            fl_func(elem, tag_title, tag_channel, channel_code, channel_id);
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
        const tag_channel = "ytd-channel-renderer.style-scope.ytd-item-section-renderer";
        $(tag_channel).each((inx, elem)=> {
            const channel = YoutubeUtil.get_channel_name(elem);
            if (this.storage.channel_filter(channel)) {
                $(elem).detach();
                return;
            }
            const e_channel_link = $(elem).find("a#main-link");
            if (e_channel_link.length <= 0) {
                return;
            }
            const author_url = $(e_channel_link).attr("href");
            if (YoutubeUtil.is_custom_channel_url(author_url)) {
                const custom_name = YoutubeUtil.cut_channel_id(author_url);
                const channel_id = this.get_custom_channel_channel_id(custom_name);
                if (channel_id != null) {
                    if (this.storage.channel_id_filter(channel_id)) {
                        $(elem).detach();
                    }
                } else {
                    this.channel_info_accessor.entry(custom_name);
                }
            } else {
                this.filtering_video_by_author_url(elem, author_url);
            }
        });
    }
    /*!
     *  @brief  チャンネル(Youtube検索)にフィルタを掛ける
     *  @param  channel_code    ユーザ名/カスタムチャンネル名
     *  @param  channel_id      チャンネルID
     *  @param  chk_func        チャンネル判別関数
     *  @note   動画更新情報(xml)またはカスタムチャンネル情報(html)↓
     *  @note   取得完了通知後処理から呼ばれる
     */
    filtering_searched_channel_by_channel_id(channel_code, channel_id, chk_func) {
        const tag_channel = "ytd-channel-renderer.style-scope.ytd-item-section-renderer";
        $(tag_channel).each((inx, elem)=> {
            const e_channel_link = $(elem).find("a#main-link");
            if (e_channel_link.length <= 0) {
                return;
            }
            const author_url = $(e_channel_link).attr("href");
            if (!chk_func(author_url)) {
                return;
            }
            if (channel_code != YoutubeUtil.cut_channel_id(author_url)) {
                return;
            }
            if (this.storage.channel_id_filter(channel_id)) {
                $(elem).detach();
                return;
            }
            // ContextMenu用に書き込んでおく
            $(elem).attr("channel_id", channel_id);
        });
    }

    /*!
     *  @brief  プレイリストフィルタ
     *  @param  elem        親ノード
     *  @retval true        要素削除
     */
    filtering_playlist(elem) {
        const renderer_root = YoutubeUtil.search_renderer_root($(elem));
        if (renderer_root.length == 0) {
            return false;
        }
        const elem_title = $(elem).find("span#video-title");
        const elem_channel = YoutubeUtil.get_channel_name_element(elem);
        if (elem_title.length != 1 || elem_channel == null) {
            return false;
        }
        const title = $(elem_title).text();
        const channel = $(elem_channel).text();
        if (this.storage.channel_and_title_filter(channel, title)) {
            $(renderer_root).detach();
            return true;
        }
        const link_tag = $(elem_channel).find("a");
        if (link_tag.length <= 0) {
            return false;
        }
        const author_url = $(link_tag).attr("href");
        if (author_url == null) {
            return false;
        }
        const channel_id
            = this.get_channel_id_from_author_url_or_entry_request(author_url);
        if (channel_id == null) {
            //
        } else if (this.storage.channel_id_filter(channel_id, title)) {
            $(renderer_root).detach();
            return true;
        } else {
            // ContextMenu用に書き込んでおく
            $(renderer_root).attr("channel_id", channel_id);
        }
        return false;
    }

    searched_playlist_filter_core(fl_func) {
        $("a.yt-simple-endpoint.style-scope.ytd-playlist-renderer").each((inx, elem)=> {
            return fl_func(elem);
        });
    }
    /*!
     *  @brief  プレイリスト(Youtube検索)にフィルタを掛ける
     */
    filtering_searched_playlist() {
        this.searched_playlist_filter_core((elem)=> {
            this.filtering_playlist(elem);
            return true;
        });
    }
    /*!
     *  @param  channel_code    ユーザ名/カスタムチャンネル名
     *  @param  channel_id      チャンネルID
     *  @param  fl_func         フィルタ関数
     *  @note   動画更新情報(xml)またはカスタムチャンネル情報(html)↓
     *  @note   取得完了通知後処理から呼ばれる
     */
    filtering_searched_playlist_by_channel_id(channel_code, channel_id, fl_func) {
        this.searched_playlist_filter_core((elem)=> {
            const tag_title = "span#video-title"
            const tag_channel = "a.yt-simple-endpoint.style-scope.yt-formatted-string";
            return fl_func(elem, tag_title, tag_channel, channel_code, channel_id);
        });
    }

    /*!
     *  @brief  Mixリストフィルタ
     */
    filtering_radio(elem) {
        const renderer_root = YoutubeUtil.search_renderer_root($(elem));
        if (renderer_root.length == 0) {
            return;
        }
        const elem_title = $(elem).find("span#video-title");
        if (elem_title.length <= 0) {
            return;
        }
        const channel
            = text_utility.remove_blank_line(
                YoutubeUtil.get_channel_name_from_radio($(elem_title).text()));
        if (this.storage.channel_filter(channel)) {
            $(renderer_root).detach();
            return;
        }
        YoutubeUtil.set_channel_name(renderer_root, channel);
        //
        const video_id = YoutubeUtil.get_video_hash_by_node($(elem));
        const channel_id = this.video_info_accessor.get_channel_id(video_id);
        if (channel_id != null) {
            if (this.storage.channel_id_filter(channel_id)) {
                $(renderer_root).detach();
            } else {
                // ContextMenu用に書き込んでおく
                $(renderer_root).attr("channel_id", channel_id);
            }
        } else {
            this.video_info_accessor.entry(video_id);
        }
    }

    filtering_searched_radio_core(fl_func) {
        $("a.yt-simple-endpoint.style-scope.ytd-radio-renderer").each((inx, elem)=> {
            fl_func(elem);
        });
    }
    /*!
     *  @brief  Mixリスト(Youtube検索)にフィルタをかける
     */
    filtering_searched_radio() {
        this.filtering_searched_radio_core((elem)=> {
            this.filtering_radio(elem);
        });
    }
    /*!
     *  @brief  Mixリスト(Youtube検索)にフィルタをかける
     *  @note   動画更新情報(xml)またはカスタムチャンネル情報(html)↓
     *  @note   または動画情報(json)取得完了通知後処理から呼ばれる
     */
    filtering_searched_radio_by_channel_id(video_id, channel_id) {
        this.filtering_searched_radio_core((elem)=> {
            const renderer_root = YoutubeUtil.search_renderer_root($(elem));
            if (renderer_root.length == 0) {
                return;
            }
            if (video_id != YoutubeUtil.get_video_hash_by_node($(elem))) {
                return;
            }
            if (this.storage.channel_id_filter(channel_id)) {
                $(renderer_root).detach();
            } else {
                // ContextMenu用に書き込んでおく
                $(renderer_root).attr("channel_id", channel_id);
            }
        });
    }

    /*!
     *  @brief  水平スクロール動画群にフィルタをかける
     *  @note   探索/急上昇に差し込まれるやつ
     *  @note   short/通常両対応
     *  @note   xml(username),html(custom_name)取得コールバックは汎用でOK
     */
    filtering_horizontal_videos() {
        $("div#meta.style-scope.ytd-grid-video-renderer").each((inx, elem)=> {
            const tag_title = "a#video-title";
            const tag_channel = "a.yt-simple-endpoint.style-scope.yt-formatted-string";
            if (this.filtering_video(elem, tag_title, tag_channel)) {
                return;
            }
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
                HTMLUtil.detach_upper_node($(ctg), "ytd-item-section-renderer");
            }
        });
    }
    filtering_channel_video() {
        this.filtering_channel_video_core((elem, tag_title, tag_channel)=> {
            return this.filtering_video(elem, tag_title, tag_channel);
        });
    }
    /*!
     *  @brief  動画(チャンネルページ)にフィルタを掛ける
     *  @param  channel_code    チャンネルコード
     *  @param  channel_id      チャンネルID
     *  @note   チャンネルコードを持つ動画のフィルタリング
     *  @note   チャンネルID受信処理から呼ばれる
     */
    filtering_channel_video_by_channel_id(channel_code, channel_id, fl_func) {
        this.filtering_channel_video_core((elem, tag_title, tag_channel)=> {
            return fl_func(elem, tag_title, tag_channel, channel_code, channel_id);
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
                return;
            }
        } else if (YoutubeUtil.is_custom_channel_url(author_url)) {
            // このタイミングでチャンネルIDを得る術が無いのでスルー
        } else if (YoutubeUtil.is_channel_url(author_url)) {
            channel_id = YoutubeUtil.cut_channel_id(author_url);
        } else {
            return; // ロジックエラー
        }
        const channel = YoutubeUtil.get_page_channel_name();
        if (channel == null) {
            return;
        }
        this.filtering_channel_video_core((elem, tag_title, tag_channel)=> {
            const elem_channel = HTMLUtil.find_first_appearing_element(elem, tag_channel);
            if (elem_channel != null) {
                return;
            }
            return this.filtering_personal_video(elem, tag_title, channel, channel_id);
        });
    }
    /*!
     *  @note   個人チャンネル動画のフィルタリング
     *  @param  channel_code    チャンネルコード
     *  @param  channel_id      チャンネルID
     *  @note   チャンネル名表示が省略されてる動画のフィルタリング
     *  @note   チャンネルID受信処理から呼ばれる
     */
    filtering_channel_personal_video_by_channel_id(channel_code, channel_id, chk_func) {
        const author_url = YoutubeUtil.get_page_author_url();
        if (!chk_func(author_url)) {
            return;
        }
        if (channel_code != YoutubeUtil.cut_channel_id(author_url)) {
            return;
        }
        const channel = YoutubeUtil.get_page_channel_name();
        if (channel == null) {
            return;
        }
        this.filtering_channel_video_core((elem, tag_title, tag_channel)=> {
            const elem_channel = HTMLUtil.find_first_appearing_element(elem, tag_channel);
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
            const renderer_root = YoutubeUtil.search_renderer_root($(elem));
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
            if (this.filtering_video_by_author_url(renderer_root, author_url)) {
                return;
            }
        });
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
            const renderer_root = YoutubeUtil.search_renderer_root($(elem));
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

    call_recommended_video_filter(fl_func) {
        const e_parent = $("div#related.style-scope.ytd-watch-flexy");
        if (e_parent.length > 0) {
            const tag_video_link
                = "a.yt-simple-endpoint.style-scope.ytd-compact-video-renderer";
            const tag_playlist_link
                = "a.yt-simple-endpoint.style-scope.ytd-compact-playlist-renderer";
            fl_func(e_parent, tag_video_link, tag_playlist_link);
        }
    }
    /*!
     *  @brief  おすすめ動画フィルタ
     *  @param  e_parent    親ノード
     *  @param  tag_link    対象ノードのタグ
     */
    filtering_recommend_video_core(e_parent, tag_link) {
        $(e_parent).find(tag_link).each((inx, elem)=> {
            const renderer_root = YoutubeUtil.search_renderer_root($(elem));
            if (renderer_root.length == 0) {
                return;
            }
            $(renderer_root).removeAttr("channel_id");
            //
            const title_tag = "span#video-title";
            const elem_title = $(elem).find(title_tag);
            if (elem_title.length != 1) {
                return;
            }
            const title = $(elem_title[0]).text();
            const channel = YoutubeUtil.get_channel_name(elem);
            if (this.storage.channel_and_title_filter(channel, title)) {
                $(renderer_root).detach();
                return;
            }
            const video_id = YoutubeUtil.get_video_hash_by_node($(elem));
            const channel_id = this.video_info_accessor.get_channel_id(video_id);
            if (channel_id != null) {
                if (this.storage.channel_id_filter(channel_id, title)) {
                    HTMLUtil.detach_lower_node(renderer_root, this.dismissible_tag)
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
        this.call_recommended_video_filter((e_parent,
                                            tag_video_link,
                                            tag_playlist_link)=> {
            this.filtering_recommend_video_core(e_parent, tag_video_link);
            this.filtering_recommend_video_core(e_parent, tag_playlist_link);
            // ぐるぐる対策
            $("ytd-continuation-item-renderer").each((inx, spin)=> {
                if ($(spin).next().length > 0) {
                    $(spin).detach();
                }
            });
        });
    }
    /*!
     *  @brief  おすすめ動画フィルタ
     *  @param  video_id    動画ID
     *  @param  channel_id  チャンネルID
     *  @param  e_parent    親ノード
     *  @param  tag_link    対象ノードのタグ
     *  @note   動画詳細取得コールバック
     */
    filtering_recommend_video_by_channel_id_core(video_id,
                                                 channel_id,
                                                 e_parent,
                                                 tag_link) {
        $(e_parent).find(tag_link).each((inx, elem)=> {
            if (video_id != YoutubeUtil.get_video_hash_by_node($(elem))) {
                return true;
            }
            const renderer_root = YoutubeUtil.search_renderer_root($(elem));
            if (renderer_root.length == 0) {
                return false;
            }
            const title_tag = "span#video-title";
            const elem_title = $(elem).find(title_tag);
            if (elem_title.length != 1) {
                return false;
            }
            if (this.storage.channel_id_filter(channel_id, $(elem_title).text())) {
                HTMLUtil.detach_lower_node(renderer_root, this.dismissible_tag)
            } else {
                // ContextMenu用に書き込んでおく
                $(renderer_root).attr("channel_id", channel_id);
            }
            return false;
        });
    }
    filtering_recommend_video_by_channel_id(video_id, channel_id) {
        this.call_recommended_video_filter((e_parent,
                                            tag_video_link,
                                            tag_playlist_link)=> {
            this.filtering_recommend_video_by_channel_id_core(video_id,
                                                              channel_id,
                                                              e_parent,
                                                              tag_video_link);
            this.filtering_recommend_video_by_channel_id_core(video_id,
                                                              channel_id,
                                                              e_parent,
                                                              tag_playlist_link);
        });
    }

    /*!
     *  @brief  おすすめ動画フィルタ(動画終了時のやつ)
     */
    filtering_endscreen_recommend_video(tag_link) {
        $("div.ytp-endscreen-content").each((inx, scr)=> {
            $(scr).find("a").each((inx, a_tag)=> {
                const title_tag = "span.ytp-videowall-still-info-title";
                const elem_title = $(a_tag).find(title_tag);
                const channel_tag = "span.ytp-videowall-still-info-author";
                const elem_channel = $(a_tag).find(channel_tag);
                if (elem_title.length == 0 || elem_channel.length == 0) {
                    return;
                }
                const title = $(elem_title).text();
                const channel
                    = YoutubeUtil.get_channel_from_author_info($(elem_channel).text());
                if (channel.length == 0) {
                    return;
                }
                if (this.storage.channel_and_title_filter(channel, title)) {
                    $(a_tag).detach();
                    return;
                }
                const video_id = YoutubeUtil.get_video_hash_by_node($(a_tag));
                const channel_id = this.video_info_accessor.get_channel_id(video_id);
                if (channel_id != null) {
                    if (this.storage.channel_id_filter(channel_id, title)) {
                        $(a_tag).detach();
                    } else {
                        // ContextMenu用に書き込んでおく
                        $(a_tag).attr("channel_id", channel_id);
                    }
                }
                // note
                // 動画終了時のおすすめ動画(a)は再生画面右に出るおすすめ動画(b)と
                // 共通(a∋b)であるため、(b)フィルタ処理でchannel_id取得済み。
                // (a)独自に取得要求を出す必要はない。
            });
        });
    }
    /*!
     *  @brief  動画(動画再生ページ)にフィルタを掛ける
     */
    filtering_watch_video() {
        this.filtering_recommend_video();
        this.filtering_endscreen_recommend_video();

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
                const comment = YoutubeUtil.get_comment(elem_comment);
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
            = this.dismissible_tag + ".style-scope.ytd-rich-grid-media";
        $(dismissable_tag).each((inx, elem)=> {
            const tag_title = "#video-title";
            const tag_thumbnail = "a#thumbnail";
            const tag_channel = ".yt-simple-endpoint.style-scope.yt-formatted-string";
            //
            const marker = this.get_filtered_marker(elem);
            const hash = YoutubeUtil.get_video_hash(elem, tag_thumbnail);
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
    }
    /*!
     *  @brief  動画(Youtubeホーム)にフィルタを掛ける
     *  @param  channel_code    チャンネルコード
     *  @param  channel_id      チャンネルID
     *  @param  fl_func         フィルタ関数
     *  @note   チャンネルコードを持つ動画のフィルタリング
     *  @note   チャンネルID受信処理から呼ばれる
     */
    filtering_home_video_by_channel_id(channel_code, channel_id, fl_func) {
        const dismissable_tag
            = this.dismissible_tag + ".style-scope.ytd-rich-grid-media";
        $(dismissable_tag).each((inx, elem)=> {
            const tag_title = "#video-title";
            const tag_channel = ".yt-simple-endpoint.style-scope.yt-formatted-string";
            if (fl_func(elem, tag_title, tag_channel, channel_code, channel_id)) {
                return;
            }
        });
    }
    /*!
     *  @brief  動画(Youtubeホーム)のマーカーをクリアする
     *  @note   ContextMenu用
     */
    clear_home_video_marker() {
        const dismissable_tag
            = this.dismissible_tag + ".style-scope.ytd-rich-grid-media";
        $(dismissable_tag).each((inx, elem)=> {
            this.remove_filtered_marker(elem);
        });
        const dismissable_tag_short
        = this.dismissible_tag + ".style-scope.ytd-rich-grid-slim-media";
        $(dismissable_tag_short).each((inx, elem)=> {        
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
        var elem = $("div#carousel-item.style-scope.ytd-carousel-item-renderer");
        if (elem != null) {
            $(elem).detach();
        }
    }
    /*!
     *  @brief  「ゲーム」のマーカーをクリアする
     *  @note   ContextMenu用
     */
    clear_gaming_video_marker() {
        const dismissible_tag_short
        = this.dismissible_tag + ".style-scope.ytd-reel-item-renderer";
        $(dismissible_tag_short).each((inx, elem)=> {        
            this.remove_filtered_marker(elem);
        });
    }


    /*!
     *  @brief  フィルタリング
     */
    filtering() {
        this.dismissible_tag = YoutubeUtil.get_div_dismissble();
        const loc = this.current_location;
        if (loc.in_youtube_search_page() || loc.in_youtube_trending()) {
            this.filtering_horizontal_videos();
            this.filtering_searched_video();
            this.filtering_searched_channel();
            this.filtering_searched_playlist();
            this.filtering_searched_radio();
        } else if (loc.in_youtube_channel_page() ||
                   loc.in_youtube_user_page() ||
                   loc.in_youtube_custom_channel_page()) {
            this.filtering_channel_video();
            this.filtering_channel_personal_video();
            this.filtering_channel_channel();
        } else if (loc.in_youtube_gaming()) {
            this.filtering_youtube_gaming();
            this.filtering_horizontal_videos();
            this.filtering_short_slim_videos(".style-scope.ytd-reel-item-renderer");
            this.filtering_channel_channel();
        } else if (loc.in_youtube_short_page()) {
            this.filtering_short_video();
        } else if (loc.in_youtube_movie_page()) {
            this.filtering_watch_video();
        } else if (loc.in_top_page() || loc.in_youtube_hashtag()) {
            this.filtering_home_video();
            this.filtering_short_slim_videos(".style-scope.ytd-rich-grid-slim-media");
        } else {
            return;
        }
        this.clearing_section_list_header();
        this.video_info_accessor.kick();
        this.author_info_accessor.kick();
        this.channel_info_accessor.kick();
    }

    /*!
     *  @brief  ポストフィルタ(チャンネルユーザ名)
     *  @param  username    チャンネルユーザ名
     *  @param  channel_id  チャンネルID
     *  @note   チャンネルユーザ名を基点とした各種フィルタ処理
     *  @note   チャンネルID受信処理から呼ばれる
     */
    post_filtering_by_username(username, channel_id) {
        const fl_func = this.filtering_video_by_username.bind(this);
        const chk_func = YoutubeUtil.is_userpage_url;
        this.filtering_searched_video_by_channel_id(username, channel_id, fl_func);
        this.filtering_searched_channel_by_channel_id(username, channel_id, chk_func);
        this.filtering_searched_playlist_by_channel_id(username, channel_id, fl_func);
        this.filtering_channel_video_by_channel_id(username, channel_id, fl_func);
        this.filtering_channel_personal_video_by_channel_id(username,
                                                            channel_id,
                                                            chk_func);
        this.filtering_home_video_by_channel_id(username, channel_id, fl_func);
        this.filtering_short_video_by_channel_code(username, channel_id, chk_func);
        this.clearing_section_list_header();
    }
    /*!
     *  @brief  ポストフィルタ(カスタムチャンネル名)
     *  @param  custom_name カスタムチャンネル名
     *  @param  channel_id  チャンネルID
     *  @note   カスタムチャンネル名を基点とした各種フィルタ処理
     *  @note   チャンネルID受信処理から呼ばれる
     */
    post_filtering_by_custom_name(custom_name, channel_id) {
        const fl_func = this.filtering_video_by_custom_name.bind(this);
        const chk_func = YoutubeUtil.is_custom_channel_url;
        this.filtering_searched_video_by_channel_id(custom_name, channel_id, fl_func);
        this.filtering_searched_channel_by_channel_id(custom_name, channel_id, chk_func);
        this.filtering_searched_playlist_by_channel_id(custom_name, channel_id, fl_func);
        this.filtering_channel_video_by_channel_id(custom_name, channel_id, fl_func);
        this.filtering_channel_personal_video_by_channel_id(custom_name,
                                                            channel_id,
                                                            chk_func);
        this.filtering_home_video_by_channel_id(custom_name, channel_id, fl_func);
        this.filtering_short_video_by_channel_code(custom_name, channel_id, chk_func);
        this.clearing_section_list_header();
    }

    post_filtering_by_video_id(video_id, channel_id) {
        this.filtering_recommend_video_by_channel_id(video_id, channel_id);
        this.filtering_short_slim_video_by_video_id(video_id);
        this.filtering_searched_radio_by_channel_id(video_id, channel_id)
    }

    /*!
     *  @brief  動画情報(json)取得完了通知後処理
     *  @param  obj 動画オブジェクト
     */
    post_proc_tell_get_video_json(obj) {
        if (obj.channel_id != null) {
            if (obj.custom_name != null) {
                this.post_filtering_by_custom_name(obj.custom_name, obj.channel_id);
            } else {
                this.post_filtering_by_video_id(obj.video_id, obj.channel_id);
            }
        } else if (obj.username) {
            // jsonからチャンネルIDを得られなかった場合はこっち
            const channel_id = this.author_info_accessor.get_channel_id(obj.username);
            if (channel_id != null) {
                this.video_info_accessor.set_channel_id(obj.video_id, channel_id);
                this.post_filtering_by_video_id(obj.video_id, obj.channel_id);
            } else {
                // usernameをキーにfeedを得る
                this.author_info_accessor.entry(obj.username);
                this.author_info_accessor.kick();
            }
        } else {
            // jsonからチャンネルIDもuserも得られなかった場合の最終手段
            const custom_name = obj.custom_name;
            const channel_id = this.channel_info_accessor.get_channel_id(custom_name);
            if (channel_id != null) {
                this.video_info_accessor.set_channel_id(obj.video_id, channel_id);
                this.post_filtering_by_video_id(obj.video_id, obj.channel_id);
            } else {
                this.channel_info_accessor.entry(obj.custom_name);
                this.channel_info_accessor.kick();
            }
        }
        this.clearing_section_list_header();
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
        for (const video_id of video_ids) {
            this.post_filtering_by_video_id(video_id, obj.channel_id);
        }
        this.post_filtering_by_username(obj.username, obj.channel_id);
        //
        const custom_name
            = this.video_info_accessor.get_custom_name_by_username(obj.username);
        if (custom_name != null) {
            this.post_filtering_by_custom_name(custom_name, obj.channel_id);
        }
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
        const video_ids
            = this.video_info_accessor
                  .tell_get_channel_id_by_custom_channel(obj.custom_name,
                                                         obj.channel_id);
        for (const video_id of video_ids) {
            this.post_filtering_by_video_id(video_id, obj.channel_id);
        }
        this.post_filtering_by_custom_name(obj.custom_name, obj.channel_id);
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
     *  @brief  検索結果(html)取得完了通知後処理
     *  @param  video_id    動画ID
     *  @param  author_url  チャンネルURL
     */
    post_proc_tell_search_video_html(video_id, author_url) {
        let obj = { video_id: video_id };
        const channel_code = YoutubeUtil.cut_channel_id(author_url);
        if (YoutubeUtil.is_channel_url(author_url)) {
            this.video_info_accessor.set_channel_id(video_id, channel_code);
            obj.channel_id = channel_code;
        } else if (YoutubeUtil.is_userpage_url(author_url)) {
            obj.username = channel_code;_            
        } else if (YoutubeUtil.is_custom_channel_url(author_url)) {
            obj.custom_name = channel_code;
        } else {
            return; // 何らかの不具合
        }
        this.post_proc_tell_get_video_json(obj);
    }
    /*!
     *  @brief  検索結果(html)取得完了通知
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
     *  @brief  高速化用マーカーをクリアする
     */
    clear_marker() {
        const loc = this.current_location;
        if (loc.in_youtube_search_page() || loc.in_youtube_trending()) {
            this.clear_searched_video_marker();
        } else if (loc.in_top_page() || loc.in_youtube_hashtag()) {
            this.clear_home_video_marker();
        } else if (loc.in_youtube_gaming()) {
            this.clear_gaming_video_marker();
        }
    }

    /*!
     *  @brief  DOM要素追加callback
     *  @note   DOM要素追加タイミングで行いたい処理群
     */
    callback_domelement_adition() {
        // 自動再生をオフにする
        if (this.storage.json.stop_autoplay) {
            YoutubeUtil.disable_autoplay();
        }
        // アノテーションをオフにする
        if (this.storage.json.disable_annotation) {
            YoutubeUtil.disable_annotation();
        }
    }

    get_observing_node(elem) {
        const tag = "ytd-page-manager#page-manager.style-scope.ytd-app";
        $(tag).each((inx, e)=> { elem.push(e); });
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
        this.dismissible_tag = null;
    }
}
