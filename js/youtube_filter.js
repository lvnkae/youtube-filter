/*!
 *  @brief  Youtubeフィルタ
 */
class YoutubeFilter extends FilterBase {

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
     *  @brief  renderer_nodeにchannel_idでフィルタをかける
     *  @param  renderer_node   コンテンツ(動画/チャンネル/playlist/radio)ノード(1つ分)
     *  @param  channel_id      チャンネルID
     *  @param  title           コンテンツ名
     *  @param  detach_func     削除関数
     *  @retval true    ミュート(ノード削除)された
     *  @note   ミュート対象外ならattrにchannel_id書き込み(ContextMenus用)
     */
    filtering_renderer_node_by_channel_id(renderer_node,
                                          channel_id,
                                          title,
                                          detach_func) {
        if (channel_id != null) {
            if (this.storage.channel_id_filter(channel_id, title)) {
                if (detach_func) {
                    detach_func(renderer_node);
                } else {
                    $(renderer_node).detach();
                }
                return true;
            } else {
                YoutubeUtil.set_renderer_node_channel_id(renderer_node, channel_id);
            }
        }
        return false;
    }

    /*!
     *  @brief  renderer_nodeにchannel_idでフィルタをかける
     *  @note   channel_idが取得できなければ必要な情報をネットワーク経由で得る
     *  @param  renderer_node   コンテンツ(動画/radio)ノード(1つ分)
     *  @param  video_id        動画ID
     *  @param  title           コンテンツ名
     *  @param  detach_func     削除関数
     */
    filtering_renderer_node_by_channel_id_or_entry_request(renderer_node,
                                                           video_id,
                                                           title,
                                                           detach_func) {
        const channel_id = this.video_info_accessor.get_channel_id(video_id);
        if (channel_id == null) {
            this.video_info_accessor.entry(video_id);
        } else {
            this.filtering_renderer_node_by_channel_id(renderer_node,
                                                       channel_id,
                                                       title,
                                                       detach_func);
        }
    }
    
    /*!
     *  @brief  renderer_nodeにchannel_infoでフィルタをかける
     *  @note   channel_infoが取得できなければ必要な情報をネットワーク経由で得る
     *  @param  renderer_node   コンテンツ(動画)ノード(1つ分)
     *  @param  video_id        動画ID
     *  @param  title           動画タイトル
     *  @retval true            指定動画(renderオブジェクト)がdetachされた
     *  @note   主にshort動画(チャンネル表記なし)用
     */
    filtering_renderer_node_by_channel_info_or_entry_request(renderer_node,
                                                             video_id,
                                                             title) {
        const channel_info = this.video_info_accessor.get_channel_info(video_id);
        if (channel_info == null) {
            this.video_info_accessor.entry(video_id);
            return false;
        }
        if (this.storage.channel_id_filter(channel_info.id, title) ||
            this.storage.channel_filter(channel_info.name, title)) {
            $(renderer_node).detach();
            return true;
        } else {
            // ContextMenu用に書き込んでおく
            YoutubeUtil.set_renderer_node_channel_id(renderer_node, channel_info.id);
            YoutubeUtil.set_channel_name(renderer_node, channel_info.name);
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
        YoutubeUtil.remove_renderer_node_channel_id(renderer_root);
        //
        const elem_title = $(elem).find(tag_title);
        const elem_channel = HTMLUtil.find_first_appearing_element(elem, tag_channel);
        if (elem_title.length != 1 || elem_channel == null) {
            return false;
        }
        const title
            = text_utility.remove_blank_line_and_head_space($(elem_title).text());
        const channel = $(elem_channel).text();
        if (this.storage.channel_and_title_filter(channel, title)) {
            $(renderer_root).detach();
            return true;
        }
        const author_url = $(elem_channel).attr("href");
        if (author_url == null) {
            return false;
        }
        const channel_id
            = this.get_channel_id_from_author_url_or_entry_request(author_url);
        return this.filtering_renderer_node_by_channel_id(renderer_root,
                                                          channel_id,
                                                          title);
    }

    /*!
     *  @brief  コンテンツフィルタ(チャンネルページ)
     *  @param  elem            コンテンツ(動画/playlist)ノード
     *  @param  tag_title       タイトルタグ
     *  @param  channel_info    チャンネルページ情報
     *  @retval true            要素削除
     *  @note   個人チャンネルページの「チャンネル名省略形式」にも対応
     */
    filtering_channel_content_core(elem, tag_title, channel_info) {
        const renderer_root = YoutubeUtil.search_renderer_root($(elem));
        if (renderer_root.length == 0) {
            return;
        }
        YoutubeUtil.remove_renderer_node_channel_id(renderer_root);
        //
        const elem_title = $(elem).find(tag_title);
        if (elem_title.length == 0) {
            return false;
        }
        const title
            = text_utility.remove_blank_line_and_head_space($(elem_title).text());
        const elem_channel = YoutubeUtil.get_channel_link_element(elem);
        const is_personal = (elem_channel == null);
        const channel = (is_personal) ?channel_info.name :$(elem_channel).text();
        if (this.storage.channel_and_title_filter(channel, title)) {
            $(renderer_root).detach();
            return true;
        }
        let channel_id = null;
        if (is_personal) {
            channel_id = channel_info.id;
            if (channel_id == null) {
                return true;
            }
        } else {
            const author_url = $(elem_channel).attr("href");
            if (author_url == null) {
                return false;
            }
            channel_id
                = this.get_channel_id_from_author_url_or_entry_request(author_url);
        }
        return this.filtering_renderer_node_by_channel_id(renderer_root,
                                                          channel_id,
                                                          title);
    }

    /*!
     *  @brief  動画フィルタ(チャンネルコード)
     *  @param  elem            親ノード
     *  @param  tag_title       動画タイトルタグ
     *  @param  tag_channel     動画チャンネルタグ
     *  @param  channel_code    ユーザ名/カスタムチャンネル名
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
        const title
            = text_utility.remove_blank_line_and_head_space($(elem_title).text());
        if (this.storage.channel_id_filter(channel_id, title)) {
            $(renderer_root).detach();
            return true;
        }
        YoutubeUtil.set_renderer_node_channel_id(renderer_root, channel_id);
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
        YoutubeUtil.remove_channel_name(renderer_root);
        YoutubeUtil.remove_renderer_node_channel_id(renderer_root);
        //
        const elem_title = $(elem).find(tag_title);
        if (elem_title.length != 1) {
            return true;
        }
        const title = $(elem_title).text();
        if (this.storage.title_filter(title)) {
            $(renderer_root).detach();
            return true;
        }
        return this.filtering_renderer_node_by_channel_info_or_entry_request(
                    renderer_root,
                    video_id,
                    title);
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
            const marker = YoutubeUtil.get_filtered_marker(elem);
            const hash = YoutubeUtil.get_video_hash(elem, tag_thumbnail);
            if (marker != null && hash == marker) {
                return;
            }
            YoutubeUtil.remove_filtered_marker(elem);
            //
            if (this.filtering_short_slim_video(elem, tag_title, hash)) {
                return;
            }
            //
            YoutubeUtil.set_filtered_marker(elem, hash);
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
            } else {
                const title = $(elem_title).text();
                this.filtering_renderer_node_by_channel_info_or_entry_request(
                    renderer_root,
                    video_id,
                    title);
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
     *  @brief  動画(ショート)にフィルタをかける
     */
    filtering_short_video() {
        const tag_short = ".reel-video-in-sequence.style-scope.ytd-shorts"
        $(tag_short).each((inx, elem)=> {
            const e_title = $(elem).find("h2.title");
            const e_channel = $(elem).find("div#channel-info");
            if (e_title.length <= 0 || e_channel.length <= 0) {
                return;
            }
            const title
                = text_utility.remove_blank_line_and_head_space($(e_title).text());
            const channel = YoutubeUtil.get_channel_name(e_channel);
            const detach_func = HTMLUtil.detach_children_all;
            if (this.storage.channel_and_title_filter(channel, title)) {
                detach_func(elem);
                return;
            }
            const author_url = $($(e_channel).find("a")[0]).attr("href");
            const channel_id
                = this.get_channel_id_from_author_url_or_entry_request(author_url);
            this.filtering_renderer_node_by_channel_id(elem,
                                                       channel_id,
                                                       title,
                                                       detach_func);
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
            const title
                = text_utility.remove_blank_line_and_head_space($(e_title).text());
            if (this.storage.channel_id_filter(channel_id, title)) {
                HTMLUtil.detach_children_all(elem);
                return;
            }
            YoutubeUtil.set_renderer_node_channel_id(elem, channel_id);
        });
    }

    /*!
     *  @brief  動画(Youtube検索)にフィルタをかける
     */
    filtering_searched_video() {
        $(".text-wrapper.style-scope.ytd-video-renderer").each((inx, elem)=> {
            const tag_title = YoutubeUtil.get_content_title_tag();
            const tag_channel = ".yt-simple-endpoint.style-scope.yt-formatted-string";
            //
            const marker = YoutubeUtil.get_filtered_marker(elem);
            // ytd-video-rendererノードは使い回されることがあり(フィルタ条件変更時など)
            // ただマークするだけだと動画が差し替えられた時にフィルタされない
            // → 動画ハッシュをマーカーとし、前回と一致した場合のみ弾く
            const hash = YoutubeUtil.get_video_hash(elem, tag_title);
            if (marker != null && hash == marker) {
                return;
            }
            YoutubeUtil.remove_filtered_marker(elem);
            //
            if (this.filtering_video(elem, tag_title, tag_channel)) {
                return;
            }
            //
            YoutubeUtil.set_filtered_marker(elem, hash);
        });
    }
    /*!
     *  @brief  動画(Youtube検索)にフィルタをかける
     *  @param  channel_code    ユーザ名/カスタムチャンネル名
     *  @param  channel_id      チャンネルID
     *  @param  fl_func         フィルタ関数
     *  @note   チャンネルコードを持つ動画のフィルタリング
     *  @note   チャンネルID受信処理から呼ばれる
     */
    filtering_searched_video_by_channel_id(channel_code, channel_id, fl_func) {
        $(".text-wrapper.style-scope.ytd-video-renderer").each((inx, elem)=> {
            const tag_title = YoutubeUtil.get_content_title_tag();
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
            YoutubeUtil.remove_filtered_marker(elem);
        });
    }

    /*!
     *  @brief  チャンネル(Youtube検索)にフィルタをかける
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
            const channel_id
                = this.get_channel_id_from_author_url_or_entry_request(author_url);
            this.filtering_renderer_node_by_channel_id(elem, channel_id);
        });
    }
    /*!
     *  @brief  チャンネル(Youtube検索)にフィルタをかける
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
            YoutubeUtil.set_renderer_node_channel_id(elem, channel_id);
        });
    }

    /*!
     *  @brief  プレイリスト(Youtube検索)フィルタ
     *  @param  elem        親ノード
     *  @retval true        要素削除
     */
    filtering_searched_playlist(elem) {
        const renderer_root = YoutubeUtil.search_renderer_root($(elem));
        if (renderer_root.length == 0) {
            return false;
        }
        const elem_title = $(elem).find("span#video-title");
        const elem_channel = YoutubeUtil.get_channel_name_element(elem);
        if (elem_title.length != 1 || elem_channel == null) {
            return false;
        }
        const title
            = text_utility.remove_blank_line_and_head_space($(elem_title).text());
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
        return this.filtering_renderer_node_by_channel_id(renderer_root,
                                                          channel_id,
                                                          title);
    }
    searched_playlists_filter_core(fl_func) {
        $("a.yt-simple-endpoint.style-scope.ytd-playlist-renderer").each((inx, elem)=> {
            return fl_func(elem);
        });
    }
    /*!
     *  @brief  プレイリスト(Youtube検索)にフィルタをかける
     */
    filtering_searched_playlists() {
        this.searched_playlists_filter_core((elem)=> {
            this.filtering_searched_playlist(elem);
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
        this.searched_playlists_filter_core((elem)=> {
            const tag_title = "span#video-title"
            const tag_channel = YoutubeUtil.get_channel_link_tag();
            return fl_func(elem, tag_title, tag_channel, channel_code, channel_id);
        });
    }

    /*!
     *  @brief  Mixリスト(Youtube検索)フィルタ
     */
    filtering_searched_radio(elem) {
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
        this.filtering_renderer_node_by_channel_id_or_entry_request(renderer_root,
                                                                    video_id);
    }
    filtering_searched_radios_core(fl_func) {
        $("a.yt-simple-endpoint.style-scope.ytd-radio-renderer").each((inx, elem)=> {
            fl_func(elem);
        });
    }
    /*!
     *  @brief  Mixリスト(Youtube検索)にフィルタをかける
     */
    filtering_searched_radios() {
        this.filtering_searched_radios_core((elem)=> {
            this.filtering_searched_radio(elem);
        });
    }
    /*!
     *  @brief  Mixリスト(Youtube検索)にフィルタをかける
     *  @note   動画更新情報(xml)またはカスタムチャンネル情報(html)↓
     *  @note   または動画情報(json)取得完了通知後処理から呼ばれる
     */
    filtering_searched_radio_by_channel_id(video_id, channel_id) {
        this.filtering_searched_radios_core((elem)=> {
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
                YoutubeUtil.set_renderer_node_channel_id(renderer_root, channel_id);
            }
        });
    }

    /*!
     *  @brief  水平スクロール動画群にフィルタをかける
     *  @note   探索/急上昇に差し込まれるやつ
     *  @note   short/通常両対応
     *  @note   xml(username),html(custom_name)取得コールバックは
     *  @note   searched_videoと一緒に処理される
     */
    filtering_horizontal_videos() {
        const tag_renderer = "div#meta.style-scope.ytd-grid-video-renderer";
        const tag_title = YoutubeUtil.get_content_title_tag();
        const tag_channel = YoutubeUtil.get_channel_link_tag();
        $(YoutubeUtil.get_section_list_header_tag()).each((inx, header)=> {
            $(header).find(tag_renderer).each((inx, elem)=> {
                this.filtering_video(elem, tag_title, tag_channel);
            });
        });
    }

    /*!
     *  @param  チャンネル所属コンテンツにチャンネルIDを書き込む
     *  @param  channel_id      チャンネルID
     *  @note   チャンネル名省略形式用
     *  @note   チャンネルID受信処理から呼ばれる
     */
    set_channel_contents_channel_id(channel_id) {
        const func_set_channel_id = (elem)=> {
            const renderer_root = YoutubeUtil.search_renderer_root($(elem));
            if (renderer_root.length == 0) {
                return;
            }
            const elem_channel = YoutubeUtil.get_channel_link_element(elem);
            const is_personal = (elem_channel == null);
            if (!is_personal) {
                return;
            }
            YoutubeUtil.set_renderer_node_channel_id(renderer_root, channel_id);
        };
        this.filtering_channel_videos_core((elem, tag_title, tag_channel)=> {
            func_set_channel_id(elem);
        });
        this.filtering_channel_playlists_core((elem)=> {
            func_set_channel_id(elem);
        });
    }

    /*!
     *  @brief  動画(チャンネルページ)にフィルタをかける
     *  @param  filtering_func  フィルタ関数
     */
    filtering_channel_videos_core(filtering_func) {
        const tag_title = YoutubeUtil.get_content_title_tag();
        const tag_channel = YoutubeUtil.get_channel_link_tag();
        // horizontal-list、ytd-grid-renderer両対応
        $("div#meta.style-scope.ytd-grid-video-renderer").each((inx, elem)=> {
            filtering_func(elem, tag_title, tag_channel);
        });
        // expanded-shelf-contents-renderer
        const tag_exp
            = "ytd-video-renderer.style-scope.ytd-expanded-shelf-contents-renderer";
        $(tag_exp).each((inx, elem)=> {
            filtering_func(elem, tag_title, tag_channel);
        });
    }
    filtering_channel_videos(channel_info) {
        this.filtering_channel_videos_core((elem, tag_title, tag_channel)=> {
            this.filtering_channel_content_core(elem, tag_title, channel_info);
        });
    }
    /*!
     *  @brief  動画(チャンネルページ)にフィルタをかける
     *  @param  channel_code    ユーザ名/カスタムチャンネル名
     *  @param  channel_id      チャンネルID
     *  @param  fl_func         フィルタ関数
     *  @note   動画更新情報(xml)またはカスタムチャンネル情報(html)↓
     *  @note   取得完了通知後処理から呼ばれる
     */
    filtering_channel_videos_by_channel_id(channel_code, channel_id, fl_func) {
        this.filtering_channel_videos_core((elem, tag_title, tag_channel)=> {
            return fl_func(elem, tag_title, tag_channel, channel_code, channel_id);
        });
    }

    /*!
     *  @brief  プレイリスト(チャンネルページ)にフィルタをかける
     *  @param  filtering_func  フィルタ関数
     */
    filtering_channel_playlists_core(filtering_func) {
        // horizontal-list、ytd-grid-renderer両対応
        $("ytd-grid-playlist-renderer").each((inx, elem)=> {
            filtering_func(elem, YoutubeUtil.get_content_title_tag());
        });
        // expanded-shelf-contents-renderer
        const tag_exp
            = "ytd-playlist-renderer.style-scope.ytd-expanded-shelf-contents-renderer";
        $(tag_exp).each((inx, elem)=> {
            filtering_func(elem, "span#video-title");
        });
    }
    filtering_channel_playlists(channel_info) {
        this.filtering_channel_playlists_core((elem, tag_title, tag_channel)=> {
            this.filtering_channel_content_core(elem, tag_title, channel_info);
        });
    }
    /*!
     *  @brief  プレイリスト(チャンネルページ)にフィルタをかける
     *  @param  channel_code    ユーザ名/カスタムチャンネル名
     *  @param  channel_id      チャンネルID
     *  @param  fl_func         フィルタ関数
     *  @note   動画更新情報(xml)またはカスタムチャンネル情報(html)↓
     *  @note   取得完了通知後処理から呼ばれる
     */
    filtering_channel_playlists_by_channel_id(channel_code, channel_id, fl_func) {
        const tag_title = YoutubeUtil.get_content_title_tag();
        const tag_channel = YoutubeUtil.get_channel_link_tag();
        this.filtering_channel_playlists_core((elem, na_tag_title, na_tag_channel)=> {
            return fl_func(elem, tag_title, tag_channel, channel_code, channel_id);
        });
    }

    /*!
     *  @brief  チャンネル(チャンネルページ)フィルタ
     *  @param  elem        基点ノード
     *  @param  tag_title   チャンネル名タグ
     *  @param  tag_link    チャンネルURLタグ
     */
    filtering_channel_channel(elem, tag_title, tag_link) {
        const renderer_root = YoutubeUtil.search_renderer_root($(elem));
        if (renderer_root.length == 0) {
            return;
        }
        const elem_chname = $(elem).find(tag_title);
        const elem_chlink = $(elem).find(tag_link);
        if (elem_chname.length == 0 || elem_chlink.length == 0) {
            return;
        }
        const channel = $(elem_chname).text();
        if (this.storage.channel_filter(channel)) {
            $(renderer_root).detach();
            return;
        }
        const author_url = $(elem_chlink).attr("href");
        const channel_id
            = this.get_channel_id_from_author_url_or_entry_request(author_url);
        this.filtering_renderer_node_by_channel_id(renderer_root, channel_id);                            
    }
    filtering_channel_channels_core(filtering_func) {
        //  大区分(ゲーム、スポーツ等)ページ用 - ○水平リスト
        const tag_title_= "span#title";
        const tag_link = "a#channel-info"
        $("div#channel.style-scope.ytd-grid-channel-renderer").each((inx, elem)=> {
            filtering_func(elem, tag_title_, tag_link);
        });
        //  垂直リスト
        const tag_title_vt = YoutubeUtil.get_channel_name_tag();
        const tag_link_vt = "a#main-link";
        $("ytd-channel-renderer").each((inx, elem)=> {
            filtering_func(elem, tag_title_vt, tag_link_vt);
        });
    }
    filtering_channel_channels() {
        this.filtering_channel_channels_core((elem, tag_title, tag_link)=> {
            this.filtering_channel_channel(elem, tag_title, tag_link);
        });
    }
    /*!
     *  @brief  チャンネル(チャンネルページ)にフィルタをかける
     *  @param  channel_code    ユーザ名/カスタムチャンネル名
     *  @param  channel_id      チャンネルID
     *  @param  chk_func        チャンネル判別関数
     *  @note   動画更新情報(xml)またはカスタムチャンネル情報(html)↓
     *  @note   取得完了通知後処理から呼ばれる
     */
    filtering_channel_channels_by_channel_id(channel_code, channel_id, chk_func) {
        const fl_func = ((elem, tag_title, tag_link)=>{
            const renderer_root = YoutubeUtil.search_renderer_root($(elem));
            if (renderer_root.length == 0) {
                return;
            }
            const elem_chlink = $(elem).find(tag_link);
            if (elem_chlink.length == 0) {
                return;
            }
            const author_url = $(elem_chlink).attr("href");
            if (!chk_func(author_url) ||
                channel_code != YoutubeUtil.cut_channel_id(author_url)) {
                return;
            }
            if (this.storage.channel_id_filter(channel_id)) {
                $(renderer_root).detach();
                return;
            }
            YoutubeUtil.set_renderer_node_channel_id(renderer_root, channel_id);
        });
        this.filtering_channel_channels_core((elem, tag_title, tag_link)=> {
            fl_func(elem, tag_title, tag_link);
        });
    }

    /*!
     *  @brief  チャンネルページにフィルタをかける
     */
    filtering_channel_page() {
        let channel_info = {};
        channel_info.name = YoutubeUtil.get_page_channel_name();
        if (channel_info.name == null) {
            return;
        }
        const author_url = YoutubeUtil.get_page_author_url();
        channel_info.id
            = this.get_channel_id_from_author_url_or_entry_request(author_url);
        //
        this.filtering_short_slim_videos(".style-scope.ytd-reel-item-renderer");
        this.filtering_channel_videos(channel_info);
        this.filtering_channel_playlists(channel_info);
        this.filtering_channel_channels();
        //
        const e_parent = $("div#items.style-scope.ytd-grid-renderer");
        if (e_parent.length > 0) {
            YoutubeUtil.remove_spiner_renderer(e_parent);
        }
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
        YoutubeUtil.remove_spiner_renderer(e_parent);
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
            YoutubeUtil.remove_renderer_node_channel_id(renderer_root);
            //
            const elem_title = $(elem).find("span#video-title");
            if (elem_title.length != 1) {
                return;
            }
            const title
                = text_utility.remove_blank_line_and_head_space($(elem_title).text());
            const channel = YoutubeUtil.get_channel_name(elem);
            if (this.storage.channel_and_title_filter(channel, title)) {
                $(renderer_root).detach();
                return;
            }
            const video_id = YoutubeUtil.get_video_hash_by_node($(elem));
            const detach_func = (renderer_root)=> {
                HTMLUtil.detach_lower_node(renderer_root, this.dismissible_tag);
            };
            this.filtering_renderer_node_by_channel_id_or_entry_request(renderer_root,
                                                                        video_id,
                                                                        title,
                                                                        detach_func);
        });
    }
    filtering_recommend_video() {
        this.call_recommended_video_filter((e_parent,
                                            tag_video_link,
                                            tag_playlist_link)=> {
            this.filtering_recommend_video_core(e_parent, tag_video_link);
            this.filtering_recommend_video_core(e_parent, tag_playlist_link);
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
            const title
                = text_utility.remove_blank_line_and_head_space($(elem_title).text());
            if (this.storage.channel_id_filter(channel_id, title)) {
                HTMLUtil.detach_lower_node(renderer_root, this.dismissible_tag)
            } else {
                YoutubeUtil.set_renderer_node_channel_id(renderer_root, channel_id);
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
                        YoutubeUtil.set_renderer_node_channel_id(a_tag, channel_id);
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
     *  @brief  動画(動画再生ページ)にフィルタをかける
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
                    = text_utility.remove_blank_line_and_head_space($(elem_user).text())
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
     *  @brief  動画(Youtubeホーム)にフィルタをかける
     */
    filtering_home_video() {
        const dismissable_tag
            = this.dismissible_tag + ".style-scope.ytd-rich-grid-media";
        $(dismissable_tag).each((inx, elem)=> {
            const tag_title = "#video-title";
            const tag_thumbnail = "a#thumbnail";
            const tag_channel = ".yt-simple-endpoint.style-scope.yt-formatted-string";
            //
            const marker = YoutubeUtil.get_filtered_marker(elem);
            const hash = YoutubeUtil.get_video_hash(elem, tag_thumbnail);
            if (marker != null && hash == marker) {
                return;
            }
            YoutubeUtil.remove_filtered_marker(elem);
            //
            if (this.filtering_video(elem, tag_title, tag_channel)) {
                return;
            }
            //
            YoutubeUtil.set_filtered_marker(elem, hash);
        });
        this.filtering_short_slim_videos(".style-scope.ytd-rich-grid-slim-media");
    }
    /*!
     *  @brief  動画(Youtubeホーム)にフィルタをかける
     *  @param  channel_code    ユーザ名/カスタムチャンネル名
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
            YoutubeUtil.remove_filtered_marker(elem);
        });
        const dismissable_tag_short
        = this.dismissible_tag + ".style-scope.ytd-rich-grid-slim-media";
        $(dismissable_tag_short).each((inx, elem)=> {        
            YoutubeUtil.remove_filtered_marker(elem);
        });
    }

    /*!
     *  @brief  short動画(チャンネル名なし)のマーカーをクリアする
     *  @note   ContextMenu用
     */
    clear_short_slim_videos_marker(tag) {
        const dismissible_tag_short = this.dismissible_tag + tag;
        $(dismissible_tag_short).each((inx, elem)=> {
            YoutubeUtil.remove_filtered_marker(elem);
        });
    }


    /*!
     *  @brief  フィルタリング
     */
    filtering() {
        YoutubeUtil.permit_clearing_section_list_header();
        //
        this.dismissible_tag = YoutubeUtil.get_div_dismissble();
        const loc = this.current_location;
        if (loc.in_youtube_search_page() || loc.in_youtube_trending()) {
            this.filtering_horizontal_videos();
            this.filtering_searched_video();
            this.filtering_searched_channel();
            this.filtering_searched_playlists();
            this.filtering_searched_radios();
        } else if (loc.in_youtube_sp_channel_page() ||
                   loc.in_youtube_channel_page() ||
                   loc.in_youtube_user_page() ||
                   loc.in_youtube_custom_channel_page()) {
            this.filtering_channel_page();
        } else if (loc.in_youtube_short_page()) {
            this.filtering_short_video();
        } else if (loc.in_youtube_movie_page()) {
            this.filtering_watch_video();
        } else if (loc.in_top_page() ||
                   loc.in_youtube_hashtag() ||
                   loc.in_youtube_sports())  {
            this.filtering_home_video();
        } else {
            return;
        }
        this.video_info_accessor.kick();
        this.author_info_accessor.kick();
        this.channel_info_accessor.kick();
        //
        YoutubeUtil.remove_carousel_banner();
        YoutubeUtil.clearing_section_list_header();
    }

    /*!
     *  @brief  ポストフィルタ(チャンネルコード)
     *  @param  channel_code    ユーザ名/カスタムチャンネル名
     *  @param  channel_id      チャンネルID
     *  @param  fl_func         フィルタリング関数
     *  @param  chk_func        urlチェック関数
     *  @note   チャンネルコードを基点とした各種フィルタ処理
     */
    post_filtering_by_channel_code(channel_code, channel_id, fl_func, chk_func) {
        const loc = this.current_location;
        if (loc.in_youtube_channel_page() ||
            loc.in_youtube_user_page() ||
            loc.in_youtube_custom_channel_page()) {
            if (channel_code == YoutubeUtil.cut_channel_id(loc.url)) {
                this.set_channel_contents_channel_id(channel_id);
            }
            this.filtering_channel_videos_by_channel_id(channel_code, channel_id, fl_func);
            this.filtering_channel_playlists_by_channel_id(channel_code, channel_id, fl_func);
            this.filtering_channel_channels_by_channel_id(channel_code, channel_id, chk_func);
        } else if (loc.in_youtube_short_page()) {
            this.filtering_short_video_by_channel_code(channel_code, channel_id, chk_func);
        } else {
            this.filtering_searched_video_by_channel_id(channel_code, channel_id, fl_func);
            this.filtering_searched_playlist_by_channel_id(channel_code, channel_id, fl_func);
            this.filtering_searched_channel_by_channel_id(channel_code, channel_id, chk_func);
            this.filtering_home_video_by_channel_id(channel_code, channel_id, fl_func);
        }
        YoutubeUtil.clearing_section_list_header();
    }
    /*!
     *  @brief  ポストフィルタ(チャンネルユーザ名)
     *  @note   チャンネルユーザ名を基点とした各種フィルタ処理
     *  @note   チャンネルID受信処理から呼ばれる
     */
    post_filtering_by_username(username, channel_id) {
        const fl_func = this.filtering_video_by_username.bind(this);
        const chk_func = YoutubeUtil.is_userpage_url;
        this.post_filtering_by_channel_code(username, channel_id, fl_func, chk_func);
    }
    /*!
     *  @brief  ポストフィルタ(カスタムチャンネル名)
     *  @note   カスタムチャンネル名を基点とした各種フィルタ処理
     *  @note   チャンネルID受信処理から呼ばれる
     */
    post_filtering_by_custom_name(custom_name, channel_id) {
        const fl_func = this.filtering_video_by_custom_name.bind(this);
        const chk_func = YoutubeUtil.is_custom_channel_url;
        this.post_filtering_by_channel_code(custom_name, channel_id, fl_func, chk_func);
    }
    /*!
     *  @brief  ポストフィルタ(動画ID)
     *  @note   動画IDを基点とした各種フィルタ処理
     *  @note   チャンネルID受信処理から呼ばれる
     */
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
        YoutubeUtil.clearing_section_list_header();
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
            this.video_info_accessor.set_custom_name(video_id, channel_code);
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
        } else if (loc.in_top_page() ||
                   loc.in_youtube_hashtag() ||
                   loc.in_youtube_sports()) {
            this.clear_home_video_marker();
            this.clear_short_slim_videos_marker(".style-scope.ytd-rich-grid-slim-media");
        } else if (loc.in_youtube_sp_channel_page() ||
                   loc.in_youtube_channel_page() ||
                   loc.in_youtube_user_page() ||
                   loc.in_youtube_custom_channel_page()) {
            this.clear_short_slim_videos_marker(".style-scope.ytd-reel-item-renderer");
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
