/*!
 *  @brief  YoutubeShortsフィルタ
 */
class ShortReelInfo {
    constructor() {
        this.b_first = true;
        this.timer = null;
        this.b_force = false;
        this.channel = null;
        this.title = null;
    }
    is_first() {
        return this.b_first;
    }
    is_empty() {
        return this.channel == null && this.title == null;
    }
    is_same(channel, title) {
        return this.channel == channel && this.title == title;
    }
    reset() {
        this.b_first = false;
        this.b_force = false;
        this.channel = null;
        this.title = null;
    }
    update(channel, title) {
        this.channel = channel;
        this.title = title;
    }
    set_timer(intv) {
        this.timer = setInterval(()=> {
            this.clear_timer();
            this.b_force = true;
        }, intv);
    }
    clear_timer() {
        if (this.timer != null) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}
class YoutubeShortsFilter {

    static TAG_GRID_SLIM_MEDIA() { return ".style-scope.ytd-rich-grid-slim-media"; }
    static TAG_SHELF_RENDERER() { return ".style-scope.ytd-rich-shelf-renderer"; }
    static TAG_REEL_RENDERER()  { return ".style-scope.ytd-reel-item-renderer"; }
    static TAG_GRID_SHELF_VM() { return "grid-shelf-view-model"; }

    static TAG_SHORTS_V2() { return "ytm-shorts-lockup-view-model-v2"; }
    static TAG_SHORTS_REEL() { return ".reel-video-in-sequence.style-scope.ytd-shorts"; }
    static TAG_SHORTS_REEL_NEW()  { return ".reel-video-in-sequence-new.style-scope.ytd-shorts"; }
    static TAG_PLAYER_CONTAINER() { return "div#player-container"; }

    static TAG_VIEWED_MARKER = "viewed";

    static PL_PAUSE_MODE = 0;
    static PL_PLAYING_MODE = 1;

    static NO_DISP_NONE = 0;
    static NO_DISP_INIT = 1;        // short動画初期化(ページめくり毎)
    static NO_DISP_HIDE = 2;        // 次のshort動画非表示課完了
    static NO_DISP_PAUSE = 3;       // short動画停止完了
    static NO_DISP_WAIT = 4;        // フィルタ処理完了待ち
    static NO_DISP_COMPLETE = 5;    // 全処理完了

    static PREV_ACTIVE_REEL_ID = null;
    static ACTIVE_REEL_ID = "0";
    static B_REEL_NEW = false;

    /*!
     *  @note   Ver2/24年8月末頃の構成変更対応版
     */
    static search_renderer_root2(elem) {
        const renderer_root = YoutubeUtil.search_renderer_root($(elem));
        if (renderer_root.length > 0) {
            return renderer_root;
        }
        return YoutubeUtil.search_shorts_renderer_root($(elem));
    }

    /*!
     *  @brief  水平配置shortsをヘッダごと消し去る
     *  @note   Ver2/24年8月末頃の構成変更対応版
     */
    static remove_whole_header2_core(tag) {
        const t_shorts = YoutubeShortsFilter.TAG_SHORTS_V2();
        $(tag).each((inx, shelf)=> {
            let shorts_cnt = 0;
            $(shelf).find(t_shorts).each((inx, elem)=> {
                shorts_cnt++;
            });
            if (shorts_cnt > 0) {
                $(shelf).detach();
            }
        });
    }
    static remove_whole_header2() {
        const t_reel = YoutubeUtil.get_reel_shelf_header_tag();
        YoutubeShortsFilter.remove_whole_header2_core(t_reel);
        const t_reel2 = YoutubeUtil.get_reel_shelf_header2_tag();
        YoutubeShortsFilter.remove_whole_header2_core(t_reel2);
        const t_rich = YoutubeUtil.get_rich_shelf_header_tag();
        YoutubeShortsFilter.remove_whole_header2_core(t_rich);
        const t_gs_vm = YoutubeShortsFilter.TAG_GRID_SHELF_VM();
        YoutubeShortsFilter.remove_whole_header2_core(t_gs_vm);
    }

    /*!
     *  @brief  水平配置shortsをヘッダごと消し去る
     */
    static remove_whole_header_core(tag) {
        $(tag).each((inx, elem)=> {
            let num_thumb = 0;
            let num_shorts = 0;
            $(elem).find("a#thumbnail").each((inx, e_thumb)=> {
                num_thumb++;
                const url = $(e_thumb).attr("href");
                if (url == null) {
                    return;
                }
                if (YoutubeUtil.is_shorts(url)) {
                    num_shorts++;
                }
            });
            if (num_thumb > 0 && num_thumb == num_shorts) {
                $(elem).detach();
            }
        });
    }
    static remove_whole_header() {
        const t_reel = YoutubeUtil.get_reel_shelf_header_tag();
        YoutubeShortsFilter.remove_whole_header_core(t_reel);
        const t_rich = YoutubeUtil.get_rich_shelf_header_tag();
        YoutubeShortsFilter.remove_whole_header_core(t_rich);
    }


    static each_slim_videos2(tag, do_func) {
        const t_shorts = YoutubeShortsFilter.TAG_SHORTS_V2();
        $(tag).each((inx, shelf)=> {
            $(shelf).find(t_shorts).each((inx, elem)=> {
                do_func(elem);
            });
        });
    }
    /*!
     *  @brief  short動画群にフィルタをかける
     *  @note   "ホーム"、"ゲーム"などに差し込まれるshort動画用
     *  @note   Ver2/24年8月末頃の構成変更対応版
     */
    filtering_slim_videos2(tag) {
        YoutubeShortsFilter.each_slim_videos2(tag, (elem)=>{
            const elem_title = $(elem).find("h3");
            const elem_tt_a = $(elem_title).find("a");
            if (elem_tt_a.length == 0) {
                return;
            }
            const url = $(elem_tt_a).attr("href");
            const hash = YoutubeUtil.get_video_hash_by_link(url);
            const marker = YoutubeUtil.get_filtered_marker(elem);
            if (marker != null && hash == marker) {
                return;
            }
            YoutubeUtil.remove_filtered_marker(elem);
            //    
            const renderer_root = YoutubeShortsFilter.search_renderer_root2(elem);
            if (renderer_root.length == 0) {
                return;
            }
            YoutubeUtil.remove_channel_name(renderer_root);
            YoutubeUtil.remove_renderer_node_channel_id(renderer_root);
            //
            const elem_tt_span = $(elem_title).find("span");
            if (elem_tt_span.length == 0) {
                return;
            }
            const title = $(elem_tt_span).text();
            if (this.storage.title_filter(title)) {
                $(renderer_root).detach();
                return;
            }
            const dc = this.data_counter;
            const ret = dc.filtering_renderer_node_by_channel_info_or_entry_request(
                            renderer_root,
                            hash,
                            title,
                            this.storage);
            if (!ret) {
                YoutubeUtil.set_filtered_marker(elem, hash);
            }
        });
    }
    /*!
     *  @brief  short動画フィルタ(動画ID)
     *  @param  video_id        動画ID
     *  @note   動画情報(json)取得完了通知後処理から呼ばれる
     */
    filtering_slim_video_by_video_id2_core(tag, video_id) {
        YoutubeShortsFilter.each_slim_videos2(tag, (elem)=> {
            const elem_title = $(elem).find("h3");
            const elem_tt_a = $(elem_title).find("a");
            if (elem_tt_a.length == 0) {
                return true;
            }
            const url = $(elem_tt_a).attr("href");
            const hash = YoutubeUtil.get_video_hash_by_link(url);
            if (hash != video_id) {
                return true;
            }
            const renderer_root = YoutubeShortsFilter.search_renderer_root2(elem);
            if (renderer_root.length > 0) {
                const title = $(elem_title).text();
                const dc = this.data_counter;
                dc.filtering_renderer_node_by_channel_info_or_entry_request(
                    renderer_root,
                    video_id,
                    title,
                    this.storage);
            }
            return false;
        });
    }
    filtering_slim_video_by_video_id2(video_id) {
        const t_rich = YoutubeUtil.get_rich_shelf_header_tag();
        this.filtering_slim_video_by_video_id2_core(t_rich, video_id);
        const t_reel = YoutubeUtil.get_reel_shelf_header_tag();
        this.filtering_slim_video_by_video_id2_core(t_reel, video_id);
        const t_reel2 = YoutubeUtil.get_reel_shelf_header2_tag();
        this.filtering_slim_video_by_video_id2_core(t_reel2, video_id);
        const t_gs_vm = YoutubeShortsFilter.TAG_GRID_SHELF_VM();
        this.filtering_slim_video_by_video_id2_core(t_gs_vm, video_id);
        const t_grid = YoutubeUtil.get_rich_grid_header_tag();
        this.filtering_slim_video_by_video_id2_core(t_grid, video_id);
    }
    /*!
     *  @brief  short動画(slim形式)のマーカーをクリアする
     *  @note   ContextMenu用
     *  @note   Ver2/24年8月末頃の構成変更対応版
     */
    clear_slim_videos_marker2(tag) {
        YoutubeShortsFilter.each_slim_videos2(tag, (elem)=> {
            YoutubeUtil.remove_filtered_marker(elem);
        });
    }


    /*!
     *  @brief  short動画フィルタ
     *  @param  elem        親ノード
     *  @param  tag_title   動画タイトルタグ
     *  @param  video_id    動画ID
     *  @retval true        処理打ち切りまたは要素削除
     *  @note   チャンネル名表記が省略されてるタイプ
     */
    filtering_slim_video(elem, tag_title, video_id) {
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
        const dc = this.data_counter;
        return dc.filtering_renderer_node_by_channel_info_or_entry_request(
                    renderer_root,
                    video_id,
                    title,
                    this.storage);
    }

    /*!
     *  @brief  short動画(slim形式)にdo_funcを実行
     */
    each_slim_videos(tag, do_func) {
        const dismissible_tag_short = this.dismissible_tag + tag;
        $(dismissible_tag_short).each((inx, elem)=> {
            const tag_title = "#video-title";
            const tag_thumbnail = "a#thumbnail";
            do_func(elem, tag_title, tag_thumbnail);
        });
    }
    /*!
     *  @brief  short動画群にフィルタをかける
     *  @note   "ホーム"、"ゲーム"などに差し込まれるshort動画用
     */
    filtering_slim_videos(tag) {
        if (this.dismissible_tag == null || this.dismissible_tag == "") {
            this.dismissible_tag = YoutubeUtil.get_div_dismissible();
        }
        this.each_slim_videos(tag, (elem, tag_title, tag_thumbnail)=> {
            const marker = YoutubeUtil.get_filtered_marker(elem);
            const hash = YoutubeUtil.get_video_hash(elem, tag_thumbnail);
            if (marker != null && hash == marker) {
                return;
            }
            YoutubeUtil.remove_filtered_marker(elem);
            //
            if (this.filtering_slim_video(elem, tag_title, hash)) {
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
    filtering_slim_video_by_video_id_core(tag, video_id) {
        this.each_slim_videos(tag, (elem, tag_title, tag_thumbnail)=> {
            const hash = YoutubeUtil.get_video_hash(elem, tag_thumbnail);
            if (hash != video_id) {
                return true;
            }
            const renderer_root = YoutubeUtil.search_renderer_root($(elem));
            const elem_title = $(elem).find(tag_title);
            if (renderer_root.length > 0 && elem_title.length > 0) {
                const title = $(elem_title).text();
                const dc = this.data_counter;
                dc.filtering_renderer_node_by_channel_info_or_entry_request(
                    renderer_root,
                    video_id,
                    title,
                    this.storage);
            }
            return false;
        });
    }
    filtering_slim_video_by_video_id(video_id) {
        const tag_grid = YoutubeShortsFilter.TAG_GRID_SLIM_MEDIA();
        this.filtering_slim_video_by_video_id_core(tag_grid, video_id);
        const tag_reel = YoutubeShortsFilter.TAG_REEL_RENDERER();
        this.filtering_slim_video_by_video_id_core(tag_reel, video_id);
    }
    /*!
     *  @brief  short動画(slim形式)のマーカーをクリアする
     *  @note   ContextMenu用
     */
    clear_slim_videos_marker(tag) {
        this.each_slim_videos(tag, (elem)=> {
            YoutubeUtil.remove_filtered_marker(elem);
        });
    }

    static get_title(elem) {
        let e_title = null;
        const e_tt_parent = $(elem).find("yt-shorts-video-title-view-model")
        if (e_tt_parent.length == 1) {
            e_title = $(e_tt_parent).find("h2");
        } else {
            e_title = $(elem).find("h2.title");
        }
        if (e_title.length <= 0) {
            return "";
        } else {
            return text_utility.remove_blank_line_and_head_space($(e_title).text());
        }    
    }
    static get_channel_elem(elem) {
        return $(elem).find("yt-reel-channel-bar-view-model");
    }
    static get_author_url(elem) {
        let e_channel = null;
        const e_ch_parent = YoutubeUtil.get_short_reel_channel_elem(elem);
        if (e_ch_parent.length == 1) {
            e_channel = e_ch_parent;
        } else {
            e_channel = $(elem).find("div#channel-info");
        }
        if (e_channel.length <= 0) {
            return null;
        } else {
            return $($(e_channel).find("a")[0]).attr("href");
        }
    }
    static set_channel_name(elem, name) {
        const e_channel = YoutubeUtil.get_short_reel_channel_elem(elem);
        if (e_channel.length != 1) {
            return;
        }
        const e_a = $(e_channel).find("a");
        if (e_a.length == 1) {
            $(e_a).text(name);
        }
    }
    static clear_channel_name(elem) {
        YoutubeShortsFilter.set_channel_name(elem, "");
    }

    static detach_suggestion(elem, storage) {
        if (storage.is_remove_suggestion()) {
            $(elem).find("yt-shorts-suggested-action-view-model").each((inx, sgt)=>{
                $(sgt).detach();
            });
        }
    }

    static s_get_video_info_title(elem) {
        const e = $(elem).find("h2.ytShortsVideoTitleViewModelShortsVideoTitle");
        if (e.length == 0) {
            return null;
        }
        return text_utility.remove_formating_code(
            text_utility.remove_blank_line_and_head_space($(e).text()));
    }
    static s_get_thumbnail(elem) {
        return $(elem).find("div.reel-video-in-sequence-thumbnail");
    }
    static s_get_video_id_from_thumbnail(elem) {
        const thumb = YoutubeShortsFilter.s_get_thumbnail(elem);
        if (thumb.length == 0) {
            return null;
        }
        const jpg = $(thumb).attr("style");
        if (jpg == null) {
            return null;
        }
        const work = jpg.split("/");
        if (work.length < 2) {
            return null;
        }
        return work[work.length-2];
    }
    static s_get_video_id_from_title(elem) {
        const title_link = $(elem).find("a.ytp-title-link");
        if (title_link.length == 0) {
            return null;
        }
        const link = $(title_link).attr("href");
        if (link == null) {
            return null;
        }
        return YoutubeUtil.cut_short_movie_hash(link);
    }
    static s_get_player_container(elem) {
        return $(elem).find(YoutubeShortsFilter.TAG_PLAYER_CONTAINER());
    }

    static s_get_active_reel() {
        let act_reel = null;
        if (YoutubeShortsFilter.B_REEL_NEW == false) {
            $(YoutubeShortsFilter.TAG_SHORTS_REEL()).each((inx, elem)=> {
                if ($(elem).attr("is-active") == null) {
                    return true;
                }
                act_reel = elem;
                return false;
            });
            if (act_reel != null) {
                return act_reel;
            }
        }
        const vid = YoutubeUtil.cut_short_movie_hash(location.href);
        $(YoutubeShortsFilter.TAG_SHORTS_REEL_NEW()).each((inx, elem)=> {
            YoutubeShortsFilter.B_REEL_NEW = true;
            // is-activeでのチェックが出来なくなった
            if (YoutubeShortsFilter.ACTIVE_REEL_ID != null) {
                if ($(elem).attr("id") != YoutubeShortsFilter.ACTIVE_REEL_ID) {
                    return true;
                }
            } else {
                if (YoutubeShortsFilter.PREV_ACTIVE_REEL_ID != null) {
                    if ($(elem).attr("id") == YoutubeShortsFilter.PREV_ACTIVE_REEL_ID) {
                        return true;
                    }
                }
                //
                const r_vid = $(elem).attr("vid");
                // URLから得られる動画IDと記入済みvideo_idの一致を見る
                if (r_vid == null || r_vid != vid) {
                    // URLから得られる動画IDとサムネから得られる動画IDの一致を見る
                    const thumb_vid
                        = YoutubeShortsFilter.s_get_video_id_from_thumbnail(elem);
                    if (thumb_vid != null) {
                        if (thumb_vid != vid) {
                            return true;
                        }
                    } else {
                        // サムネイルがない場合はtitle-linkから動画IDを得る
                        const title_vid
                            = YoutubeShortsFilter.s_get_video_id_from_title(elem);
                        if (title_vid == null || title_vid != vid) {
                            return true;
                        }
                    }
                }
            }
            act_reel = elem;
            YoutubeShortsFilter.ACTIVE_REEL_ID = $(elem).attr("id");
            return false;
        });
        return act_reel;
    }
    static get_active_player_container() {
        const act_reel = YoutubeShortsFilter.s_get_active_reel();
        if (act_reel == null) {
            return null;
        }
        const act_pl_container = YoutubeShortsFilter.s_get_player_container(act_reel);
        if (act_pl_container.length == 0) {
            return null;
        }
        return act_pl_container;
    }
    static get_active_volume_ctrl() {
        const act_reel = YoutubeShortsFilter.s_get_active_reel();
        if (act_reel == null) {
            return null;
        }
        return $(act_reel).find("desktop-shorts-volume-controls");
    }

    static get_next_reel() {
        const act_reel = YoutubeShortsFilter.s_get_active_reel();
        if (act_reel == null) {
            return null;
        }
        return $(act_reel).next();
    }
    static get_next_player_container() {
        const next_reel = YoutubeShortsFilter.get_next_reel();
        if (next_reel == null) {
            return null;
        }
        const next_pl_container = YoutubeShortsFilter.s_get_player_container(next_reel);
        if (next_pl_container.length == 0) {
            return null;
        }
        return next_pl_container;
    }

    static s_is_reel_detached(reel_id) {
        if (!YoutubeShortsFilter.B_REEL_NEW) {
            return false;
        }
        let b_detached = false;
        $(YoutubeShortsFilter.TAG_SHORTS_REEL_NEW()).each((inx, elem)=> {
            if ($(elem).attr("id") != reel_id) {
                return true;
            } else {
                b_detached = YoutubeShortsFilter.is_detached(elem);
                return false;
            }
        });
        return b_detached;
    }

    static is_end_video_filtering() {
        const act_reel = YoutubeShortsFilter.s_get_active_reel();
        if (act_reel == null) {
            return false;
        }
        return $(act_reel).attr("channel_id") != null ||
               YoutubeShortsFilter.is_detached(act_reel);
    }
    static is_detached(reel) {
        return $(reel).attr("rmv") != null || reel.children.length == 0;
    }    
    static is_active_detached() {
        const act_reel = YoutubeShortsFilter.s_get_active_reel();
        if (act_reel == null) {
            return false;
        }
        return YoutubeShortsFilter.is_detached(act_reel);
    }
    static detach_reel_video(reel) {
        if (YoutubeShortsFilter.is_detached(reel)) {
            return;
        }
        $(reel).attr("rmv", "");
        HTMLUtil.detach_children_all(reel);
    }

    static set_active_viewed_mark() {
        const reel = YoutubeShortsFilter.s_get_active_reel();
        if (reel != null) {
            $(reel).attr(YoutubeShortsFilter.TAG_VIEWED_MARKER, "");
        }
    }
    static check_viewed_mark(elem) {
        return $(elem).attr(YoutubeShortsFilter.TAG_VIEWED_MARKER) != null;
    }
    static check_active_viewed_mark() {
        const reel = YoutubeShortsFilter.s_get_active_reel();
        if (reel == null) {
            return false;
        }
        return YoutubeShortsFilter.check_viewed_mark(reel);
    }
    /*!
     *  @brief  動画(ショート)にフィルタをかける
     */
    filtering_video() {
        const title = $("title").text();
        const detach_func = YoutubeShortsFilter.detach_reel_video;
        const act_reel = YoutubeShortsFilter.s_get_active_reel();
        if (act_reel == null) {
            return;
        }
        if (YoutubeShortsFilter.is_detached(act_reel)) {
            HTMLUtil.detach_children_all(act_reel);
            return;
        }
        const vid = YoutubeUtil.cut_short_movie_hash(location.href);
        if ($(act_reel).attr("vid") == null) {
            $(act_reel).attr("vid", vid);
        }
        if (this.storage.title_filter(title)) {
            detach_func(act_reel);
            return;
        }
        // 動画情報の混在(更新遅れ)回避
        const author_url = YoutubeShortsFilter.get_author_url(act_reel);
        const info_title = YoutubeShortsFilter.s_get_video_info_title(act_reel);
        if (info_title == null) {
            YoutubeShortsFilter.clear_channel_name(act_reel);
            return;
        }
        if (author_url == null || author_url == "") {
            return;
        }
        if (this.reel_info.is_empty()) {
            this.reel_info.update(author_url, info_title);
            // 8sec待って更新されなかったら諦める
            this.reel_info.set_timer(8000);
            YoutubeShortsFilter.clear_channel_name(act_reel);
            return;
        } else {
            if (this.reel_info.is_same(author_url, info_title)
                && title.indexOf(info_title) != 0
                && !this.reel_info.is_first()
                && !this.reel_info.b_force) {
                YoutubeShortsFilter.clear_channel_name(act_reel);
                return;
            }
            this.reel_info.clear_timer();
        }

        //
        const channel_code = YoutubeUtil.cut_channel_id(author_url);
        const channel = this.data_counter.get_channel_name(channel_code);
        if (channel != null) {
            if (this.storage.channel_filter(channel, title)) {
                detach_func(act_reel);
                return;
            }
            const channel_work = YoutubeUtil.get_channel_name(act_reel);
            if (channel_work != channel) {
                YoutubeUtil.set_channel_name(act_reel, channel);
            }
            const channel_work_neo = YoutubeUtil.get_short_reel_channel_name(act_reel);
            if (channel_work_neo != null && channel_work_neo != channel) {
                YoutubeShortsFilter.set_channel_name(act_reel, channel);
            }
        }
        const channel_id
            = this.data_counter.get_channel_id_from_author_url_or_entry_request(
                author_url);
        if (!YoutubeFilteringUtil.filtering_renderer_node_by_channel_id(
            act_reel, channel_id, title, detach_func, this.storage)) {
            if (channel_id != null) {
                YoutubeShortsFilter.detach_suggestion(act_reel, this.storage);
                this.no_disp_finalize();
                this.hide_next_video(); // すっぽ抜け対策
            }
        }
    }
    /*!
     *  @brief  short動画フィルタ(チャンネルコード)
     *  @param  channel_code    ユーザ名/カスタムチャンネル名/ハンドル
     *  @param  channel_id      チャンネルID
     *  @param  chk_func        チャンネル判別関数
     *  @note   動画更新情報(xml)またはチャンネル情報(html)↓
     *  @note   取得完了通知後処理から呼ばれる
     */
    filtering_video_by_channel_code(channel_code, channel_id, chk_func) {
        const act_reel = YoutubeShortsFilter.s_get_active_reel();
        if (act_reel == null) {
            return;
        }
        const author_url = YoutubeShortsFilter.get_author_url(act_reel);
        const title = YoutubeShortsFilter.get_title(act_reel);
        if (author_url == null || author_url == "" || title == "") {
            return;
        }
        if (!chk_func(author_url)) {
            return;
        }
        if (channel_code != YoutubeUtil.cut_channel_id(author_url)) {
            return;
        }
        if (this.storage.channel_id_filter(channel_id, title)) {
            YoutubeShortsFilter.detach_reel_video(act_reel);
            return;
        }
        const channel = this.data_counter.get_channel_name(channel_code);
        if (channel != null) {
            if (this.storage.channel_and_title_filter(channel, title)) {
                YoutubeShortsFilter.detach_reel_video(act_reel);
                return;
            } else {
                YoutubeShortsFilter.set_channel_name(act_reel, channel);
                YoutubeUtil.set_channel_name(act_reel, channel);
            }
        }
        YoutubeShortsFilter.detach_suggestion(act_reel, this.storage);
        this.no_disp_finalize();
        this.hide_next_video(); // すっぽ抜け対策
        YoutubeUtil.set_renderer_node_channel_id(act_reel, channel_id);
    }


    /*!
     *  @brief  ショート動画再生表示/非表示変更
     */
    show_video() {
        const pl_container = YoutubeShortsFilter.get_active_player_container();
        if (pl_container == null) {
            return;
        };
        const v_cont = $(pl_container).find("div.html5-video-container");
        const video = $(v_cont).find("video");
        if (video.length == 1) {
            $(video).attr("style", this.video_style);
            if ($(pl_container).is(":hidden")) {
                $(pl_container).show();
            }
        }
    }
    hide_next_video() {
        if (!this.storage.is_hidden_start()) {
            return;
        }        
        const reel = YoutubeShortsFilter.get_next_reel();
        if (reel == null) {
            return false;
        }
        // フィルタ済みなら消さない(↑戻り用)
        if (YoutubeShortsFilter.check_viewed_mark(reel)) {
            return true;
        }
        if (!YoutubeShortsFilter.B_REEL_NEW) {
            const pl_container = YoutubeShortsFilter.get_next_player_container();
            if (pl_container == null) {
                return false;
            }
            if ($(pl_container).is(":visible")) {
                $(pl_container).hide();
            }
        }
        return true;
    }
    hide_active_video() {
        const reel = YoutubeShortsFilter.s_get_active_reel();
        if (reel == null) {
            return false;
        }
        if (YoutubeShortsFilter.is_detached(reel) ||
            YoutubeShortsFilter.check_viewed_mark(reel)) {
            return true;
        }
        const pl_container = YoutubeShortsFilter.get_active_player_container();
        if (pl_container == null) {
            return false;
        }
        $(pl_container).hide();
        return true;
    }
    /*!
     *  @note   0. player_containerをhideする
     *  @note   1. 親reel-video_rendererごとactive_reelに移す
     */
    static hide_and_transport_reel_video_renderer(elem, act_reel) {
        const reel = $(elem).find("ytd-reel-video-renderer.style-scope.ytd-shorts");
        if (reel.length > 0) {
            const pr_plc = YoutubeShortsFilter.s_get_player_container(reel);
            if ($(pr_plc).is(":visible")) {
                $(pr_plc).hide();
            }
            $(reel).prependTo(act_reel);
            return true;
        } else {
            return false;
        }
    }

    static check_player_mode(mode) {
        const act_reel = YoutubeShortsFilter.s_get_active_reel();
        if (act_reel == null) {
            return false;
        }        
        const player = $(act_reel).find("div.html5-video-player");
        if (player.length != 1) {
            return false;
        }
        switch (mode) {
        case YoutubeShortsFilter.PL_PAUSE_MODE:
            return player[0].className.indexOf("paused-mode") >= 0;
        case YoutubeShortsFilter.PL_PLAYING_MODE:
            return player[0].className.indexOf("playing-mode") >= 0;
        default:
            return false;
        }
    }
    static click_pause_button() {
        const act_reel = YoutubeShortsFilter.s_get_active_reel();
        if (act_reel == null) {
            return false;
        }
        const bt_shape = $(act_reel).find("yt-button-shape#play-pause-button-shape");
        if (bt_shape.length != 1) {
            return false;
        }
        const button = $(bt_shape).find("button");
        if (button.length != 1) {
            return false;
        }
        $(button).trigger("click");
        return true;
    }

    /*!
     *  @brief  ショート動画再生一時停止/再生
     */
    pause_video() {
        if (YoutubeShortsFilter.is_active_detached()) {
            return true;
        }
        if (YoutubeShortsFilter.check_player_mode(YoutubeShortsFilter.PL_PLAYING_MODE)) {
            if (YoutubeShortsFilter.check_active_viewed_mark()) {
                return true;
            }            
            return YoutubeShortsFilter.click_pause_button();
        } else {
            return false;
        }
    }
    play_video() {
        if (YoutubeShortsFilter.check_player_mode(YoutubeShortsFilter.PL_PAUSE_MODE)) {
            YoutubeShortsFilter.click_pause_button();
        }
    }

    callback_observing_element_change() {
        if (this.video_style == null || this.video_style == "") {
            const cont = YoutubeShortsFilter.get_active_player_container();
            if (cont != null) {
                const video = $(cont).find("div.html5-video-container").find("video");
                if (video.length == 1) {
                    const video_style = $(video).attr("style");
                    if (video_style != null) {
                        const left = video_style.indexOf("left");
                        if (left > 0) {
                            this.video_style = video_style.substring(0, left-1);
                        } else {
                            this.video_style = video_style;
                        }
                    }
                }
            }
        }
        this.no_disp_initialize();
    }

    no_disp_finalize() {
        if (this.no_disp_mode != YoutubeShortsFilter.NO_DISP_WAIT) {
            return;
        }
        this.show_video();
        this.play_video();
        this.no_disp_mode = YoutubeShortsFilter.NO_DISP_COMPLETE;
    }

    no_disp_initialize() {
        if (this.no_disp_mode == YoutubeShortsFilter.NO_DISP_INIT) {
            if (this.pause_video()) {
                this.no_disp_mode = YoutubeShortsFilter.NO_DISP_PAUSE;
            }
            if (this.hide_next_video() && this.hide_active_video()) {
                if (this.no_disp_mode == YoutubeShortsFilter.NO_DISP_INIT) {
                    this.no_disp_mode = YoutubeShortsFilter.NO_DISP_HIDE;
                } else {
                    YoutubeShortsFilter.set_active_viewed_mark();
                    this.no_disp_mode = YoutubeShortsFilter.NO_DISP_WAIT;
                }
            }
        } else
        if (this.no_disp_mode == YoutubeShortsFilter.NO_DISP_HIDE) {
            if (this.pause_video()) {
                YoutubeShortsFilter.set_active_viewed_mark();
                this.no_disp_mode = YoutubeShortsFilter.NO_DISP_WAIT;
            }
        } else
        if (this.no_disp_mode == YoutubeShortsFilter.NO_DISP_PAUSE) {
            if (this.hide_next_video() && this.hide_active_video()) {
                YoutubeShortsFilter.set_active_viewed_mark();
                this.no_disp_mode = YoutubeShortsFilter.NO_DISP_WAIT;
            }
        } else
        if (this.no_disp_mode == YoutubeShortsFilter.NO_DISP_WAIT) {
            if (YoutubeShortsFilter.is_active_detached()) {
                this.no_disp_mode = YoutubeShortsFilter.NO_DISP_COMPLETE;
            }
        } else
        if (this.no_disp_mode == YoutubeShortsFilter.NO_DISP_NONE) {
            // 最初に開いたshort動画専用処理
            if (!YoutubeShortsFilter.check_active_viewed_mark() &&
                YoutubeShortsFilter.is_end_video_filtering()) {
                YoutubeShortsFilter.set_active_viewed_mark();
            }
        }
    }

    player_initialize() {
        if (!this.storage.is_hidden_start()) {
            return;
        }
        this.no_disp_mode = YoutubeShortsFilter.NO_DISP_INIT;
        this.no_disp_initialize();
    }
    player_finalize() {
        this.no_disp_mode = YoutubeShortsFilter.NO_DISP_NONE;
    }

    get_active_reel() {
        return YoutubeShortsFilter.s_get_active_reel();
    }

    is_end_filtering() {
        switch (this.no_disp_mode) {
        case YoutubeShortsFilter.NO_DISP_NONE:
            return YoutubeShortsFilter.is_end_video_filtering();
        case YoutubeShortsFilter.NO_DISP_COMPLETE:
            return true;
        default:
            return false;
        }
    }

    fill_in_thumnail() {
        if (!this.storage.is_hidden_start()) {
            return true;
        }
        const t_sh_reel = $(YoutubeShortsFilter.TAG_SHORTS_REEL_NEW());
        if (t_sh_reel.length == 0) {
            return false;
        }
        $(t_sh_reel).each((inx, elem)=> {
            const tag = "div.reel-video-in-sequence-thumbnail.style-scope.ytd-shorts";
            const thumb = $(elem).find(tag);
            if (thumb.length != 0) {
                thumb[0].className = "reel-video-in-sequence-thumbnail";
            }
        });
        return true;
    }
    call_fill_in_thumbnail() {
        if (!this.fill_in_thumnail()) {
            if (this.fill_in_thumb_timer != null) {
                return;
            }
            this.fill_in_thumb_timer = setInterval(()=> {
                if (this.fill_in_thumnail()) {
                    clearInterval(this.fill_in_thumb_timer);
                    this.fill_in_thumb_timer = null;
                }
            }, 333); /*1/3sec*/
        }
    }
    relocate_video_renderer() {
        if (!this.storage.is_hidden_start()) {
            return true;
        }        
        const act_reel = YoutubeShortsFilter.s_get_active_reel();
        if (act_reel == null) {
            return false;
        }
        const prev = $(act_reel).prev();
        if (YoutubeShortsFilter.hide_and_transport_reel_video_renderer(prev, act_reel)) {
            return true;
        }
        const next = $(act_reel).next();
        if (YoutubeShortsFilter.hide_and_transport_reel_video_renderer(next, act_reel)) {
            return true;
        }
        // 既にact-reelに移ってる
        if (YoutubeShortsFilter.is_detached(act_reel)) {
            HTMLUtil.detach_children_all(act_reel);
        }
        return true; // 移動が間に合わなくともtrueを返す
    }
    static STATE_MUTE_BUTTON_NONE = 0;
    static STATE_MUTE_BUTTON_MUTED = 1;
    static STATE_MUTE_BUTTON_COMP = 2;
    switch_mute_button() {
        const vol_ctrl = YoutubeShortsFilter.get_active_volume_ctrl();
        if (vol_ctrl == null || vol_ctrl.length == 0) {
            return false;
        }
        const button = $(vol_ctrl).find("button");
        const slider = $(vol_ctrl).find("input");
        if (button.length == 0 || slider.length == 0) {
            return false;
        }
        const value = slider.attr("aria-valuetext");
        if (value == null) {
            return;
        }
        const b_muted = value.indexOf("muted") > 0;
        switch (this.state_mute_button) {
        case YoutubeShortsFilter.STATE_MUTE_BUTTON_NONE:
            if (b_muted) {
                return true;
            }
            $(button).trigger("click");
            this.state_mute_button = YoutubeShortsFilter.STATE_MUTE_BUTTON_MUTED;
            break;
        case YoutubeShortsFilter.STATE_MUTE_BUTTON_MUTED:
            this.state_mute_button = YoutubeShortsFilter.STATE_MUTE_BUTTON_COMP;
            if (b_muted) {
                $(button).trigger("click");
            }
            return true;
        }
        return false;
    }
    call_switch_mute_button() {
        if (!YoutubeShortsFilter.s_is_reel_detached(
                YoutubeShortsFilter.PREV_ACTIVE_REEL_ID)) {
            if (this.switch_mute_button_timer != null) {
                clearInterval(this.switch_mute_button_timer);
                this.switch_mute_button_timer = null;
            }
            return;
        } else {
            if (this.switch_mute_button_timer != null) {
                return;
            }
        }
        this.switch_mute_button_timer = setInterval(()=> {
            if (this.switch_mute_button()) {
                clearInterval(this.switch_mute_button_timer);
                this.switch_mute_button_timer = null;
            }
        }, 17); /*1/60sec*/
    }    

    callback_domloaded() {
        this.call_fill_in_thumbnail();
    }
    /*!
     *  @param  shortsに入った際に行う処理
     */
    open() {
        YoutubeShortsFilter.PREV_ACTIVE_REEL_ID = null;
        YoutubeShortsFilter.ACTIVE_REEL_ID = "0";
        this.call_fill_in_thumbnail();
    }
    /*!
     *  @param  short→short移動時に行う処理
     */
    turn() {
        YoutubeShortsFilter.PREV_ACTIVE_REEL_ID = YoutubeShortsFilter.ACTIVE_REEL_ID;
        YoutubeShortsFilter.ACTIVE_REEL_ID = null;
        this.reel_info.reset();
        if (!this.relocate_video_renderer()) {
            if (this.relocate_timer == null) {
                this.relocate_timer = setInterval(()=> {
                    if (this.relocate_video_renderer()) {
                        clearInterval(this.relocate_timer);
                        this.relocate_timer = null;
                    }
                }, 33); /* 1/30sec */
            }
        }
        this.call_fill_in_thumbnail();
        this.state_mute_button = YoutubeShortsFilter.STATE_MUTE_BUTTON_NONE;
        this.call_switch_mute_button();
    }

    /*!
     *  @param storage  ストレージインスタンス
     */
    constructor(storage, data_counter) {
        this.storage = storage;
        this.data_counter = data_counter;
        this.dismissible_tag = null;
        this.no_disp_mode = YoutubeShortsFilter.NO_DISP_NONE;
        this.video_style = "";
        this.fill_in_thumb_timer = null;
        this.relocate_timer = null;
        this.reel_info = new ShortReelInfo();
        this.state_mute_button = YoutubeShortsFilter.STATE_MUTE_BUTTON_NONE;
        this.switch_mute_button_timer = null;
    }
}
