function detach_video(elem) {
    HTMLUtil.detach_lower_node2(elem, "div#dismissible");
}
function get_elem_link_compact_video_renderer(renderer_root) {
    const tag_a = "a.yt-simple-endpoint.style-scope.ytd-compact-video-renderer";
    return renderer_root.querySelector(tag_a);
}
/*!
 *  @brief  おすすめ動画フィルタ
 *  @param  renderer_root       動画ノード(compact-video-renderer)
 *  @param  storage             StorageDataクラスインスタンス
 *  @param  video_info_accessor VideoInfoAccessorクラスインスタンス
 *  @note   26/02現在video形式shortでのみ使われている
 */
function filtering_video(renderer_root, storage, video_info_accessor) {
    YoutubeUtil.remove_renderer_node_channel_id(renderer_root);
    //
    const elem_a = get_elem_link_compact_video_renderer(renderer_root);
    if (elem_a == null) {
        return;
    }
    const elem_title = elem_a.querySelector("span#video-title");
    if (elem_title == null) {
        return;
    }
    const title
        = text_utility.remove_blank_line_and_head_space(elem_title.textContent);
    const channel = YoutubeUtil.get_channel_name(elem_a);
    if (storage.channel_and_title_filter(channel, title)) {
        detach_video(renderer_root);
        return;
    }
    const url = elem_a.href;
    if (storage.is_mute_shorts() && YoutubeUtil.is_shorts(url)) {
        detach_video(renderer_root);
        return;
    }
    const video_id = YoutubeUtil.get_video_hash_by_link(url);
    const channel_id = video_info_accessor.get_channel_id(video_id);
    if (channel_id == null) {
        YoutubeFilteringUtil.set_wait(renderer_root);
        video_info_accessor.entry(video_id);
    } else {
        YoutubeFilteringUtil.filtering_renderer_node_by_channel_id(renderer_root,
                                                                   channel_id,
                                                                   title,
                                                                   detach_func,
                                                                   storage);
    }
}
/*!
 *  @brief  おすすめ動画フィルタ
 *  @param  renderer_root   動画ノード(compact-video-renderer)
 *  @param  video_id        動画ID
 *  @param  channel_id      チャンネルID
 *  @param  storage         StorageDataクラスインスタンス
 *  @note   channel_id取得コールバック
 */
function filtering_video_by_channel_id(renderer_root, video_id, channel_id, storage) {
    const elem_a = get_elem_link_compact_video_renderer(renderer_root);
    if (elem_a == null) {
        return;
    }
    if (video_id != YoutubeUtil.get_video_hash_by_node(elem_a)) {
        return;
    }
    const elem_title = elem_a.querySelector("span#video-title");
    if (elem_title == null) {
        return;
    }
    const title
        = text_utility.remove_blank_line_and_head_space(elem_title.textContent);
    if (storage.channel_id_filter(channel_id, title)) {
        detach_video(renderer_root);
    } else {
        YoutubeFilteringUtil.completed(renderer_root);
        YoutubeUtil.set_renderer_node_channel_id(renderer_root, channel_id);
    }
}


/*!
 *  @brief  おすすめ(動画/プレイリスト)フィルタ
 *  @param  elem        コンテンツノード
 *  @param  content_id  ID(動画ID/プレイリストID)
 *  @param  channel_id  チャンネルID
 *  @param  storage
 *  @note   channel_id取得コールバック
 *  @note   25年07月以降の構成(lockup-view-model)に対応
 */
function filtering_content_lvm_by_channel_id(elem, content_id, channel_id, storage) {
    const renderer_root = YoutubeUtil.search_renderer_root(elem);
    if (renderer_root == null) {
        return;
    }
    const elem_link = YoutubeUtil.get_lockup_vm_link_elem(elem);
    if (elem_link == null) {
        return;
    }
    const url = elem_link.href;
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
    if (elem_title == null) {
        return;
    }
    const title
        = text_utility.remove_blank_line_and_head_space(elem_title.textContent);
    if (storage.channel_id_filter(channel_id, title)) {
        YoutubeFilteringUtil.detach_lower_lockup_vm_node(renderer_root);
    } else {
        YoutubeFilteringUtil.completed(renderer_root);
        YoutubeUtil.set_renderer_node_channel_id(renderer_root, channel_id);
    }
}


/*!
 *  @class  Youtubeおすすめフィルタ
 */
class YoutubeRecommendFilter {

    static get_lookup_vm_list_channel_element(elem) {
        const elem_channel = YoutubeUtil.get_lockup_vm_channel_element(elem);
        if (elem_channel == null) {
            return null;
        }
        return elem_channel.querySelector("a.yt-core-attributed-string__link");
    }

    call_contents_filter(fl_func) {
        const e_parent = document.querySelector("div#related.style-scope.ytd-watch-flexy");
        if (e_parent != null) {
            fl_func(e_parent);
            YoutubeUtil.remove_spiner_renderer(e_parent);
        }
    }


    /*!
     *  @brief  おすすめ(動画/プレイリスト/Mixリスト)にフィルタをかける
     *  @note   25年07月以降の構成(lockup-view-model)用
     */
    filtering_content(elem) {
        const detach_func = YoutubeFilteringUtil.detach_lower_lockup_vm_node;
        const renderer_root = YoutubeUtil.search_renderer_root(elem);
        if (renderer_root == null) {
            return false;
        }
        YoutubeUtil.remove_renderer_node_channel_id(renderer_root);
        //
        const elem_title = YoutubeUtil.get_lockup_vm_title_elem(elem);
        const elem_link = YoutubeUtil.get_lockup_vm_link_elem(elem);
        if (elem_title == null || elem_link == null) {
            return false;
        }
        let channel_id = null;
        const title
            = text_utility.remove_blank_line_and_head_space(elem_title.textContent);
        const url = elem_link.href;
        if (YoutubeUtil.is_mixlist_link(url)) {
            // MIXリスト
            if (this.storage.title_filter(title)) {
                detach_func(renderer_root);
                return true;
            } else {
                YoutubeFilteringUtil.completed(renderer_root);
                return false;
            }
        } else if (YoutubeUtil.is_list_link(url)) {
            // プレイリスト
            const elem_channel
                = YoutubeRecommendFilter.get_lookup_vm_list_channel_element(elem);
            if (elem_channel == null) {
                return false;
            }
            const channel = elem_channel.textContent;
            if (this.storage.channel_and_title_filter(channel, title)) {
                detach_func(renderer_root);
                return true;
            }
            const author_url = elem_channel.href;
            // endscreen用の空登録(あとからchannel_idを差し込む)
            const list_id = YoutubeUtil.get_playlist_hash(url);
            this.playlist_searcher.set_list_id(list_id);
            this.playlist_searcher.set_channel_code(list_id, author_url);
            //
            const dc = this.data_counter;
            channel_id = dc.get_channel_id_from_author_url_or_entry_request(author_url);
            if (channel_id == null) {
                YoutubeFilteringUtil.set_wait(renderer_root);
            }
        } else {
            const elem_channel = YoutubeUtil.get_lockup_vm_channel_element(elem);
            if (elem_channel == null) {
                return false;
            }
            const channel = elem_channel.textContent;
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
                YoutubeFilteringUtil.set_wait(renderer_root);
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
        const storage = this.storage;
        const video_info_accessor = this.video_info_accessor;
        this.call_contents_filter((e_parent)=> {
            YoutubeFilteringUtil.each_recommend_videos_fresh(e_parent, elem=>{
                filtering_video(elem, storage, video_info_accessor);
            });
            // 映画(compact-movie-renderer)予定地
            // 25年07月以降の構成に対応
            YoutubeFilteringUtil.each_lockup_view_model_fresh((elem)=>{
                this.filtering_content(elem);
            }, e_parent);
        });
    }

    filtering_videos_by_channel_id(video_id, channel_id) {
        const storage = this.storage;
        this.call_contents_filter((e_parent)=> {
            YoutubeFilteringUtil.each_recommend_videos_wait(e_parent, elem=>{
                filtering_video_by_channel_id(elem,
                                              video_id,
                                              channel_id,
                                              storage);
            });
            YoutubeFilteringUtil.each_lockup_view_model_wait(elem=>{
                filtering_content_lvm_by_channel_id(elem,
                                                    video_id,
                                                    channel_id,
                                                    storage);
            }, e_parent);
        });
    }
    filtering_playlists_by_channel_id(list_id, channel_id) {
        const storage = this.storage;
        this.call_contents_filter((e_parent)=> {
            YoutubeFilteringUtil.each_lockup_view_model_wait((elem)=>{
                filtering_content_lvm_by_channel_id(elem,
                                                    list_id,
                                                    channel_id,
                                                    storage);
            }, e_parent);
        });
    }

    /*!
     *  @note   NGID追加(ContextMenu)用
     *  @note   stateを一回消して全contentsに再度フィルタをかける
     */
    clear_contents_state() {
        this.call_contents_filter((e_parent)=> {
            for (const elem of e_parent.querySelectorAll("ytd-compact-video-renderer")) {
                YoutubeFilteringUtil.remove_state(elem);
            }
            YoutubeFilteringUtil.each_lockup_view_model((elem)=>{
                YoutubeFilteringUtil.remove_state(elem);
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
            for (const elem of e_parent.querySelectorAll("ytd-compact-video-renderer," +
                                                         "ytd-compact-movie-renderer")) {
                elem.remove();
            }
            // 24年11月以降の構成に対応
            YoutubeFilteringUtil.each_lockup_view_model((elem)=>{
                elem.remove();
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
     *  @brief  おすすめ動画フィルタ(全画面時ホイールスクロールで出てくる奴)
     *  @nbote  26/01/17時点では動画終了時に出るおすすめも同形式
     */
    filtering_fullscreen_videowall() {
        const tag_fulluscreen_container = "div.ytp-fullscreen-grid-stills-container"
        const root = document.body.querySelector(tag_fulluscreen_container);
        if (root == null) {
            return;
        }
        const tag_a = "a.ytp-modern-videowall-still:not([state])";
        const func_remove = (elem)=> {
            // 削除すると定期的に再生成されるのでhiddenで回避
            elem.hidden = true;
            YoutubeFilteringUtil.removed(elem);
        };
        const storage = this.storage;
        const playlist_searcher = this.playlist_searcher;
        const video_info_accessor = this.video_info_accessor;
        for (const elem_a of root.querySelectorAll(tag_a)) {
            const title = elem_a.getAttribute("aria-label");
            if (title == null) {
                return
            }
            if (storage.title_filter(title)) {
                func_remove(elem_a);
                return;
            }
            const link = elem_a.href;
            if (YoutubeUtil.is_list_link(link)) {
                const list_id = YoutubeUtil.get_playlist_hash_by_node(elem_a);
                const channel_id = playlist_searcher.get_channel_id(list_id);
                if (channel_id != null) {
                    if (storage.channel_id_filter(channel_id, title)) {
                        func_remove(elem_a);
                    } else {
                        YoutubeFilteringUtil.completed(elem_a);
                    }
                }
            } else {
                if (storage.is_mute_shorts() && YoutubeUtil.is_shorts(link)) {
                    func_remove(elem_a);
                    return;
                }
                const channel_tag = "span.ytp-modern-videowall-still-info-author";
                const elem_channel = elem_a.querySelector(channel_tag);
                if (elem_channel == null) {
                    return;
                }
                const channel = elem_channel.textContent;
                if (storage.channel_filter(channel, title)) {
                    func_remove(elem_a);
                    return;
                }
                const video_id = YoutubeUtil.get_video_hash_by_link(link);
                const channel_id = video_info_accessor.get_channel_id(video_id);
                if (channel_id != null) {
                    if (storage.channel_id_filter(channel_id, title)) {
                        func_remove(elem_a);
                    } else {
                        YoutubeFilteringUtil.completed(elem_a);
                        YoutubeUtil.set_renderer_node_channel_id(elem_a, channel_id);
                    }
                }
            }
            // note
            // 動画終了時のおすすめ動画(a)は再生画面右に出るおすすめ動画(b)と
            // 共通(a∋b)であるため、(b)フィルタ処理でchannel_id取得済み。
            // (a)独自に取得要求を出す必要はない。                
        }
    }
    /*!
     *  @brief  おすすめ動画フィルタ(動画終了時のやつ)
     */
    filtering_endscreen_video() {
        const tag_endscreen_content = "div.ytp-endscreen-content"
        const root = document.body.querySelectorAll(tag_endscreen_content);
        for (const rt of root) {
            for (const elem_a of rt.getElementsByTagName("a")) {
                const title_tag = "span.ytp-videowall-still-info-title";
                const elem_title = elem_a.querySelector(title_tag);
                if (elem_title == null) {
                    return;
                }
                const title = elem_title.textContent;
                if (this.storage.title_filter(title)) {
                    elem_a.remove();
                    return;
                }
                const link = elem_a.href;
                if (YoutubeUtil.is_list_link(link)) {
                    const list_id = YoutubeUtil.get_playlist_hash_by_node(elem_a);
                    const channel_id = this.playlist_searcher.get_channel_id(list_id);
                    if (this.storage.channel_id_filter(channel_id, title)) {
                        elem_a.remove();
                    }
                } else {
                    if (this.storage.is_mute_shorts() && YoutubeUtil.is_shorts(link)) {
                        elem_a.remove();
                        return;
                    }
                    const channel_tag = "span.ytp-videowall-still-info-author";
                    const elem_channel = elem_a.querySelector(channel_tag);
                    if (elem_channel == null) {
                        return;
                    }
                    const author_info = elem_channel.textContent;
                    const channel
                        = YoutubeUtil.get_channel_from_author_info(author_info);
                    if (channel === '') {
                        return;
                    }
                    if (this.storage.channel_filter(channel, title)) {
                        elem_a.remove();
                        return;
                    }
                    const video_id = YoutubeUtil.get_video_hash_by_node(elem_a);
                    const channel_id = this.video_info_accessor.get_channel_id(video_id);
                    if (channel_id != null) {
                        if (this.storage.channel_id_filter(channel_id, title)) {
                            elem_a.remove();
                        } else {
                            YoutubeUtil.set_renderer_node_channel_id(elem_a, channel_id);
                        }
                    } else
                    if (this.storage.is_mute_shorts()) {
                        elem_a.remove();
                    }
                }
                // note
                // 動画終了時のおすすめ動画(a)は再生画面右に出るおすすめ動画(b)と
                // 共通(a∋b)であるため、(b)フィルタ処理でchannel_id取得済み。
                // (a)独自に取得要求を出す必要はない。
            }
        }
    }

    /*!
     *  @brief  element追加callback
     */
    callback_observing_element_change() {
        // recommendタブ切り替えボタンのclick監視
        // 再利用に失敗するので一回全部detachしたい
        if (!this.b_add_chip_eventlistenr) {
            const secondary = document.body.querySelector("div#secondary-inner");
            if (secondary != null) {
                const tag_recommend_tab = "yt-chip-cloud-chip-renderer";
                for (const chip of secondary.getElementsByTagName(tag_recommend_tab)) {
                    chip.addEventListener('click', ()=>{
                        this.detach_contents_all();
                    });
                    this.b_add_chip_eventlistenr = true;
                }
            }
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
                playlist_searcher) {
        this.storage = storage;
        this.data_counter = dc;
        this.video_info_accessor = video_info_accessor;
        this.playlist_searcher = playlist_searcher;
        this.b_add_chip_eventlistenr = false;
    }
}
