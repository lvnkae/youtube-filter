/*!
 *  @brief  Youtubeフィルタ
 */
class YoutubeFilter extends FilterBase {

    detach_lower_dismissible_node(base_node) {
        HTMLUtil.detach_lower_node(base_node, this.dismissible_tag);
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
        if (elem_title.length == 0) {
            return false;
        }
        const title
            = text_utility.remove_blank_line_and_head_space($(elem_title).text());
        if (this.storage.title_filter(title)) {
            $(renderer_root).detach();
            return true;
        }
        const elem_channel = HTMLUtil.find_first_appearing_element(elem, tag_channel);
        if (elem_channel == null) {
            return false;
        }
        const channel = $(elem_channel).text();
        if (this.storage.channel_filter(channel, title)) {
            $(renderer_root).detach();
            return true;
        }
        const author_url = $(elem_channel).attr("href");
        if (author_url == null) {
            return false;
        }
        if (this.storage.is_mute_shorts()) {
            const url = $(elem_title).attr("href");
            if (url != null && YoutubeUtil.is_shorts(url)) {
                $(renderer_root).detach();
                return true;
            }
        }
        const dc = this.data_counter;
        const channel_id
            = dc.get_channel_id_from_author_url_or_entry_request(author_url);
        if (channel_id != null && YoutubeUtil.is_channel_url(author_url)) {
            const url = $(elem_title).attr("href");
            if (url != null) {
                // endscreen用に登録
                // ※未だにchannel_idを直接使ってるチャンネル用
                // ※ハンドルに統一されたはずでは…？
                // ※動画再生ページ以外では無駄処理だがここが一番確実
                this.connect_channel_id_for_endscreen(url, channel_id);
            }
        }
        return YoutubeFilteringUtil.filtering_renderer_node_by_channel_id(renderer_root,
                                                                          channel_id,
                                                                          title,
                                                                          null,
                                                                          this.storage);
    }

    /*!
     *  @brief  動画フィルタリング手続き
     *  @param  elem        親ノード
     *  @param  tag_hash    動画ハッシュタグ
     *  @param  tag_title   動画タイトルタグ
     *  @param  tag_channel 動画チャンネルタグ
     *  @note   フィルタリング呼び出しとマーカー処理のセット
     */
    filtering_video_procedure(elem, tag_hash, tag_title, tag_channel) {
        const marker = YoutubeUtil.get_filtered_marker(elem);
        // ytd-video-rendererノードは使い回されることがあり(フィルタ条件変更時など)
        // ただマークするだけだと動画が差し替えられた時にフィルタされない
        // → 動画ハッシュをマーカーとし、前回と一致した場合のみ弾く
        const hash = YoutubeUtil.get_video_hash(elem, tag_hash);
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
    }

    /*!
     *  @brief  コンテンツフィルタ(チャンネルページ)
     *  @param  elem            コンテンツ(動画/playlist)ノード
     *  @param  tag_title       タイトルタグ
     *  @param  channel_func    チャンネルノード取得関数
     *  @param  channel_info    チャンネルページ情報
     *  @retval true            要素削除
     *  @note   個人チャンネルページの「チャンネル名省略形式」にも対応
     */
    filtering_channel_content(elem, tag_title, channel_func, channel_info) {
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
        const elem_channel = channel_func(elem);
        const is_personal = (elem_channel == null || elem_channel.length == 0);
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
            const dc = this.data_counter;
            channel_id
                = dc.get_channel_id_from_author_url_or_entry_request(author_url);
        }
        return YoutubeFilteringUtil.filtering_renderer_node_by_channel_id(renderer_root,
                                                                          channel_id,
                                                                          title,
                                                                          null,
                                                                          this.storage);
    }

    /*!
     *  @brief  動画フィルタ(チャンネルコード)
     *  @param  elem            親ノード
     *  @param  tag_title       動画タイトルタグ
     *  @param  tag_channel     動画チャンネルタグ
     *  @param  channel_code    ユーザ名/カスタムチャンネル名/ハンドル
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
     *  @brief  動画フィルタ(カスタムチャンネル名/ハンドル)
     *  @param  elem        親ノード
     *  @param  tag_title   動画タイトルタグ
     *  @param  tag_channel 動画チャンネルタグ
     *  @param  unique_name 独自チャンネル名
     *  @param  channel_id  チャンネルID
     *  @retval true        処理打ち切りまたは要素削除
     */
    filtering_video_by_unique_name(elem, tag_title, tag_channel,
                                   unique_name, channel_id) {
        return this.filtering_video_by_channel_code(elem,
            tag_title,
            tag_channel,
            unique_name,
            channel_id,
            YoutubeUtil.is_uniquepage_url);
    }

    /*!
     *  @brief  プレイ/MIXリストにフィルタをかける
     *  @note   24年11月以降の構成に対応
     */
    static FL_TYPE_RECOMMEND = 0;   // おすすめ
    static FL_TYPE_NORMAL = 1;      // home、検索結果
    filtering_list(elem, detach_func, FL_TYPE) {
        const renderer_root = YoutubeUtil.search_renderer_root($(elem));
        if (renderer_root.length == 0) {
            return false;
        }
        YoutubeUtil.remove_renderer_node_channel_id(renderer_root);
        //
        const elem_title = $(elem).find(YoutubeUtil.get_lockup_vm_title_tag());
        const elem_channel = YoutubeUtil.get_list_channel_element(elem);
        if (elem_title.length != 1 || elem_channel == null) {
            return false;
        }
        const title
            = text_utility.remove_blank_line_and_head_space($(elem_title).text());
        if (elem_channel.length == 0) {
            // MIXリスト
            if (this.storage.title_filter(title)) {
                detach_func(renderer_root);
                return true;
            } else {
                return false;
            }
        }
        const channel = $(elem_channel).text();
        if (this.storage.channel_and_title_filter(channel, title)) {
            detach_func(renderer_root);
            return true;
        }
        //
        const author_url = $(elem_channel).attr("href");
        switch (FL_TYPE) {
        case YoutubeFilter.FL_TYPE_RECOMMEND:
            // endscreen用の空登録(あとからchannel_idを差し込む)
            const link = $(elem_title).attr("href");
            if (YoutubeUtil.is_list_link(link)) {
                const list_id = YoutubeUtil.get_playlist_hash(link);
                this.playlist_searcher.set_list_id(list_id);
                this.playlist_searcher.set_channel_code(list_id, author_url);
            } else {
                // recommendがすべてlockup-view-modelになった場合の対処
                // 24/11/30時点では特定の環境にしか来てないので暫定処置
                const video_id = YoutubeUtil.get_video_hash_by_link(link);
                this.video_info_accessor.set_video_id(video_id);
                this.video_info_accessor.set_channel_code(video_id, author_url);
            }
            // no break
        case YoutubeFilter.FL_TYPE_NORMAL:
            const dc = this.data_counter;
            const channel_id
                = dc.get_channel_id_from_author_url_or_entry_request(author_url);
            return YoutubeFilteringUtil.filtering_renderer_node_by_channel_id(
                    renderer_root,
                    channel_id,
                    title,
                    detach_func,
                    this.storage); 
        default:
            return false;
        };
    }
    filtering_lists(p_parent) {
        YoutubeFilteringUtil.each_lockup_view_model((elem)=>{
            const detach_func = (renderer_root)=>{ $(renderer_root).detach(); }
            this.filtering_list(elem, detach_func, YoutubeFilter.FL_TYPE_NORMAL);
        }, p_parent);
    }
    filtering_channel_lists(p_parent, channel_info) {
        const tag_title = YoutubeUtil.get_lockup_vm_title_tag();
        const channel_func = YoutubeUtil.get_list_channel_element;
        YoutubeFilteringUtil.each_lockup_view_model((elem)=>{
            this.filtering_channel_content(elem, tag_title, channel_func, channel_info);
        }, p_parent);
    }
    filtering_list_by_channel_id(elem, channel_code, channel_id, detach_func) {
        const renderer_root = YoutubeUtil.search_renderer_root($(elem));
        if (renderer_root.length == 0) {
            return true;
        }
        const elem_channel = YoutubeUtil.get_list_channel_element(elem);
        if (elem_channel == null || elem_channel.length == 0) {
            return true;
        }
        const author_url = $(elem_channel).attr("href");
        if (YoutubeUtil.cut_channel_id(author_url) != channel_code) {
            return true;
        }
        const elem_title = $(elem).find(YoutubeUtil.get_lockup_vm_title_tag());
        if (elem_title.length == 0) {
            return true;
        }
        const title
            = text_utility.remove_blank_line_and_head_space($(elem_title).text());
        return YoutubeFilteringUtil.filtering_renderer_node_by_channel_id(renderer_root,
                                                                          channel_id,
                                                                          title,
                                                                          detach_func,
                                                                          this.storage);        
    }
    filtering_lists_by_channel_id(e_parent, channel_code, channel_id) {
        const detach_func = (renderer_root)=>{ $(renderer_root).detach(); }
        YoutubeFilteringUtil.each_lockup_view_model((elem)=> {
            this.filtering_list_by_channel_id(elem,
                                              channel_code,
                                              channel_id,
                                              detach_func);
            return true;
        }, e_parent);
    }

    /*!
     *  @brief  動画(検索)にフィルタをかける
     */
    filtering_searched_video() {
        $(".text-wrapper.style-scope.ytd-video-renderer").each((inx, elem)=> {
            const tag_title = YoutubeUtil.get_content_title_tag();
            const tag_channel = ".yt-simple-endpoint.style-scope.yt-formatted-string";
            this.filtering_video_procedure(elem, tag_title, tag_title, tag_channel);
        });
    }
    /*!
     *  @brief  動画(検索)にフィルタをかける
     *  @param  channel_code    ユーザ名/カスタムチャンネル名/ハンドル
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
     *  @brief  動画(検索)のマーカーをクリアする
     *  @note   ContextMenu用
     */
    clear_searched_video_marker() {
        $(".text-wrapper.style-scope.ytd-video-renderer").each((inx, elem)=> {
            YoutubeUtil.remove_filtered_marker(elem);
        });
    }

    /*!
     *  @brief  チャンネル(検索)にフィルタをかける
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
            const dc = this.data_counter;
            const channel_id
                = dc.get_channel_id_from_author_url_or_entry_request(author_url);
            YoutubeFilteringUtil.filtering_renderer_node_by_channel_id(elem,
                                                                       channel_id,
                                                                       null, null,
                                                                       this.storage);
        });
    }
    /*!
     *  @brief  チャンネル(検索)にフィルタをかける
     *  @param  channel_code    ユーザ名/カスタムチャンネル名/ハンドル
     *  @param  channel_id      チャンネルID
     *  @param  chk_func        チャンネル判別関数
     *  @note   動画更新情報(xml)またはチャンネル情報(html)↓
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
     *  @brief  プレイリスト/MIXリスト(検索)にフィルタをかける
     *  @note   24年11月以降の構成に対応
     */
    filtering_searched_lists() {
        YoutubeFilteringUtil.each_item_section_renderer((section)=>{
            this.filtering_lists(section);
        });
    }

    /*!
     *  @brief  プレイリスト(検索)フィルタ
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
        const dc = this.data_counter;
        const channel_id
            = dc.get_channel_id_from_author_url_or_entry_request(author_url);
        return YoutubeFilteringUtil.filtering_renderer_node_by_channel_id(renderer_root,
                                                                          channel_id,
                                                                          title,
                                                                          null,
                                                                          this.storage);
    }
    /*!
     *  @brief  プレイリスト(検索)にフィルタをかける
     */
    filtering_searched_playlists() {
        YoutubeFilteringUtil.each_searched_playlists((elem)=> {
            this.filtering_searched_playlist(elem);
            return true;
        });
    }
    /*!
     *  @param  channel_code    ユーザ名/カスタムチャンネル名/ハンドル
     *  @param  channel_id      チャンネルID
     *  @param  fl_func         フィルタ関数
     *  @note   動画更新情報(xml)またはチャンネル情報(html)↓
     *  @note   取得完了通知後処理から呼ばれる
     */
    filtering_searched_playlist_by_channel_id(channel_code, channel_id, fl_func) {
        YoutubeFilteringUtil.each_searched_playlists((elem)=> {
            const tag_title = "span#video-title"
            const tag_channel = YoutubeUtil.get_channel_link_tag();
            return fl_func(elem, tag_title, tag_channel, channel_code, channel_id);
        });
        // 24年11月以降の構成に対応
        YoutubeFilteringUtil.each_item_section_renderer((section)=>{
            this.filtering_lists_by_channel_id(section, channel_code, channel_id);
        });
    }

    /*!
     *  @brief  Mixリスト(検索)にフィルタをかける
     *  @note   自動生成で作成チャンネルが存在しないのでタイトルのみ
     *  @note   (混在があり得るので先頭動画での判別も×)
     */
    filtering_searched_radios() {
        $("a.yt-simple-endpoint.style-scope.ytd-radio-renderer").each((inx, elem)=> {
            const renderer_root = YoutubeUtil.search_renderer_root($(elem));
            if (renderer_root.length == 0) {
                return;
            }
            const elem_title = $(elem).find("span#video-title");
            if (elem_title.length <= 0) {
                return;
            }
            const title
                = text_utility.remove_blank_line_and_head_space($(elem_title).text());
            if (this.storage.title_filter(title)) {
                $(renderer_root).detach();
                return;
            }
        });
    }

    /*!
     *  @brief  水平スクロール動画群にdo_funcを実行
     */
    each_horizontal_videos(do_func) {
        const tag_title = YoutubeUtil.get_content_title_tag();
        const tag_channel = YoutubeUtil.get_channel_link_tag();
        const tag_renderer = "div#meta.style-scope.ytd-grid-video-renderer";
        $(YoutubeUtil.get_section_list_header_tag()).each((inx, header)=> {
            $(header).find(tag_renderer).each((inx, elem)=> {
                do_func(elem, tag_title, tag_channel);
            });
        });
    }
    /*!
     *  @brief  水平スクロール動画群にフィルタをかける
     *  @note   探索/急上昇に差し込まれるやつ
     *  @note   short/通常両対応
     */
    filtering_horizontal_videos() {
        this.each_horizontal_videos((elem, tag_title, tag_channel)=> {
            this.filtering_video_procedure(elem, tag_title, tag_title, tag_channel);
        });
    }
    /*!
     *  @brief  水平スクロール動画群にフィルタをかける
     *  @param  channel_code    ユーザ名/カスタムチャンネル名/ハンドル
     *  @param  channel_id      チャンネルID
     *  @param  fl_func         フィルタ関数
     *  @note   チャンネルコードを持つ動画のフィルタリング
     *  @note   チャンネルID受信処理から呼ばれる
     */
    filtering_horizontal_videos_by_channel_id(channel_code, channel_id, fl_func) {
        this.each_horizontal_videos((elem, tag_title, tag_channel)=> {
            fl_func(elem, tag_title, tag_channel, channel_code, channel_id);
        });
    }    
    /*!
     *  @brief  水平スクロール動画群のマーカーをクリアする
     *  @note   ContextMenu用
     */
    clear_horizontal_video_marker() {
        this.each_horizontal_videos((elem)=> {
            YoutubeUtil.remove_filtered_marker(elem);
        });
    }

    /*!
     *  @brief  ytd-rich-grid-mediaに対するeach
     */
    each_rich_grid_media(do_func) {
        const dismissible_tag
            = this.dismissible_tag + ".style-scope.ytd-rich-grid-media";
        const tag_title = "#video-title-link";
        $(dismissible_tag).each((inx, elem)=> {
            do_func(elem, tag_title);
        });
    }
    /*!
     *  @brief  ytd-rich-grid-mediaに対するフィルタリング
     *  @note   home等で使う
     */
    filtering_rich_grid_media(filter_func) {
        this.each_rich_grid_media((elem, tag_title)=> {
            const tag_thumbnail = "a#thumbnail";
            const tag_channel = ".yt-simple-endpoint.style-scope.yt-formatted-string";
            filter_func(elem, tag_title, tag_thumbnail, tag_channel);
        });
    }

    /*!
     *  @param  チャンネル所属コンテンツにフィルタをかける
     *  @param  channel_id      チャンネルID
     *  @note   チャンネル名省略形式用
     *  @note   チャンネルID受信処理から呼ばれる
     */
    filtering_channel_private_contents_by_channel_id(channel_id) {
        const fl_func = (elem, tag_title, channel_func)=> {
            const renderer_root = YoutubeUtil.search_renderer_root($(elem));
            if (renderer_root.length == 0) {
                return;
            }
            const elem_channel = channel_func(elem);
            const is_personal = (elem_channel == null || elem_channel.length == 0);
            if (!is_personal) {
                return;
            }
            const elem_title = $(elem).find(tag_title);
            const ret = YoutubeFilteringUtil.filtering_renderer_node_by_channel_id(
                        renderer_root,
                        channel_id,
                        $(elem_title).text(),
                        null,
                        this.storage);
        };
        const channel_func = YoutubeUtil.get_channel_link_element;
        this.each_channel_videos((elem, tag_title)=> {
            fl_func(elem, tag_title, channel_func);
        });
        this.each_channel_playlists((elem, tag_title)=> {
            fl_func(elem, tag_title, channel_func);
        });
        this.each_rich_grid_media((elem, tag_title)=> {
            fl_func(elem, tag_title, channel_func);
        });
        // 24年11月以降の構成に対応
        const lvm_tag_title = YoutubeUtil.get_lockup_vm_title_tag();
        const lvm_channel_func = YoutubeUtil.get_list_channel_element;
        YoutubeFilteringUtil.each_grid_renderer((grid)=>{
            YoutubeFilteringUtil.each_lockup_view_model((elem)=> {
                fl_func(elem, lvm_tag_title, lvm_channel_func);
            }, grid);
        });
        YoutubeFilteringUtil.each_horizontal_list_renderer((horizontal)=>{
            YoutubeFilteringUtil.each_lockup_view_model((elem)=> {
                fl_func(elem, lvm_tag_title, lvm_channel_func);
            }, horizontal);
        });        

    }

    /*!
     *  @brief  動画(チャンネルページ)にdo_funcを実行
     */
    each_channel_videos(do_func) {
        const tag_title = YoutubeUtil.get_content_title_tag();
        const tag_channel = YoutubeUtil.get_channel_link_tag();
        // horizontal-list、ytd-grid-renderer両対応
        $("div#meta.style-scope.ytd-grid-video-renderer").each((inx, elem)=> {
            do_func(elem, tag_title, tag_channel);
        });
        // expanded-shelf-contents-renderer
        const tag_exp
            = "ytd-video-renderer.style-scope.ytd-expanded-shelf-contents-renderer";
        $(tag_exp).each((inx, elem)=> {
            do_func(elem, tag_title, tag_channel);
        });
    }
    /*!
     *  @brief  動画(チャンネルページ)にフィルタをかける
     *  @param  channel_info    当該ページチャンネル情報
     */
    filtering_channel_videos(channel_info) {
        this.each_channel_videos((elem, tag_title)=> {
            const channel_func = YoutubeUtil.get_channel_link_element;
            this.filtering_channel_content(elem, tag_title, channel_func, channel_info);
        });
    }
    /*!
     *  @brief  動画(チャンネルページ)にフィルタをかける
     *  @param  channel_code    ユーザ名/カスタムチャンネル名/ハンドル
     *  @param  channel_id      チャンネルID
     *  @param  fl_func         フィルタ関数
     *  @note   動画更新情報(xml)またはチャンネル情報(html)↓
     *  @note   取得完了通知後処理から呼ばれる
     */
    filtering_channel_videos_by_channel_id(channel_code, channel_id, fl_func) {
        this.each_channel_videos((elem, tag_title, tag_channel)=> {
            return fl_func(elem, tag_title, tag_channel, channel_code, channel_id);
        });
    }

    /*!
     *  @brief  プレイリスト(チャンネルページ)にdo_funcを実行
     */
    each_channel_playlists(do_func) {
        // horizontal-list、ytd-grid-renderer両対応
        $("ytd-grid-playlist-renderer").each((inx, elem)=> {
            do_func(elem, YoutubeUtil.get_content_title_tag());
        });
        //
        $("ytd-grid-show-renderer").each((inx, elem)=> {
            do_func(elem, "span#video-title");
        });
        // expanded-shelf-contents-renderer
        const tag_exp
            = "ytd-playlist-renderer.style-scope.ytd-expanded-shelf-contents-renderer";
        $(tag_exp).each((inx, elem)=> {
            do_func(elem, "span#video-title");
        });
    }
    /*!
     *  @brief  プレイリスト(チャンネルページ)にフィルタをかける
     *  @param  channel_info    当該ページチャンネル情報
     */
    filtering_channel_playlists(channel_info) {
        this.each_channel_playlists((elem, tag_title)=> {
            const channel_func = YoutubeUtil.get_channel_link_element;
            this.filtering_channel_content(elem, tag_title, channel_func, channel_info);
        });
    }
    /*!
     *  @brief  プレイリスト(チャンネルページ)にフィルタをかける
     *  @param  channel_code    ユーザ名/カスタムチャンネル名/ハンドル
     *  @param  channel_id      チャンネルID
     *  @param  fl_func         フィルタ関数
     *  @note   動画更新情報(xml)またはチャンネル情報(html)↓
     *  @note   取得完了通知後処理から呼ばれる
     */
    filtering_channel_playlists_by_channel_id(channel_code, channel_id, fl_func) {
        const tag_channel = YoutubeUtil.get_channel_link_tag();
        this.each_channel_playlists((elem, tag_title)=> {
            return fl_func(elem, tag_title, tag_channel, channel_code, channel_id);
        });
        // 24年11月以降の構成に対応
        YoutubeFilteringUtil.each_grid_renderer((grid)=>{
            this.filtering_lists_by_channel_id(grid, channel_code, channel_id);
        });
        YoutubeFilteringUtil.each_horizontal_list_renderer((horizontal)=>{
            this.filtering_lists_by_channel_id(horizontal, channel_code, channel_id);
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
        const dc = this.data_counter;
        const channel_id
            = dc.get_channel_id_from_author_url_or_entry_request(author_url);
        YoutubeFilteringUtil.filtering_renderer_node_by_channel_id(renderer_root,
                                                                   channel_id,
                                                                   null, null,
                                                                   this.storage);
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
     *  @param  channel_code    ユーザ名/カスタムチャンネル名/ハンドル
     *  @param  channel_id      チャンネルID
     *  @param  chk_func        チャンネル判別関数
     *  @note   動画更新情報(xml)またはチャンネル情報(html)↓
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
        const dc = this.data_counter;
        channel_info.id
            = dc.get_channel_id_from_author_url_or_entry_request(author_url);
        //
        const TAG_GRID_SLIM_MEDIA = YoutubeShortsFilter.TAG_GRID_SLIM_MEDIA();
        this.shorts_filter.filtering_slim_videos(TAG_GRID_SLIM_MEDIA);
        const TAG_REEL_RENDERER = YoutubeShortsFilter.TAG_REEL_RENDERER();
        this.shorts_filter.filtering_slim_videos(TAG_REEL_RENDERER);
        const t_grid = YoutubeUtil.get_rich_grid_header_tag();
        this.shorts_filter.filtering_slim_videos2(t_grid);
        const t_reel = YoutubeUtil.get_reel_shelf_header_tag();
        this.shorts_filter.filtering_slim_videos2(t_reel);    
        //
        this.filtering_channel_videos(channel_info);
        this.filtering_rich_grid_media((elem, tag_title)=> {
            this.filtering_channel_content(elem, tag_title,
                                           YoutubeUtil.get_channel_link_element,
                                           channel_info);
        });
        this.filtering_channel_playlists(channel_info);
        // 24年11月以降の構成に対応
        YoutubeFilteringUtil.each_grid_renderer((grid)=>{
            this.filtering_channel_lists(grid, channel_info);
        });
        YoutubeFilteringUtil.each_horizontal_list_renderer((horizontal)=>{
            this.filtering_channel_lists(horizontal, channel_info);
        });
        //
        this.filtering_channel_channels();
        //
        const e_parent = $("div#items.style-scope.ytd-grid-renderer");
        if (e_parent.length > 0) {
            YoutubeUtil.remove_spiner_renderer(e_parent);
        }
    }

    filtering_comments() {
        this.comment_filter.filtering();
    }

    call_recommended_contents_filter(fl_func) {
        const e_parent = $("div#related.style-scope.ytd-watch-flexy");
        if (e_parent.length > 0) {
            fl_func(e_parent);
        }
        YoutubeUtil.remove_spiner_renderer(e_parent);
    }
    /*!
     *  @brief  おすすめ動画フィルタ
     *  @param  elem    動画ノード
     */
    filtering_recommend_video(elem) {
        const detach_func = this.detach_lower_dismissible_node.bind(this);
        const renderer_root = YoutubeUtil.search_renderer_root($(elem));
        if (renderer_root.length == 0) {
            return;
        }
        YoutubeUtil.remove_renderer_node_channel_id(renderer_root);
        //
        const elem_title = $(elem).find("span#video-title");
        if (elem_title.length == 0) {
            return;
        }
        const title
            = text_utility.remove_blank_line_and_head_space($(elem_title).text());
        const channel = YoutubeUtil.get_channel_name(elem);
        if (this.storage.channel_and_title_filter(channel, title)) {
            detach_func(renderer_root);
            return;
        }
        const url = $(elem).attr("href");
        if (this.storage.is_mute_shorts() && YoutubeUtil.is_shorts(url)) {
            detach_func(renderer_root);
            return;
        }
        const video_id = YoutubeUtil.get_video_hash_by_link(url);
        const channel_id = this.video_info_accessor.get_channel_id(video_id);
        if (channel_id == null) {
            this.video_info_accessor.entry(video_id);
        } else {
            YoutubeFilteringUtil.filtering_renderer_node_by_channel_id(renderer_root,
                                                                       channel_id,
                                                                       title,
                                                                       detach_func,
                                                                       this.storage);
        }
    }
    /*!
     *  @brief  おすすめプレイリストフィルタ
     *  @param  elem    プレイリストノード
     */
    filtering_recommend_playlist(elem) {
        const detach_func = this.detach_lower_dismissible_node.bind(this);
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
            detach_func(renderer_root);
            return;
        }
        const list_id = YoutubeUtil.get_playlist_hash_by_node($(elem));
        const channel_id = this.playlist_searcher.get_channel_id(list_id);
        if (channel_id == null) {
            this.playlist_searcher.entry(list_id);
        } else {
            YoutubeFilteringUtil.filtering_renderer_node_by_channel_id(renderer_root,
                                                                       channel_id,
                                                                       title,
                                                                       detach_func,
                                                                       this.storage);
        }
    }
    /*!
     *  @brief  おすすめMixリストフィルタ
     *  @param  e_parent    親ノード
     */
    filtering_recommend_radios(e_parent) {
        const tag_link
            = "a.yt-simple-endpoint.style-scope.ytd-compact-radio-renderer";
        $(e_parent).find(tag_link).each((inx, elem)=> {
            const renderer_root = YoutubeUtil.search_renderer_root($(elem));
            if (renderer_root.length == 0) {
                return;
            }
            const elem_title = $(elem).find("span#video-title");
            if (elem_title.length == 0) {
                return;
            }
            const title
                = text_utility.remove_blank_line_and_head_space($(elem_title).text());
            if (this.storage.title_filter(title)) {
                this.detach_lower_dismissible_node(renderer_root);
                return;
            }
        });
    }

    filtering_recommend_contents() {
        this.call_recommended_contents_filter((e_parent)=> {
            YoutubeFilteringUtil.each_recommend_videos(e_parent, (elem)=>{
                this.filtering_recommend_video(elem);
            });
            YoutubeFilteringUtil.each_recommend_playlists(e_parent, (elem)=>{
                this.filtering_recommend_playlist(elem);
            });
            this.filtering_recommend_radios(e_parent)
            // 24年11月以降の構成に対応
            YoutubeFilteringUtil.each_lockup_view_model((elem)=>{
                const detach_func = YoutubeFilteringUtil.detach_lower_lockup_vm_node;
                this.filtering_list(elem, detach_func, YoutubeFilter.FL_TYPE_RECOMMEND);
            }, e_parent);
        });
    }
    /*!
     *  @brief  おすすめ(動画/プレイリスト)フィルタ
     *  @param  elem        動画ノード
     *  @param  content_id  ID(動画ID/プレイリストID)
     *  @param  channel_id  チャンネルID
     *  @param  get_func    ID取得関数
     *  @note   channel_id取得コールバック
     */
    filtering_recommend_content_by_channel_id(elem, content_id, channel_id, get_func) {
        if (content_id != get_func($(elem))) {
            return;
        }
        const renderer_root = YoutubeUtil.search_renderer_root($(elem));
        if (renderer_root.length == 0) {
            return;
        }
        const title_tag = "span#video-title";
        const elem_title = $(elem).find(title_tag);
        if (elem_title.length == 0) {
            return;
        }
        const title
            = text_utility.remove_blank_line_and_head_space($(elem_title).text());
        if (this.storage.channel_id_filter(channel_id, title)) {
            this.detach_lower_dismissible_node(renderer_root);
        } else {
            YoutubeUtil.set_renderer_node_channel_id(renderer_root, channel_id);
        }
    }
    filtering_recommend_videos_by_channel_id(video_id, channel_id) {
        const get_func = YoutubeUtil.get_video_hash_by_node;
        this.call_recommended_contents_filter((e_parent)=> {
            YoutubeFilteringUtil.each_recommend_videos(e_parent, (elem)=>{
                this.filtering_recommend_content_by_channel_id(elem,
                                                               video_id,
                                                               channel_id,
                                                               get_func);
            });
        });
    }
    filtering_recommend_playlists_by_channel_id(list_id, channel_id) {
        const get_func = YoutubeUtil.get_playlist_hash_by_node;
        this.call_recommended_contents_filter((e_parent)=> {
            YoutubeFilteringUtil.each_recommend_playlists(e_parent, (elem)=>{
                this.filtering_recommend_content_by_channel_id(elem,
                                                               list_id,
                                                               channel_id,
                                                               get_func);
            });
        });
    }
    /*!
     *  @note   rootからdetachするとloadingマークが残る
     *  @note   dismissibleからdetachすると動画→動画で再利用失敗する
     *  @note   →watchから抜ける際に全消しして再利用回避
     */
    detach_recommended_contents_all() {
        this.call_recommended_contents_filter((e_parent)=> {
            $(e_parent).find("ytd-compact-video-renderer").each((inx, elem)=> {
                $(elem).detach();
            });
            $(e_parent).find("ytd-compact-playlist-renderer").each((inx, elem)=> {
                $(elem).detach();
            });
            $(e_parent).find("ytd-compact-radio-renderer").each((inx, elem)=> {
                $(elem).detach();
            });
            // 24年11月以降の構成に対応
            YoutubeFilteringUtil.each_lockup_view_model((elem)=>{
                $(elem).detach();
            }, e_parent);

        });
    }

    /*!
     *  @brief  channel_idをvideo_id/list_idと紐付ける
     *  @note   endscreen用
     */
    connect_channel_id_for_endscreen(url, channel_id) {
        if (YoutubeUtil.is_list_link(url)) {
            const list_id = YoutubeUtil.get_playlist_hash(url);
            if (list_id != "") {
                this.playlist_searcher.entry(list_id);
                this.playlist_searcher.set_channel_id(list_id, channel_id);
            }
        } else {
            const video_id = YoutubeUtil.get_video_hash_by_link(url);
            if (video_id != "") {
                this.video_info_accessor.entry(video_id);
                this.video_info_accessor.set_channel_id(video_id, channel_id);
            }
        }
    }
    /*!
     *  @brief  おすすめ(動画/プレイリスト)フィルタ
     *  @note   channel_id取得コールバック/24年2月新UI対策
     */
    filtering_grid_recommend_videos_by_channel_id(channel_code, channel_id) {
        this.filtering_rich_grid_media((elem, tag_title, tag_thumbnail, tag_channel)=> {
            const renderer_root = YoutubeUtil.search_renderer_root($(elem));
            if (renderer_root.length == 0) {
                return;
            }
            const elem_channel = HTMLUtil.find_first_appearing_element(elem, tag_channel);
            if (elem_channel == null) {
                return;
            }
            const author_url = $(elem_channel).attr("href");
            if (author_url == null ||
                YoutubeUtil.cut_channel_id(author_url) != channel_code) {
                return;
            }
            const elem_title = $(elem).find(tag_title);
            const url = $(elem_title).attr("href");
            if (elem_title.length == 0 || url == null) {
                return;
            }
            this.connect_channel_id_for_endscreen(url, channel_id);
            const title
                = text_utility.remove_blank_line_and_head_space($(elem_title).text());
            YoutubeFilteringUtil.filtering_renderer_node_by_channel_id(renderer_root,
                                                                       channel_id,
                                                                       title,
                                                                       null,
                                                                       this.storage);
        });
    }
    /*!
     *  @brief  おすすめプレイリストフィルタ
     *  @note   channel_id取得コールバック/24年11月以降版
     */
    filtering_lockup_vm_recommend_playlists_by_channel_id(channel_code, channel_id) {
        this.call_recommended_contents_filter((e_parent)=> {
            YoutubeFilteringUtil.each_lockup_view_model((elem)=>{
                const detach_func = YoutubeFilteringUtil.detach_lower_lockup_vm_node;
                this.filtering_list_by_channel_id(elem,
                                                  channel_code,
                                                  channel_id,
                                                  detach_func);
            }, e_parent);
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
                if (elem_title.length == 0) {
                    return;
                }
                const title = $(elem_title).text();
                if (this.storage.title_filter(title)) {
                    $(a_tag).detach();
                    return;
                }
                const link = $(a_tag).attr("href");
                if (YoutubeUtil.is_list_link(link)) {
                    const list_id = YoutubeUtil.get_playlist_hash_by_node($(a_tag));
                    const channel_id = this.playlist_searcher.get_channel_id(list_id);
                    if (this.storage.channel_id_filter(channel_id, title)) {
                        $(a_tag).detach();
                    }
                } else {
                    if (this.storage.is_mute_shorts() && YoutubeUtil.is_shorts(link)) {
                        $(a_tag).detach();
                        return;
                    }
                    const channel_tag = "span.ytp-videowall-still-info-author";
                    const elem_channel = $(a_tag).find(channel_tag);
                    if (elem_channel.length == 0) {
                        return;
                    }
                    const author_info = $(elem_channel).text();
                    const channel
                        = YoutubeUtil.get_channel_from_author_info(author_info);
                    if (channel.length == 0) {
                        return;
                    }
                    if (this.storage.channel_filter(channel, title)) {
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
                    } else
                    if (this.storage.is_mute_shorts()) {
                        $(a_tag).detach();
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
        this.filtering_recommend_contents();
        this.filtering_endscreen_recommend_video();
        this.filtering_rich_grid_media((elem, tag_title, tag_thumbnail, tag_channel)=> {
            this.filtering_video_procedure(elem, tag_thumbnail, tag_title, tag_channel);
        });
        const TAG_GRID_SLIM_MEDIA = YoutubeShortsFilter.TAG_GRID_SLIM_MEDIA();
        this.shorts_filter.filtering_slim_videos(TAG_GRID_SLIM_MEDIA);
        const t_reel = YoutubeUtil.get_reel_shelf_header2_tag();
        this.shorts_filter.filtering_slim_videos2(t_reel);
    }

    /*!
     *  @brief  動画(Youtubeホーム)にフィルタをかける
     */
    filtering_home_video() {
        this.filtering_rich_grid_media((elem, tag_title, tag_thumbnail, tag_channel)=> {
            this.filtering_video_procedure(elem, tag_thumbnail, tag_title, tag_channel);
        });
        // 24年11月以降の構成に対応
        YoutubeFilteringUtil.each_rich_grid_renderer((rc_grid)=>{
            this.filtering_lists(rc_grid);
        });
        //
        const TAG_GRID_SLIM_MEDIA = YoutubeShortsFilter.TAG_GRID_SLIM_MEDIA();
        this.shorts_filter.filtering_slim_videos(TAG_GRID_SLIM_MEDIA);
        const t_rich = YoutubeUtil.get_rich_shelf_header_tag();
        this.shorts_filter.filtering_slim_videos2(t_rich);
    }
    /*!
     *  @brief  動画(Youtubeホーム)にフィルタをかける
     *  @param  channel_code    ユーザ名/カスタムチャンネル名/ハンドル
     *  @param  channel_id      チャンネルID
     *  @param  fl_func         フィルタ関数
     *  @note   チャンネルコードを持つ動画のフィルタリング
     *  @note   チャンネルID受信処理から呼ばれる
     */
    filtering_home_videos_by_channel_id(channel_code, channel_id, fl_func) {
        this.each_rich_grid_media((elem, tag_title)=> {
            const tag_channel = ".yt-simple-endpoint.style-scope.yt-formatted-string";
            if (fl_func(elem, tag_title, tag_channel, channel_code, channel_id)) {
                return;
            }
        });
    }
    /*!
     *  @brief  プレイリスト(Youtubeホーム)にフィルタをかける
     *  @note   チャンネルID受信処理から呼ばれる
     *  @note   24年11月以降の構成に対応
     */
    filtering_home_lockup_vm_playlists_by_channel_id(channel_code, channel_id) {
        YoutubeFilteringUtil.each_rich_grid_renderer((rc_grid)=>{
            this.filtering_lists_by_channel_id(rc_grid, channel_code, channel_id);
        });
    }    
    /*!
     *  @brief  動画(Youtubeホーム)のマーカーをクリアする
     *  @note   ContextMenu用
     */
    clear_home_video_marker() {
        this.each_rich_grid_media((elem)=> {
            YoutubeUtil.remove_filtered_marker(elem);
        });
    }


    /*!
     *  @brief  フィルタリング
     */
    filtering() {
        YoutubeUtil.permit_clearing_section_list_header();
        //
        if (this.dismissible_tag == null || this.dismissible_tag == "") {
            this.dismissible_tag = YoutubeUtil.get_div_dismissible();
        }
        const loc = this.current_location;
        if (this.storage.is_mute_shorts()) {
            if (loc.in_top_page() ||
                loc.in_youtube_trending() ||
                loc.in_youtube_search_page() ||
                loc.in_youtube_sp_channel_page() ||
                loc.in_youtube_movie_page()) {
                YoutubeShortsFilter.remove_whole_header();
                YoutubeShortsFilter.remove_whole_header2();
            }
        }
        if (loc.in_youtube_search_page() ||
            loc.in_youtube_trending()) {
            this.filtering_horizontal_videos();
            this.filtering_searched_video();
            this.filtering_searched_channel();
            this.filtering_searched_playlists();
            this.filtering_searched_radios();
            this.filtering_searched_lists();
            const TAG_REEL_RENDERER = YoutubeShortsFilter.TAG_REEL_RENDERER();
            this.shorts_filter.filtering_slim_videos(TAG_REEL_RENDERER);
            const t_reel = YoutubeUtil.get_reel_shelf_header_tag();
            this.shorts_filter.filtering_slim_videos2(t_reel);    
        } else if (loc.in_youtube_sp_channel_page() ||
                   loc.in_youtube_channel_page() ||
                   loc.in_youtube_user_page() ||
                   loc.in_youtube_custom_channel_page() ||
                   loc.in_youtube_handle_page()) {
            this.filtering_channel_page();
        } else if (loc.in_youtube_short_page()) {
            // ページ切り替わりタイミングでの誤操作抑制
            const act_reel = this.shorts_filter.get_active_reel();
            if (this.active_short_reel == null || act_reel == this.active_short_reel) {
                this.shorts_filter.filtering_video();
            }
        } else if (loc.in_youtube_movie_page()) {
            this.filtering_watch_video();
        } else if (loc.in_top_page() ||
                   loc.in_youtube_hashtag() ||
                   loc.in_youtube_sports())  {
            this.filtering_home_video();
        } else  if (loc.in_youtube_feeds()) {
            this.filtering_home_video();
            this.filtering_horizontal_videos();
            this.filtering_searched_video();
            this.filtering_searched_channel();
            this.filtering_searched_playlists();
            this.filtering_searched_radios();
            const TAG_REEL_RENDERER = YoutubeShortsFilter.TAG_REEL_RENDERER();
            this.shorts_filter.filtering_slim_videos(TAG_REEL_RENDERER);
            const t_reel = YoutubeUtil.get_reel_shelf_header_tag();
            this.shorts_filter.filtering_slim_videos2(t_reel);    
        } else {
            return;
        }
        this.video_info_accessor.kick();
        this.author_info_accessor.kick();
        this.channel_info_accessor.kick();
        this.playlist_searcher.kick();
        //
        YoutubeUtil.remove_carousel_banner();
        YoutubeUtil.clearing_section_list_header();
    }

    /*!
     *  @brief  ポストフィルタ(チャンネルコード)
     *  @param  channel_code    ユーザ名/カスタムチャンネル名/ハンドル
     *  @param  channel_id      チャンネルID
     *  @param  fl_func         フィルタリング関数
     *  @param  chk_func        urlチェック関数
     *  @note   チャンネルコードを基点とした各種フィルタ処理
     */
    post_filtering_by_channel_code(channel_code, channel_id, fl_func, chk_func) {
        const loc = this.current_location;
        if (loc.in_youtube_sp_channel_page() ||
            loc.in_youtube_channel_page() ||
            loc.in_youtube_user_page() ||
            loc.in_youtube_custom_channel_page() ||
            loc.in_youtube_handle_page()) {
            if (channel_code == YoutubeUtil.cut_channel_id(loc.url)) {
                this.filtering_channel_private_contents_by_channel_id(channel_id);
            }
            this.filtering_channel_videos_by_channel_id(channel_code, channel_id, fl_func);
            this.filtering_channel_playlists_by_channel_id(channel_code, channel_id, fl_func);
            this.filtering_channel_channels_by_channel_id(channel_code, channel_id, chk_func);
        } else if (loc.in_youtube_short_page()) {
            this.shorts_filter.filtering_video_by_channel_code(channel_code, channel_id, chk_func);
        } else if (loc.in_youtube_movie_page()) {
            this.filtering_grid_recommend_videos_by_channel_id(channel_code, channel_id);
            this.filtering_lockup_vm_recommend_playlists_by_channel_id(channel_code, channel_id);
        } else {
            this.filtering_searched_video_by_channel_id(channel_code, channel_id, fl_func);
            this.filtering_searched_playlist_by_channel_id(channel_code, channel_id, fl_func);
            this.filtering_searched_channel_by_channel_id(channel_code, channel_id, chk_func);
            this.filtering_horizontal_videos_by_channel_id(channel_code, channel_id, fl_func);
            this.filtering_home_videos_by_channel_id(channel_code, channel_id, fl_func);
            this.filtering_home_lockup_vm_playlists_by_channel_id(channel_code, channel_id);
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
     *  @brief  ポストフィルタ(カスタムチャンネル名/ハンドル)
     *  @note   独自チャンネル名を基点とした各種フィルタ処理
     *  @note   チャンネルID受信処理から呼ばれる
     */
    post_filtering_by_unique_name(unique_name, channel_id) {
        const fl_func = this.filtering_video_by_unique_name.bind(this);
        const chk_func = YoutubeUtil.is_uniquepage_url;
        this.post_filtering_by_channel_code(unique_name, channel_id, fl_func, chk_func);
    }
    /*!
     *  @brief  ポストフィルタ(動画ID)
     *  @note   動画IDを基点とした各種フィルタ処理
     *  @note   チャンネルID受信処理から呼ばれる
     */
    post_filtering_by_video_id(video_id, channel_id) {
        this.filtering_recommend_videos_by_channel_id(video_id, channel_id);
        this.shorts_filter.filtering_slim_video_by_video_id(video_id);
        this.shorts_filter.filtering_slim_video_by_video_id2(video_id);
    }
    /*!
     *  @brief  ポストフィルタ(リストID)
     *  @note   リストIDを基点とした各種フィルタ処理
     *  @note   チャンネルID受信処理から呼ばれる
     */
    post_filtering_by_playlist_id(list_id, channel_id) {
        this.filtering_recommend_playlists_by_channel_id(list_id, channel_id);
    }

    /*!
     *  @brief  動画情報(json)取得完了通知後処理
     *  @param  obj 動画オブジェクト
     */
    post_proc_tell_get_video_json(obj) {
        if (obj.channel_id != null) {
            if (obj.video_id != null) {
                this.post_filtering_by_video_id(obj.video_id, obj.channel_id);
            } else if (obj.list_id != null) {
                this.post_filtering_by_playlist_id(obj.list_id, obj.channel_id);
            }
        } else if (obj.username) {
            // jsonからチャンネルIDを得られなかった場合はこっち
            const channel_id = this.author_info_accessor.get_channel_id(obj.username);
            if (channel_id != null) {
                if (obj.video_id != null) {
                    this.video_info_accessor.set_channel_id(obj.video_id, channel_id);
                    this.post_filtering_by_video_id(obj.video_id, channel_id);
                } else if (obj.list_id != null) {
                    this.playlist_searcher.set_channel_id(obj.list_id, channel_id);
                    this.post_filtering_by_playlist_id(obj.list_id, channel_id);
                }
            } else {
                // usernameをキーにfeedを得る
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
                    this.post_filtering_by_video_id(obj.video_id, channel_id);
                } else if (obj.list_id != null) {
                    this.playlist_searcher.set_channel_id(obj.list_id, channel_id);
                    this.post_filtering_by_playlist_id(obj.list_id, channel_id);
                }
            } else {
                this.channel_info_accessor.entry(obj.unique_name);
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
        const list_ids
            = this.playlist_searcher.tell_get_channel_id(obj.username, obj.channel_id);
        for (const list_id of list_ids) {
            this.post_filtering_by_playlist_id(list_id, obj.channel_id);
        }        
        this.post_filtering_by_username(obj.username, obj.channel_id);
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
     *  @brief  チャンネル情報(html)取得完了通知後処理
     *  @param  obj 動画オブジェクト
     */
    post_proc_tell_get_channel_html(obj) {
        const video_ids
            = this.video_info_accessor
                  .tell_get_channel_id_by_unique_channel(obj.unique_name,
                                                         obj.channel_id);
        for (const video_id of video_ids) {
            this.post_filtering_by_video_id(video_id, obj.channel_id);
        }
        const list_ids
            = this.playlist_searcher
                  .tell_get_channel_id_by_unique_channel(obj.unique_name,
                                                         obj.channel_id);
        for (const list_id of list_ids) {
            this.post_filtering_by_playlist_id(list_id, obj.channel_id);
        }        
        this.post_filtering_by_unique_name(obj.unique_name, obj.channel_id);
        //
        this.comment_filter.tell_get_channel_id(obj.unique_name, obj.channel_id);
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
     *  @param  channel_name    チャンネル名
     */
    post_proc_tell_search_video_html(video_id, author_url, channel_name) {
        let obj = { video_id: video_id };
        const channel_code = YoutubeUtil.cut_channel_id(author_url);
        this.video_info_accessor.set_channel_name(video_id, channel_name);
        this.video_info_accessor.set_channel_code(video_id, author_url);
        if (YoutubeUtil.is_channel_url(author_url)) {
            obj.channel_id = channel_code;
        } else if (YoutubeUtil.is_userpage_url(author_url)) {
            obj.username = channel_code;
        } else if (YoutubeUtil.is_uniquepage_url(author_url)) {
            obj.unique_name = channel_code;
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
     */
    post_proc_parse_search_playlist_html(list_id, author_url) {
        if (author_url == null) {
            return; // 特殊チャンネル
        }
        let obj = { list_id: list_id };
        const channel_code = YoutubeUtil.cut_channel_id(author_url);
        this.playlist_searcher.set_channel_code(list_id, author_url);
        if (YoutubeUtil.is_channel_url(author_url)) {
            obj.channel_id = channel_code;
        } else if (YoutubeUtil.is_userpage_url(author_url)) {
            obj.username = channel_code;_            
        } else if (YoutubeUtil.is_uniquepage_url(author_url)) {
            obj.unique_name = channel_code;
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

    /*!
     *  @brief  高速化用マーカーをクリアする
     */
    clear_marker() {
        const loc = this.current_location;
        if (loc.in_youtube_search_page() || loc.in_youtube_trending()) {
            this.clear_searched_video_marker();
            this.clear_horizontal_video_marker();
            const TAG_REEL_RENDERER = YoutubeShortsFilter.TAG_REEL_RENDERER();
            this.shorts_filter.clear_slim_videos_marker(TAG_REEL_RENDERER);
            const t_reel = YoutubeUtil.get_reel_shelf_header_tag();
            this.shorts_filter.clear_slim_videos_marker2(t_reel);    
        } else if (loc.in_top_page() ||
                   loc.in_youtube_movie_page() ||
                   loc.in_youtube_hashtag() ||
                   loc.in_youtube_sports()) {
            this.clear_home_video_marker();
            const TAG_GRID_SLIM_MEDIA = YoutubeShortsFilter.TAG_GRID_SLIM_MEDIA();
            this.shorts_filter.clear_slim_videos_marker(TAG_GRID_SLIM_MEDIA);
            const t_rich = YoutubeUtil.get_rich_shelf_header_tag();
            this.shorts_filter.clear_slim_videos_marker2(t_rich);
            const t_reel2 = YoutubeUtil.get_reel_shelf_header2_tag();
            this.shorts_filter.clear_slim_videos_marker2(t_reel2);
        } else if (loc.in_youtube_feeds()) {
            this.clear_home_video_marker();
            this.clear_searched_video_marker();
            this.clear_horizontal_video_marker();
            const TAG_GRID_SLIM_MEDIA = YoutubeShortsFilter.TAG_GRID_SLIM_MEDIA();
            this.shorts_filter.clear_slim_videos_marker(TAG_GRID_SLIM_MEDIA);
            const TAG_REEL_RENDERER = YoutubeShortsFilter.TAG_REEL_RENDERER();
            this.shorts_filter.clear_slim_videos_marker(TAG_REEL_RENDERER);
            const t_rich = YoutubeUtil.get_rich_shelf_header_tag();
            this.shorts_filter.clear_slim_videos_marker2(t_rich);
            const t_reel = YoutubeUtil.get_reel_shelf_header_tag();
            this.shorts_filter.clear_slim_videos_marker2(t_reel);    
        } else if (loc.in_youtube_sp_channel_page() ||
                   loc.in_youtube_channel_page() ||
                   loc.in_youtube_user_page() ||
                   loc.in_youtube_custom_channel_page() ||
                   loc.in_youtube_handle_page()) {
            const TAG_REEL_RENDERER = YoutubeShortsFilter.TAG_REEL_RENDERER();
            this.shorts_filter.clear_slim_videos_marker(TAG_REEL_RENDERER);
            const TAG_GRID_SLIM_MEDIA = YoutubeShortsFilter.TAG_GRID_SLIM_MEDIA();
            this.shorts_filter.clear_slim_videos_marker(TAG_GRID_SLIM_MEDIA);
            const t_reel = YoutubeUtil.get_reel_shelf_header_tag();
            this.shorts_filter.clear_slim_videos_marker2(t_reel);    
            const t_grid = YoutubeUtil.get_rich_grid_header_tag();
            this.shorts_filter.clear_slim_videos_marker2(t_grid);    
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
        // 'スリープタイマー'を消す
        if (this.storage.is_remove_sleeptimer()) {
            YoutubeUtil.remove_sleeptimer();
        }
        // 24年2月新UIを無効化する
        if (this.ui_disabler != null) {
            this.ui_disabler.disable_element(this.current_location);
        }
    }

    get_observing_node(elem) {
        const tag = "ytd-page-manager#page-manager.style-scope.ytd-app";
        $(tag).each((inx, e)=> { elem.push(e); });
        const tag_popup = "ytd-popup-container.style-scope.ytd-app";
        $(tag_popup).each((inx, e)=> { elem.push(e); });
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
        const chk_node = records[0].target;
        // マウスオーバによるアイテム追加は弾きたい
        if (chk_node.id != null) {
            if (chk_node.id.indexOf('-overlay') >= 0) {
                return true;
            }
            if (chk_node.id.indexOf('tooltip') >= 0) {
                return true;
            }
        }
        if (chk_node.className != null) {
            if (chk_node.className.indexOf('-overlay') >= 0) {
                return true;
            }
            if (chk_node.className.indexOf('tooltip') >= 0) {
                return true;
            }
            if (chk_node.className.indexOf('icon-shape') >= 0) {
                return true;
            }
        }
        if (chk_node.localName != null) {
            if (chk_node.localName.indexOf('paper-tab') >= 0) {
                return true;
            }
            if (chk_node.localName.indexOf('yt-icon') >= 0) {
                return true;
            }
            if (chk_node.localName.indexOf('yt-thumbnail-view-model') >= 0) {
                return true;
            }            
        }
        return false;
    }

    /*!
     *  @brief  element追加callback
     *  @note   after_domloaded_observerから呼ばれる
     */
    callback_observing_element_change(b_change_url) {
        const urlw = this.current_location;
        this.comment_filter.callback_observing_element_change(b_change_url, urlw);
        // recommendタブ切り替えボタンのclick監視
        // 再利用に失敗するので一回全部detachしたい
        if (urlw.in_youtube_movie_page()) {
            if (!this.b_add_chip_eventlistenr) {
                const tag_watch_2nd = "div#secondary-inner";
                const tag_recommend_tab = "yt-chip-cloud-chip-renderer";
                $(tag_watch_2nd).find(tag_recommend_tab).each((inx, chip)=> {
                    chip.addEventListener('click', ()=>{
                        this.detach_recommended_contents_all();
                    });
                    this.b_add_chip_eventlistenr = true;
                });
            }
        } else
        if (urlw.in_youtube_short_page()) {
            const act_reel = this.shorts_filter.get_active_reel();
            if (this.active_short_reel == null || act_reel == this.active_short_reel) {
                this.shorts_filter.callback_observing_element_change();
            }
        }
    }
    /*!
     */
    callback_ready_element_observer() {
        if (this.storage.is_disable_border_radius()) {
            YoutubeUtil.disable_border_radius_of_thumbnail();
        }
        if (this.current_location.in_youtube_movie_page()) {
            const video_id
                = YoutubeUtil.cut_movie_hash(this.current_location.url);
            this.ui_disabler
                = new Youtube24febUIDisabler(this.storage, video_id);
        }
    }

    callback_change_url(prev_urlw, to_urlw) {
        if (this.shorts_filtering_close_timer != null) {
            clearTimeout(this.shorts_filtering_close_timer);
            this.shorts_filtering_close_timer = null;
        }
        if (this.shorts_filtering_timer != null) {
            clearInterval(this.shorts_filtering_timer);
            this.shorts_filtering_timer = null;
        }
        if (prev_urlw.in_youtube_movie_page()) {
            this.ui_disabler.exit_watch_page();
            this.detach_recommended_contents_all();
            this.b_add_chip_eventlistenr = false;
        } else
        if (to_urlw.in_youtube_movie_page()) {
            if (this.ui_disabler == null) {
                const video_id
                    = YoutubeUtil.cut_movie_hash(to_urlw.url);
                this.ui_disabler
                    = new Youtube24febUIDisabler(this.storage, video_id);
            }
        } else
        if (to_urlw.in_youtube_short_page())  {
            // ※shortsページ
            // elem監視だけだとすっぽ抜けるのでtimerでサポートする
            this.active_short_reel = this.shorts_filter.get_active_reel();
            this.shorts_filtering_close_timer = setTimeout(()=> {
                // 2.5sec経ったらサポート打ち切ってOK
                clearTimeout(this.shorts_filtering_close_timer);
                this.shorts_filtering_close_timer = null;
            }, 2500);
            this.shorts_filtering_timer = setInterval(()=> {
                const act_reel = this.shorts_filter.get_active_reel();
                if (this.active_short_reel != null &&
                    act_reel != this.active_short_reel) {
                    // ページが切り替わってたら打ち切り
                    clearTimeout(this.shorts_filtering_close_timer);
                    this.shorts_filtering_close_timer = null;
                    clearInterval(this.shorts_filtering_timer);
                    this.shorts_filtering_timer = null;
                } else {
                    this.filtering();
                    if (this.storage.is_hidden_start()) {
                        this.shorts_filter.no_disp_initialize();
                    }
                    if (this.shorts_filter.is_end_filtering() &&
                        this.shorts_filtering_close_timer == null) {
                        clearInterval(this.shorts_filtering_timer);
                        this.shorts_filtering_timer = null;
                    }
                }
            }, 250); /* 1/4sec */
            if (prev_urlw.in_youtube_short_page()) {
                this.shorts_filter.player_initialize();
            }
        }
        if (this.ui_disabler != null) {
            this.ui_disabler.update_css(to_urlw);
        }
    }

    /*!
     *  @param storage  ストレージインスタンス
     */
    constructor(storage) {
        super(storage);
        super.create_after_domloaded_observer(this.is_valid_records.bind(this));
        this.shorts_filter
            = new YoutubeShortsFilter(storage, this.data_counter);
        this.comment_filter
            = new YoutubeCommentFilter(storage, this.channel_info_accessor);
        this.dismissible_tag = null;
        this.b_add_chip_eventlistenr = false;
        this.active_short_reel = null;
        this.shorts_filtering_close_timer = null;
        this.shorts_filtering_timer = null;
    }
}
