/*!
 *  @brief  Youtubeおすすめフィルタ
 */
class YoutubeRecommendFilter {

    static get_lookup_vm_list_channel_element(elem) {
        const elem_channel = YoutubeUtil.get_lockup_vm_channel_element(elem);
        if (elem_channel == null) {
            return null;
        }
        const elem_link = $(elem_channel).find("a.yt-core-attributed-string__link");
        if (elem_link.length == 0) {
            return null;
        }
        return $(elem_link[0]);
    }

    call_contents_filter(fl_func) {
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
    filtering_video(elem) {
        const detach_func = this.func_detach_lower_node;
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
    filtering_playlist(elem) {
        const detach_func = this.func_detach_lower_node;
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
    filtering_radios(e_parent) {
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
                this.func_detach_lower_node(renderer_root);
            }
        });
    }

    /*!
     *  @brief  おすすめ(動画/プレイリスト/Mixリスト)にフィルタをかける
     *  @note   25年07月以降の構成(lockup-view-model)用
     */
    filtering_content(elem) {
        const detach_func = YoutubeFilteringUtil.detach_lower_lockup_vm_node;
        const renderer_root = YoutubeUtil.search_renderer_root($(elem));
        if (renderer_root.length == 0) {
            return false;
        }
        YoutubeUtil.remove_renderer_node_channel_id(renderer_root);
        //
        const elem_title = YoutubeUtil.get_lockup_vm_title_elem(elem);
        const elem_link = YoutubeUtil.get_lockup_vm_link_elem(elem);
        if (elem_title.length != 1 || elem_link.length != 1) {
            return false;
        }
        let channel_id = null;
        const title
            = text_utility.remove_blank_line_and_head_space($(elem_title).text());
        const url = $(elem_link).attr("href");
        if (YoutubeUtil.is_mixlist_link(url)) {
            // MIXリスト
            if (this.storage.title_filter(title)) {
                detach_func(renderer_root);
                return true;
            } else {
                return false;
            }
        } else if (YoutubeUtil.is_list_link(url)) {
            // プレイリスト
            const elem_channel
                = YoutubeRecommendFilter.get_lookup_vm_list_channel_element(elem);
            if (elem_channel == null) {
                return false;
            }
            const channel = $(elem_channel).text();
            if (this.storage.channel_and_title_filter(channel, title)) {
                detach_func(renderer_root);
                return true;
            }
            const author_url = $(elem_channel).attr("href");
            // endscreen用の空登録(あとからchannel_idを差し込む)
            const list_id = YoutubeUtil.get_playlist_hash(url);
            this.playlist_searcher.set_list_id(list_id);
            this.playlist_searcher.set_channel_code(list_id, author_url);
            //
            const dc = this.data_counter;
            channel_id = dc.get_channel_id_from_author_url_or_entry_request(author_url);
        } else {
            const elem_channel = YoutubeUtil.get_lockup_vm_channel_element(elem);
            if (elem_channel == null) {
                return false;
            }
            const channel = $(elem_channel).text();
            if (this.storage.channel_and_title_filter(channel, title)) {
                detach_func(renderer_root);
                return true;
            }
            if (this.storage.is_mute_shorts() && YoutubeUtil.is_shorts(url)) {
                detach_func(renderer_root);
                return true;
            }
            const video_id = YoutubeUtil.get_video_hash_by_link(url);
            channel_id = this.video_info_accessor.get_channel_id(video_id);
            if (channel_id == null) {
                this.video_info_accessor.entry(video_id);
                return false;
            }            
         }
         return YoutubeFilteringUtil.filtering_renderer_node_by_channel_id(renderer_root,
                                                                           channel_id,
                                                                           title,
                                                                           detach_func,
                                                                           this.storage);
    }

    filtering_contents() {
        this.call_contents_filter((e_parent)=> {
            YoutubeFilteringUtil.each_recommend_videos(e_parent, (elem)=>{
                this.filtering_video(elem);
            });
            YoutubeFilteringUtil.each_recommend_playlists(e_parent, (elem)=>{
                this.filtering_playlist(elem);
            });
            this.filtering_radios(e_parent)
            // 25年07月以降の構成に対応
            YoutubeFilteringUtil.each_lockup_view_model((elem)=>{
                this.filtering_content(elem);
            }, e_parent);
        });
    }

    /*!
     *  @brief  おすすめ(動画/プレイリスト)フィルタ
     *  @param  elem        コンテンツノード
     *  @param  content_id  ID(動画ID/プレイリストID)
     *  @param  channel_id  チャンネルID
     *  @param  get_func    ID取得関数
     *  @note   channel_id取得コールバック
     */
    filtering_content_by_channel_id(elem, content_id, channel_id, get_func) {
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
            this.func_detach_lower_node(renderer_root);
        } else {
            YoutubeUtil.set_renderer_node_channel_id(renderer_root, channel_id);
        }
    }
    /*!
     *  @brief  おすすめ(動画/プレイリスト)フィルタ
     *  @param  elem        コンテンツノード
     *  @param  content_id  ID(動画ID/プレイリストID)
     *  @param  channel_id  チャンネルID
     *  @note   channel_id取得コールバック
     *  @note   25年07月以降の構成(lockup-view-model)に対応
     */
    filtering_content_lvm_by_channel_id(elem, content_id, channel_id) {
        const renderer_root = YoutubeUtil.search_renderer_root($(elem));
        if (renderer_root.length == 0) {
            return;
        }
        const elem_link = YoutubeUtil.get_lockup_vm_link_elem(elem);
        if (elem_link.length == 0) {
            return;
        }
        const url = $(elem_link).attr("href");
        if (YoutubeUtil.is_mixlist_link(url)) {
            return;
        } else
        if (YoutubeUtil.is_list_link(url)) {
            if (content_id != YoutubeUtil.get_playlist_hash(url)) {
                return;
            }
        } else {
            if (content_id != YoutubeUtil.get_video_hash_by_link(url)) {
                return;
            }
        }
        const elem_title = YoutubeUtil.get_lockup_vm_title_elem(elem);
        if (elem_title.length == 0) {
            return;
        }
        const title
            = text_utility.remove_blank_line_and_head_space($(elem_title).text());
        if (this.storage.channel_id_filter(channel_id, title)) {
            YoutubeFilteringUtil.detach_lower_lockup_vm_node(renderer_root);
        } else {
            YoutubeUtil.set_renderer_node_channel_id(renderer_root, channel_id);
        }
    }    
    filtering_videos_by_channel_id(video_id, channel_id) {
        const get_func = YoutubeUtil.get_video_hash_by_node;
        this.call_contents_filter((e_parent)=> {
            YoutubeFilteringUtil.each_recommend_videos(e_parent, (elem)=>{
                this.filtering_content_by_channel_id(elem,
                                                     video_id,
                                                     channel_id,
                                                     get_func);
            });
            YoutubeFilteringUtil.each_lockup_view_model((elem)=>{
                this.filtering_content_lvm_by_channel_id(elem,
                                                         video_id,
                                                         channel_id);
            }, e_parent);
        });
    }
    filtering_playlists_by_channel_id(list_id, channel_id) {
        const get_func = YoutubeUtil.get_playlist_hash_by_node;
        this.call_contents_filter((e_parent)=> {
            YoutubeFilteringUtil.each_recommend_playlists(e_parent, (elem)=>{
                this.filtering_content_by_channel_id(elem,
                                                     list_id,
                                                     channel_id,
                                                     get_func);
            });
            YoutubeFilteringUtil.each_lockup_view_model((elem)=>{
                this.filtering_content_lvm_by_channel_id(elem,
                                                         list_id,
                                                         channel_id);
            }, e_parent);
        });
    }
    /*!
     *  @note   rootからdetachするとloadingマークが残る
     *  @note   dismissibleからdetachすると動画→動画で再利用失敗する
     *  @note   →watchから抜ける際に全消しして再利用回避
     */
    detach_contents_all() {
        this.call_contents_filter((e_parent)=> {
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
    filtering_grid_videos_by_channel_id(channel_code, channel_id) {
        this.func_filtering_rich_grid_media((elem,
                                             tag_title,
                                             tag_thumbnail,
                                             tag_channel)=> {
            const renderer_root = YoutubeUtil.search_renderer_root($(elem));
            if (renderer_root.length == 0) {
                return;
            }
            const elem_channel
                = HTMLUtil.find_first_appearing_element(elem, tag_channel);
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
     *  @brief  おすすめ動画フィルタ(動画終了時のやつ)
     */
    filtering_endscreen_video() {
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
     *  @brief  element追加callback
     */
    callback_observing_element_change() {
        // recommendタブ切り替えボタンのclick監視
        // 再利用に失敗するので一回全部detachしたい
        if (!this.b_add_chip_eventlistenr) {
            const tag_watch_2nd = "div#secondary-inner";
            const tag_recommend_tab = "yt-chip-cloud-chip-renderer";
            $(tag_watch_2nd).find(tag_recommend_tab).each((inx, chip)=> {
                chip.addEventListener('click', ()=>{
                    this.detach_contents_all();
                });
                this.b_add_chip_eventlistenr = true;
            });
        }
    }
    /*!
     *  @brief  動画再生ページから脱出callback
     */
    callback_exit_watch() {
        this.detach_contents_all();
        this.b_add_chip_eventlistenr = false;
    }

    /*!
     */
    constructor(storage,
                dc,
                video_info_accessor,
                playlist_searcher,
                func_detach_lower_node,
                func_filtering_rich_grid_media) {
        this.storage = storage;
        this.data_counter = dc;
        this.video_info_accessor = video_info_accessor;
        this.playlist_searcher = playlist_searcher;
        this.func_detach_lower_node = func_detach_lower_node;
        this.func_filtering_rich_grid_media = func_filtering_rich_grid_media;
        this.b_add_chip_eventlistenr = false;
    }
}
