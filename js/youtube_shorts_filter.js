/*!
 *  @brief  YoutubeShortsフィルタ
 */
class ShortScrollInfo {
    constructor(func) {
        this.top = 0;
        this.half = 0;
        this.height = 0;
        this.b_first = false;
        this.b_added_event_listener = false;
        this.callback = func;
    }

    static get_shorts_container() {
        return $("div#shorts-container");
    }

    init_param() {
        const sc = ShortScrollInfo.get_shorts_container();
        if (sc.length != 1) {
            return null;
        }
        this.top = sc[0].scrollTop;
        this.height = sc[0].offsetHeight;
        this.half = this.height * 0.5;
        this.b_first = true;
        return sc;
    }
    initialize() {
        if (this.b_added_event_listener) {
            return;
        }
        const sc = this.init_param();
        if (sc == null) {
            return;
        }
        sc[0].addEventListener('scroll', this.callback);
        this.b_added_event_listener = true;
    }
    finalize() {
        if (!this.b_added_event_listener) {
            return;
        }
        const sc = ShortScrollInfo.get_shorts_container();
        sc[0].removeEventListener('scroll', this.callback);
        this.b_added_event_listener = false;
    }

    get_scroll_now() {
        const sc = ShortScrollInfo.get_shorts_container();
        return sc[0].scrollTop;
    }
    get_diff() {
        return this.get_scroll_now() - this.top;
    }
    is_more_than_half() {
        return Math.abs(this.get_diff()) > this.half;
    }
}
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

    static ACTIVE_REEL_ID = "0";
    static B_REEL_NEW = false;
    static B_IN_SCROLL = false;
    static SCROLL_TERMINATE_DIFF = 16;

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
        const e_ch_parent = YoutubeUtil.get_short_reel_channel_elem(elem);
        if (e_ch_parent.length == 1) {
            return e_ch_parent;
        } else {
            return $(elem).find("div#channel-info");
        }
    }
    static get_author_url(elem) {
        const e_channel = YoutubeShortsFilter.get_channel_elem(elem);
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

    static TAG_OVERALY_DENSITY = "overlay-density";
    static s_get_overlay_density(reel) {
        return $(reel).attr(YoutubeShortsFilter.TAG_OVERALY_DENSITY);
    }
    static s_set_overlay_density(reel, ovd) {
        if (ovd == null) {
            return;
        }
        if (YoutubeShortsFilter.s_get_overlay_density(reel) == ovd) {
            return;
        }
        $(reel).attr(YoutubeShortsFilter.TAG_OVERALY_DENSITY, ovd);
    }

    static s_get_video_info_title(elem) {
        const e = $(elem).find("h2.ytShortsVideoTitleViewModelShortsVideoTitle");
        if (e.length == 0) {
            return null;
        }
        return text_utility.remove_formating_code(
            text_utility.remove_blank_line_and_head_space($(e).text()));
    }
    static s_get_player_container(elem) {
        return $(elem).find(YoutubeShortsFilter.TAG_PLAYER_CONTAINER());
    }

    static s_get_reel(id) {
        let reel = null;
        $(YoutubeShortsFilter.TAG_SHORTS_REEL_NEW()).each((inx, elem)=> {
            if ($(elem).attr("id") == id) {
                reel = elem;
                return false;
            }
            return true;
        });
        return reel;
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
        const new_reels = $(YoutubeShortsFilter.TAG_SHORTS_REEL_NEW());
        if (new_reels.length == 0) {
            return act_reel;
        }
        YoutubeShortsFilter.B_REEL_NEW = true;
        if (YoutubeShortsFilter.ACTIVE_REEL_ID != null) {
            // is-activeでのチェックが出来なくなった
            $(new_reels).each((inx, elem)=> {
                if ($(elem).attr("id") != YoutubeShortsFilter.ACTIVE_REEL_ID) {
                    return true;
                }
                act_reel = elem;
                return false;
            });
            return act_reel;
        }
        if (YoutubeShortsFilter.B_IN_SCROLL) {
            return act_reel;
        }
        const st_container = ShortScrollInfo.get_shorts_container();
        const scroll_pos = st_container[0].scrollTop;
        $(YoutubeShortsFilter.TAG_SHORTS_REEL_NEW()).each((inx, elem)=> {
            if (act_reel == null) {
                act_reel = elem;
            } else {
                const most_near = Math.abs(scroll_pos-act_reel.offsetTop);
                const near = Math.abs(scroll_pos-elem.offsetTop);
                if (near < most_near) {
                    act_reel = elem;
                } else {
                    return false;
                }
            }
            return true;
        });
        YoutubeShortsFilter.ACTIVE_REEL_ID = $(act_reel).attr("id");
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

    static count_upper_reel(reel) {
        let cnt = 0;
        while(1) {
            reel = $(reel).prev();
            if (reel.length == 1
             && reel[0].className.indexOf("reel-video-in-sequence-new") != 0) {
                break;
            }
            cnt++;
        }
        return cnt;
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
        return $(reel).attr("rmv") != null;
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

    static is_selected_reel(reel) {
        const st_container = ShortScrollInfo.get_shorts_container();
        if (st_container.length != 1) {
            return false;
        }
        const sc_top = st_container[0].scrollTop;
        const near = sc_top - reel.offsetTop;
        if (near == 0) {
            return true;
        }
        // すっぽ抜け対策
        // 前後のreelよりscroll位置に近ければselectedとみなす
        // ※念の為大幅(reel高以上)に離れてたら弾く
        const near_abs = Math.abs(near);
        if (near_abs > reel.offsetHeight) {
            return false;
        }
        const id = $(reel).attr("id");
        const prev_id = String(parseInt(id)-1);
        const prev_reel = YoutubeShortsFilter.s_get_reel(prev_id);
        if (prev_reel != null) {
            const prev_near_abs = Math.abs(sc_top - prev_reel.offsetTop);
            if (near_abs > prev_near_abs) {
                return false;
            }
        }
        const next_id = String(parseInt(id)+1);
        const next_reel = YoutubeShortsFilter.s_get_reel(next_id);
        if (next_reel != null) {
            const next_near_abs = Math.abs(sc_top - next_reel.offsetTop);
            if (near_abs > next_near_abs) {
                return false;
            }
        }
        return true;
    }
    static is_no_author_reel(reel) {
        const slot = $(reel).find("ytd-ad-slot-renderer");
        return slot.length != 0;
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

    is_in_processing_that_leaving_reel() {
        return this.leaving_reel_timer != null || this.switch_mute_button_timer != null;
    }

    /*!
     *  @brief  動画(ショート)にフィルタをかける
     */
    detach_and_mute(reel) {
        this.finalize_mute_manager(reel);
        YoutubeShortsFilter.detach_reel_video(reel);
    }
    filtering_video() {
        const title = $("title").text();
        const detach_func = this.detach_and_mute.bind(this);
        const act_reel = YoutubeShortsFilter.s_get_active_reel();
        if (act_reel == null) {
            return;
        }
        // 開幕のid0強制注目処理
        if (this.b_force_act_zero) {
            if (!YoutubeShortsFilter.is_selected_reel(act_reel)) {
                return;
            }
            this.b_force_act_zero = false;
        }
        if (YoutubeShortsFilter.is_detached(act_reel)) {
            if (act_reel.children.length > 0) {
                this.finalize_mute_manager(act_reel);
                YoutubeShortsFilter.click_pause_button();
                HTMLUtil.detach_children_all(act_reel);
            }
            return;
        }
        if (this.prev_overlay_density == "1") {
            YoutubeShortsFilter.s_set_overlay_density(act_reel,
                                                      this.prev_overlay_density);
            this.prev_overlay_density = null;
        }
        if (this.is_in_processing_that_leaving_reel()) {
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
        if (this.b_first_init_scr_cb) {
            this.scroll.initialize();
            this.b_first_init_scr_cb = false;
        }
        if (this.storage.title_filter(title)) {
            detach_func(act_reel);
            return;
        }
        if (this.reel_info.is_empty()) {
            this.reel_info.update(author_url, info_title);
            // 2sec待って更新されなかったら諦める
            this.reel_info.set_timer(2048);
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
    show_video_container(pl_container) {
        if (pl_container == null) {
            return;
        };
        const v_cont = $(pl_container).find("div.html5-video-container");
        const video = $(v_cont).find("video");
        if (video.length == 1) {
            if ($(pl_container).is(":hidden")) {
                $(pl_container).show();
            }
            const pl_wrapper = pl_container.parent()[0];
            const style = "width: " + pl_wrapper.clientWidth + "px; "
                        + "height: " + pl_wrapper.clientHeight + "px; left: 0px; top: 0px;";
            $(video).attr("style", style);
        }
    }    
    show_video() {
        this.show_video_container(YoutubeShortsFilter.get_active_player_container());
    }
    hide_next_video() {
        if (YoutubeShortsFilter.B_REEL_NEW) {
            return true;
        }
        if (!this.storage.is_hidden_start()) {
            return true;
        }
        const reel = YoutubeShortsFilter.get_next_reel();
        if (reel == null) {
            return false;
        }
        // フィルタ済みなら消さない(↑戻り用)
        if (YoutubeShortsFilter.check_viewed_mark(reel)) {
            return true;
        }
        const pl_container = YoutubeShortsFilter.get_next_player_container();
        if (pl_container == null) {
            return false;
        }
        HTMLUtl.hide_element(pl_container);
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
        HTMLUtil.hide_element(pl_container);
        return true;
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
        HTMLUtil.click_button(button);
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
    static STATE_MUTE_BUTTON_FAST_MUTE = 0;
    static STATE_MUTE_BUTTON_TIMER_MUTE = 1;
    static STATE_MUTE_BUTTON_MUTED = 2;
    static STATE_MUTE_BUTTON_COMP = 3;
    static get_volume_button(reel) {
        const vol_ctrl = $(reel).find("desktop-shorts-volume-controls");
        if (vol_ctrl.length == 0) {
            return null;
        }
        const button = $(vol_ctrl).find("button");
        const slider = $(vol_ctrl).find("input");
        if (button.length == 0 || slider.length == 0) {
            return null;
        }
        const value = slider.attr("aria-valuetext");
        if (value == null) {
            return null;
        }
        let obj = { button: button, b_muted: value.indexOf("muted") > 0 };
        return obj;
    }
    finalize_mute_manager(reel) {
        const vol_obj = YoutubeShortsFilter.get_volume_button(reel);
        if (vol_obj == null) {
            return;
        }
        if (!vol_obj.b_muted) {
            return;
        }
        if (this.state_mute_button != YoutubeShortsFilter.STATE_MUTE_BUTTON_MUTED) {
            return;
        }
        HTMLUtil.click_button(vol_obj.button);
        this.state_mute_button = YoutubeShortsFilter.STATE_MUTE_BUTTON_COMP;
    }
    switch_mute_button() {
        const act_reel = YoutubeShortsFilter.s_get_active_reel();
        const vol_obj = YoutubeShortsFilter.get_volume_button(act_reel);
        if (vol_obj == null) {
            return;
        }
        switch (this.state_mute_button) {
            case YoutubeShortsFilter.STATE_MUTE_BUTTON_TIMER_MUTE:
                if (vol_obj.b_muted) {
                    return true;
                }
                HTMLUtil.click_button(vol_obj.button);
                this.state_mute_button = YoutubeShortsFilter.STATE_MUTE_BUTTON_MUTED;
                break;
            case YoutubeShortsFilter.STATE_MUTE_BUTTON_MUTED:
                this.state_mute_button = YoutubeShortsFilter.STATE_MUTE_BUTTON_COMP;
                if (vol_obj.b_muted) {
                    HTMLUtil.click_button(vol_obj.button);
                }
                return true;
            case YoutubeShortsFilter.STATE_MUTE_BUTTON_COMP:
                return true;
            default:
                break;
        }
        return false;
    }
    call_switch_mute_button() {
        if (this.switch_mute_button_timer != null) {
            return;
        }
        this.switch_mute_button_timer = setInterval(()=> {
            if (this.switch_mute_button()) {
                clearInterval(this.switch_mute_button_timer);
                this.switch_mute_button_timer = null;
            }
        }, 17); /*1/60sec*/
    }

    /*!
     *  @brief  去りゆくreelのvideo-playerをhide(25年7月以降用)
     *  @note   遷移後にhideしても間に合わない(一瞬見える)
     *  @note   video-playerはreel間で使い回されているため
     *  @note   → video-playerが次の動画に移されるまえにhideすれば間に合う
     *  @note   → スクロールをトリガーにhideする(詳細はShortScrollInfo)
     */
    hide_leaving_reel_video_renderer() {
        if (!this.storage.is_hidden_start()) {
            return true;
        }
        const lv_reel = YoutubeShortsFilter.s_get_reel(this.leaving_reel_id);
        if (lv_reel == null) {
            return false;
        }
        const pl_container = YoutubeShortsFilter.s_get_player_container(lv_reel);
        if (pl_container.length > 0) {
            HTMLUtil.hide_element(pl_container);
        }
        return true;
    }
    /*!
     *  @brief  reel情報更新(25年7月以降用)
     *  @note   video-playerがreel間で使い回されていて切り替わっても
     *  @note   情報(author_url/title)が古いタイミングがある
     *  @note   情報切り替わりを判定するため一つ前の情報を保持しておく
     */
    update_reel_info() {
        const lv_reel = YoutubeShortsFilter.s_get_reel(this.leaving_reel_id);
        if (lv_reel == null) {
            return false;
        }
        if (YoutubeShortsFilter.is_detached(lv_reel)) {
            this.reel_info.reset();
            return true;
        }
        if (YoutubeShortsFilter.is_no_author_reel(lv_reel)) {
            this.reel_info.reset();
            return true;
        }
        const author_url = YoutubeShortsFilter.get_author_url(lv_reel);
        const info_title = YoutubeShortsFilter.s_get_video_info_title(lv_reel);
        if (author_url == null || info_title == null) {
            return false;
        }
        this.reel_info.update(author_url, info_title);
        this.reel_info.b_first = false;
        return true;
    }
    mute_leaving_reel_video_renderer() {
        const lv_reel = YoutubeShortsFilter.s_get_reel(this.leaving_reel_id);
        const vol_obj = YoutubeShortsFilter.get_volume_button(lv_reel);
        if (vol_obj == null) {
            return false;
        }
        if (vol_obj.b_muted) {
            this.state_mute_button = YoutubeShortsFilter.STATE_MUTE_BUTTON_COMP;
            return true;
        }
        HTMLUtil.click_button(vol_obj.button);
        this.state_mute_button = YoutubeShortsFilter.STATE_MUTE_BUTTON_MUTED;
        return true;
    }
    /*!
     *  @brief  reel切替中に行う処理
     */
    process_in_leaving_reel() {
        if (this.scroll.is_more_than_half()) {
            if (!this.b_hide_prev) {
                if (this.hide_leaving_reel_video_renderer()) {
                    this.b_hide_prev = true;
                }
            }
            if (!this.b_update_reel_info) {
                if (this.update_reel_info()) {
                    this.b_update_reel_info = true;
                }
            }
            this.fill_in_thumnail();
            if (this.state_mute_button == YoutubeShortsFilter.STATE_MUTE_BUTTON_FAST_MUTE
                && !this.b_force_act_zero) {
                if (!this.mute_leaving_reel_video_renderer()) {
                    // detach済み等で失敗したらtimer式に切り替える
                    this.state_mute_button
                        = YoutubeShortsFilter.STATE_MUTE_BUTTON_TIMER_MUTE;
                }
            }
        }
        if (this.b_turn_reel
         && this.b_hide_prev
         && this.b_update_reel_info
         && (this.b_force_act_zero
          || this.state_mute_button != YoutubeShortsFilter.STATE_MUTE_BUTTON_FAST_MUTE)) {
            this.complete_process_in_leaving_reel();
        }
    }
    /*!
     *  @brief  reel切替完了時に行う処理
     */
    complete_process_in_leaving_reel() {
        this.b_turn_reel = false;
        clearInterval(this.leaving_reel_timer);
        this.leaving_reel_timer = null;
        //
        if (this.b_force_act_zero) {
            return;
        }
        //
        this.b_hide_prev = false;
        this.b_update_reel_info = false;
        this.call_switch_mute_button();
    }
    static is_upper_limit_reel(leaving_id, next_id) {
        if (next_id < 0 && next_id < parseInt(leaving_id)) {
            const nx_reel = YoutubeShortsFilter.s_get_reel(next_id);
            if (nx_reel != null) {
                const nx1_reel = $(nx_reel).prev();
                return nx_reel.className != nx1_reel[0].className;
            }
        }
        return false;
    }
    static is_prev_upper_limit_reel(leaving_id, next_id) {
        if (next_id < 0 && next_id < parseInt(leaving_id)) {
            const nx_reel = YoutubeShortsFilter.s_get_reel(next_id);
            if (nx_reel != null) {
                const nx1_reel = $(nx_reel).prev();
                const nx2_reel = $(nx1_reel).prev();
                if (nx2_reel.length == 0) {
                    return false;
                }
                return nx1_reel[0].className != nx2_reel[0].className;
            }
        }
        return false;
    }
    remove_extention_tag_in_reels() {
        if (!this.b_turn_reel && this.leaving_reel_timer) {
            return false;
        }
        if (this.observing_scroll_timer) {
            return false;
        }
        $(YoutubeShortsFilter.TAG_SHORTS_REEL_NEW()).each((inx, elem)=> {
            if (YoutubeShortsFilter.ACTIVE_REEL_ID != $(elem).attr("id")) {
                $(elem).removeAttr(YoutubeShortsFilter.TAG_VIEWED_MARKER);
                $(elem).removeAttr("channel_id");
                $(elem).removeAttr("rmv");
            }
        });
        return true;
    }
    /*!
     *  @brief  ショート動画スクロールコールバック
     *  @note   URL変更より早いタイミングでやりたい処理がある
     */
    static SCROLL_HISTORY_NUM = 8;
    is_stop_scroll() {
        const hist_num = YoutubeShortsFilter.SCROLL_HISTORY_NUM;
        if (this.scroll_hist.length != hist_num) {
            return false;
        }
        for (let inx = 1; inx < hist_num; inx++) {
            if (this.scroll_hist[0] != this.scroll_hist[inx]) {
                return false;
            }
        }
        return true;
    }
    push_scroll_pos(pos) {
        const hist_num = YoutubeShortsFilter.SCROLL_HISTORY_NUM;
        this.scroll_hist.push(pos);
        if (this.scroll_hist.length > hist_num) {
            this.scroll_hist.shift();
        }
    }
    callback_scroll_reel() {
        if (this.fullscreenchange) {
            this.fullscreenchange = false;
            this.scroll.init_param();
            return;
        }
        if (this.resize_window) {
            this.resize_window = false;
            this.scroll.init_param();
            return;
        }
        if (this.scroll.b_first) {
            this.scroll.b_first = false;
            return;
        }
        if ($(YoutubeShortsFilter.TAG_SHORTS_REEL_NEW()).length == 0) {
            // shortsページ内でshortsページへ移動しようとした場合
            // 再度openを呼びたいがturnへ行ってしまう
            // scrollが発生するのでここで引っ掛けてopenを呼ぶ
            this.scroll.finalize();
            this.open();
            return;
        }
        this.scroll_hist = [];
        this.leaving_reel_id = YoutubeShortsFilter.ACTIVE_REEL_ID;
        const diff = this.scroll.get_diff();
        if (diff != 0) {
            const scroll_id = parseInt(this.leaving_reel_id);
            if (diff > 0) {
                this.next_reel_id = String(scroll_id + 1);
            } else {
                this.next_reel_id = String(scroll_id - 1);
            }
            this.scroll.finalize();
            if (YoutubeShortsFilter.is_upper_limit_reel(this.leaving_reel_id,
                                                        this.next_reel_id)) {
                this.b_upper_limit = true;
            } else
            if (YoutubeShortsFilter.is_prev_upper_limit_reel(this.leaving_reel_id,
                                                             this.next_reel_id)) {
                this.b_prev_upper_limit = true;
                this.remove_extention_tag_in_reels_timer = setInterval(()=> {
                    if (this.remove_extention_tag_in_reels()) {
                        this.b_prev_upper_limit = false;
                        clearInterval(this.remove_extention_tag_in_reels_timer);
                        this.remove_extention_tag_in_reels_timer = null;
                        this.scroll.initialize();
                    }
                }, 333); /*!1/3sec*/
            }
        } else {
        }
        if (this.observing_scroll_timer == null) {
            YoutubeShortsFilter.B_IN_SCROLL = true;
            this.observing_scroll_timer = setInterval(()=> {
                const lv_reel_id = this.leaving_reel_id;
                const lv_reel = YoutubeShortsFilter.s_get_reel(lv_reel_id);
                const nx_reel_id = this.next_reel_id;
                const nx_reel = YoutubeShortsFilter.s_get_reel(nx_reel_id);
                const scr_now = this.scroll.get_scroll_now();
                const diff = scr_now - this.scroll.top;
                const tm = YoutubeShortsFilter.SCROLL_TERMINATE_DIFF;
                const b_same_pos = this.is_stop_scroll();
                this.push_scroll_pos(scr_now);
                let b_end_scroll = false;
                if (this.b_upper_limit) {
                    // 特殊処理A(*1)用
                    const num_upper_reel = YoutubeShortsFilter.count_upper_reel(nx_reel);
                    // 1行目：3動画以上スライド
                    // 2行目：1動画分だけスライド
                    // 3行目：2動画分だけスライド
                    if ((num_upper_reel >= 3 && diff > this.scroll.height)
                     || (num_upper_reel == 1 && diff == 0)
                     || (num_upper_reel == 2 && b_same_pos)) {
                        b_end_scroll = true;
                    } else
                    if ((Math.abs(diff) - lv_reel.offsetHeight) == tm) {
                        // 最上段例外(↑ボタンがなかったら最上段)
                        //  特殊処理A(*1)のスライド前に↑ボタンがない瞬間があるため
                        //  動画playerがappendされるのを待って判定
                        const button_up = $("div#navigation-button-up");
                        const button_up_tip = $(button_up).find("tp-yt-paper-tooltip");
                        const plc = YoutubeShortsFilter.s_get_player_container(nx_reel);
                        if (plc.length > 0
                         && $(button_up_tip).attr("disable-upgrade") != null) {
                            b_end_scroll = true;
                        }
                    }
                } else {
                    if (lv_reel == null) {
                        return;
                    }
                    b_end_scroll = b_same_pos;
                }
                if (b_end_scroll) {
                    clearInterval(this.observing_scroll_timer);
                    this.observing_scroll_timer = null;
                    YoutubeShortsFilter.B_IN_SCROLL = false;
                    if (nx_reel == null || YoutubeShortsFilter.ACTIVE_REEL_ID != null) {
                        // 1.上端reelから上にscrollしようとした場合の例外処理
                        // 2.半端なところで止まり本来位置まで微scrollした場合の例外処理
                        clearInterval(this.leaving_reel_timer);
                        this.leaving_reel_timer = null;
                    } else {
                        this.prev_overlay_density
                            = YoutubeShortsFilter.s_get_overlay_density(lv_reel);
                    }
                    if (this.b_upper_limit) {
                        this.b_upper_limit = false;
                        this.scroll.initialize();
                    } else if (this.b_prev_upper_limit) {
                    } else {
                        this.scroll.initialize();
                    }
                }
            }, 17); /*1/60sec*/
        }
        if (this.leaving_reel_timer == null) {
            this.state_mute_button = YoutubeShortsFilter.STATE_MUTE_BUTTON_FAST_MUTE;
            this.leaving_reel_timer = setInterval(()=> {
                this.process_in_leaving_reel();
            }, 17); /*1/60sec*/
        }
    }
    callback_fullscreenchange() {
        this.fullscreenchange = true;
    }
    callback_resize_window() {
        this.resize_window = true;
    }    

    callback_domloaded() {
        this.call_fill_in_thumbnail();
    }
    /*!
     *  @param  shortsに入った際に行う処理
     */
    open() {
        YoutubeShortsFilter.ACTIVE_REEL_ID = "0";
        //
        this.no_disp_mode = YoutubeShortsFilter.NO_DISP_NONE;
        //
        this.b_force_act_zero = true;
        this.b_first_init_scr_cb = true;
        this.state_mute_button = YoutubeShortsFilter.STATE_MUTE_BUTTON_FAST_MUTE;
        //
        this.call_fill_in_thumbnail();
    }
    /*!
     *  @param  short→short移動時に行う処理
     */
    turn() {
        const act_id = YoutubeShortsFilter.ACTIVE_REEL_ID;
        if (act_id != null) {
            const reel = YoutubeShortsFilter.s_get_reel(act_id);
            if (reel != null && YoutubeShortsFilter.is_selected_reel(reel)) {
                // short内linkから別shortへスライドした場合はなにもしなくてOK
                // id/reel構成引き継ぎでplayerの参照先だけ変わるっぽい
                return;
            }
        }
        this.b_turn_reel = true;
        if (this.b_force_act_zero) {
            return;
        }
        YoutubeShortsFilter.ACTIVE_REEL_ID = null;
    }
    /*!
     *  @param  shortsから出る際に行う処理
     */
     close() {
        const sc = ShortScrollInfo.get_shorts_container();
        const pl_container = YoutubeShortsFilter.s_get_player_container(sc);
        if (pl_container.length != 0) {
            this.show_video_container(pl_container);
        }
        //
        this.next_reel_id = '';
        this.b_turn_reel = false;
        this.b_hide_prev = false;
        this.b_update_reel_info = false;
        this.fullscreenchange = false;
        this.resize_window = false;
        this.b_upper_limit = false;
        this.b_prev_upper_limit = false;
        //
        if (this.scroll.b_added_event_listener) {
            this.scroll.finalize();
        }
        if (this.fill_in_thumb_timer != null) {
            clearInterval(this.fill_in_thumb_timer);
            this.fill_in_thumb_timer = null;
        }
        if (this.observing_scroll_timer != null) {
            YoutubeShortsFilter.B_IN_SCROLL = false;
            clearInterval(this.observing_scroll_timer);
            this.observing_scroll_timer = null;
        }
        if (this.leaving_reel_timer != null) {
            clearInterval(this.leaving_reel_timer);
            this.leaving_reel_timer = null;
        }
        if (this.switch_mute_button_timer != null) {
            clearInterval(this.switch_mute_button_timer);
            this.switch_mute_button_timer = null;
        }
        if (this.remove_extention_tag_in_reels_timer != null) {
            clearInterval(this.remove_extention_tag_in_reels_timer);
            this.remove_extention_tag_in_reels_timer = null;
        }
     }

    /*!
     *  @param storage  ストレージインスタンス
     */
    constructor(storage, data_counter) {
        this.storage = storage;
        this.data_counter = data_counter;
        this.dismissible_tag = null;
        this.no_disp_mode = YoutubeShortsFilter.NO_DISP_NONE;
        //
        this.fill_in_thumb_timer = null;
        this.reel_info = new ShortReelInfo();
        //
        this.b_turn_reel = false;
        this.b_hide_prev = false;
        this.b_update_reel_info = false;
        this.b_first_init_scr_cb = true;
        this.scroll = new ShortScrollInfo(this.callback_scroll_reel.bind(this));
        this.scroll_hist = [];
        this.observing_scroll_timer = null;
        this.leaving_reel_timer = null;
        this.leaving_reel_id = '';
        this.next_reel_id = '';
        this.state_mute_button = YoutubeShortsFilter.STATE_MUTE_BUTTON_FAST_MUTE;
        this.switch_mute_button_timer = null;
        //
        this.b_force_act_zero = false;
        this.prev_overlay_density = null;
        this.fullscreenchange = false;
        this.resize_window = false;
        // 特殊処理A(*1)用
        this.b_upper_limit = false;
        this.b_prev_upper_limit = false;
        this.remove_extention_tag_in_reels_timer = null;
    }
}

/*!
    *1 特殊処理A
       channle>shortsから動画再生した場合にのみ起こる特殊状態
       - reel群の上端まで↑scrollを続けた場合に発生
       - 上にreelを単純追加せず、既存のものを使いまわして追加分とする
       - 使い回された旧reelは下へスライド(使いまわし)
       - はみ出た分は下へ追加する
       これを捌くための特殊処理
       - reelに埋めたrmv等の識別タグを消す(一つ前のreelで行う)
       - 上端から中央付近までpointerがワープするのでscrollトリガーの処理をごまかす
       -- 上端reelへのscroll完了後にワープするので専用のscroll監視に飛ばしてやりすごす
 */