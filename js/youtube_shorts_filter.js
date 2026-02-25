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
        return document.body.querySelector("div#shorts-container");
    }

    init_param() {
        const sc = ShortScrollInfo.get_shorts_container();
        if (sc == null) {
            return null;
        }
        this.top = sc.scrollTop;
        this.height = sc.offsetHeight;
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
        sc.addEventListener('scroll', this.callback);
        this.b_added_event_listener = true;
    }
    finalize() {
        if (!this.b_added_event_listener) {
            return;
        }
        const sc = ShortScrollInfo.get_shorts_container();
        sc.removeEventListener('scroll', this.callback);
        this.b_added_event_listener = false;
    }

    get_scroll_now() {
        const sc = ShortScrollInfo.get_shorts_container();
        return sc.scrollTop;
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
        return this.channel === channel && this.title === title;
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
const TAG_SHORTS_V2 = "ytm-shorts-lockup-view-model-v2";
const TAG_VIEWED_MARKER = "viewed";
const STATE_MUTE_BUTTON_FAST_MUTE = 0;
const STATE_MUTE_BUTTON_TIMER_MUTE = 1;
const STATE_MUTE_BUTTON_MUTED = 2;
const STATE_MUTE_BUTTON_COMP = 3;
class YoutubeShortsFilter {

    static TAG_GRID_SHELF_VM() { return "grid-shelf-view-model"; }

    static TAG_SHORTS_REEL() { return ".reel-video-in-sequence.style-scope.ytd-shorts"; }
    static TAG_SHORTS_REEL_NEW()  { return ".reel-video-in-sequence-new.style-scope.ytd-shorts"; }
    static TAG_PLAYER_CONTAINER() { return "div#player-container"; }

    static get_shorts_reel_new() {
        return document.body.querySelectorAll(YoutubeShortsFilter.TAG_SHORTS_REEL_NEW());
    }


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
    static B_UPPER_LIMIT = false;
    static OVERLAY_DENSITY = null;
    static SCROLL_TERMINATE_DIFF = 16;

    /*!
     *  @note   Ver2/24年8月末頃の構成変更対応版
     */
    static search_renderer_root(elem) {
        const renderer_root = YoutubeUtil.search_renderer_root(elem);
        if (renderer_root != null) {
            return renderer_root;
        }
        return YoutubeUtil.search_shorts_renderer_root(elem);
    }

    /*!
     *  @brief  水平配置shortsをヘッダごと消し去る
     *  @note   Ver2/24年8月末頃の構成変更対応版
     */
    static remove_whole_header2_core(tag) {
        for (const shelf of document.body.querySelectorAll(tag)) {
            if (shelf.getElementsByTagName(TAG_SHORTS_V2).length > 0) {
                shelf.remove();
            }
        }
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


    static each_slim_videos2(tag, do_func) {
        for (const shelf of document.body.querySelectorAll(tag)) {
            for (const elem of shelf.getElementsByTagName(TAG_SHORTS_V2)) {
                do_func(elem);
            }
        }
    }
    /*!
     *  @brief  short動画群にフィルタをかける
     *  @note   "ホーム"、"ゲーム"などに差し込まれるshort動画用
     *  @note   Ver2/24年8月末頃の構成変更対応版
     */
    filtering_slim_videos2(tag) {
        const storage = this.storage;
        const data_counter = this.data_counter;
        YoutubeShortsFilter.each_slim_videos2(tag, (elem)=>{
            const elem_title = elem.querySelector("h3");
            if (elem_title == null) {
                return;
            }
            const elem_tt_a = elem_title.querySelector("a");
            if (elem_tt_a == null) {
                return;
            }
            const url = elem_tt_a.href;
            const hash = YoutubeUtil.get_video_hash_by_link(url);
            const marker = YoutubeUtil.get_filtered_marker(elem);
            if (marker != null && hash === marker) {
                return;
            }
            YoutubeUtil.remove_filtered_marker(elem);
            //    
            const renderer_root = YoutubeShortsFilter.search_renderer_root(elem);
            if (renderer_root == null) {
                return;
            }
            YoutubeUtil.remove_renderer_node_channel_id(renderer_root);
            //
            const title = elem_title.textContent;
            if (storage.title_filter(title)) {
                renderer_root.remove();
                return;
            }
            const ret
                = data_counter.filtering_renderer_node_by_channel_info_or_entry_request(
                            renderer_root,
                            hash,
                            title,
                            storage);
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
        const storage = this.storage;
        const data_counter = this.data_counter;
        YoutubeShortsFilter.each_slim_videos2(tag, (elem)=> {
            const elem_title = elem.querySelector("h3");
            if (elem_title == null) {
                return true;
            }
            const elem_tt_a = elem_title.querySelector("a");
            if (elem_tt_a == null) {
                return true;
            }
            const url = elem_tt_a.href;
            const hash = YoutubeUtil.get_video_hash_by_link(url);
            if (hash !== video_id) {
                return true;
            }
            const renderer_root = YoutubeShortsFilter.search_renderer_root(elem);
            if (renderer_root != null) {
                const title = elem_title.textContent;
                data_counter.filtering_renderer_node_by_channel_info_or_entry_request(
                    renderer_root,
                    video_id,
                    title,
                    storage);
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


    static get_title(elem) {
        let e_title = null;
        const e_tt_parent = elem.querySelector("yt-shorts-video-title-view-model")
        if (e_tt_parent != null) {
            e_title = e_tt_parent.querySelector("h2");
        } else {
            e_title = elem.querySelector("h2.title");
        }
        if (e_title == null) {
            return "";
        } else {
            return text_utility.remove_blank_line_and_head_space(e_title.textContent);
        }
    }

    static get_channel_elem(elem) {
        const e_ch_parent = YoutubeUtil.get_short_reel_channel_elem(elem);
        if (e_ch_parent != null) {
            return e_ch_parent;
        } else {
            return elem.querySelector("div#channel-info");
        }
    }
    static get_author_url(elem) {
        const e_channel = YoutubeShortsFilter.get_channel_elem(elem);
        if (e_channel != null) {
            const e_a = e_channel.querySelector("a");
            if (e_a != null) {
                return e_a.href;
            }
        }
        return null;
    }
    static set_channel_name(elem, name) {
        const e_channel = YoutubeUtil.get_short_reel_channel_elem(elem);
        if (e_channel == null) {
            return;
        }
        const e_a = e_channel.querySelector("a");
        if (e_a != null) {
            e_a.textContent = name;
        }
    }
    static clear_channel_name(elem) {
        YoutubeShortsFilter.set_channel_name(elem, "");
    }
    static is_collaboration_channel(author_url) {
        return author_url.startsWith("javascript:void(0)");
    }

    static detach_suggestion(elem, storage) {
        if (storage.is_remove_suggestion()) {
            const tag_suggest = "yt-shorts-suggested-action-view-model";
            for (const sgt of elem.querySelectorAll(tag_suggest)) {
                sgt.remove();
            }
        }
    }

    static s_get_video_info_title(elem) {
        const e = elem.querySelector("h2.ytShortsVideoTitleViewModelShortsVideoTitle");
        if (e == null) {
            return null;
        }
        return text_utility.remove_formating_code(
            text_utility.remove_blank_line_and_head_space(e.textContent));
    }
    static s_get_video_id_from_title(elem) {
        const title_link = elem.querySelector("a.ytp-title-link");
        if (title_link == null) {
            return null;
        }
        const link = title_link.href;
        if (link == null) {
            return null;
        }
        return YoutubeUtil.cut_short_movie_hash(link);
    }
    static s_get_player_container(elem) {
        return elem.querySelector(YoutubeShortsFilter.TAG_PLAYER_CONTAINER());
    }
    static check_panel_expanded() {
        const tag_panel = "anchored-panel-active";
        return document.body.querySelector("ytd-shorts").getAttribute(tag_panel) != null;
    }

    static s_get_reel(id) {
        const tag_reel = `${YoutubeShortsFilter.TAG_SHORTS_REEL_NEW()}[id="${id}"]`;
        return document.body.querySelector(tag_reel);
    }
    static s_get_active_reel() {
        let act_reel = null;
        if (!YoutubeShortsFilter.B_REEL_NEW) {
            const tag_reel = YoutubeShortsFilter.TAG_SHORTS_REEL();
            for (const elem of document.body.querySelectorAll(tag_reel)) {
                if (!elem.hasAttributetr("is-active")) {
                    continue;
                }
                act_reel = elem;
                break;
            }
            if (act_reel != null) {
                return act_reel;
            }
        }
        for (const elem of YoutubeShortsFilter.get_shorts_reel_new()) {
            YoutubeShortsFilter.B_REEL_NEW = true;
            if (YoutubeShortsFilter.OVERLAY_DENSITY == null) {
                YoutubeShortsFilter.OVERLAY_DENSITY
                    = elem.getAttribute("overlay-density");
            }
            // is-activeでのチェックが出来なくなった
            if (YoutubeShortsFilter.ACTIVE_REEL_ID != null) {
                if (elem.getAttribute("id") !== YoutubeShortsFilter.ACTIVE_REEL_ID) {
                    continue;
                }
            } else {
                if (YoutubeShortsFilter.PREV_ACTIVE_REEL_ID != null) {
                    if (elem.getAttribute("id")
                        === YoutubeShortsFilter.PREV_ACTIVE_REEL_ID) {
                        continue;
                    }
                }
                // 特殊処理A(*1)中はnullを返す
                if (YoutubeShortsFilter.B_UPPER_LIMIT) {
                    continue;
                }
                if (!YoutubeShortsFilter.is_selected_reel(elem)) {
                    continue;
                }
            }
            act_reel = elem;
            YoutubeShortsFilter.ACTIVE_REEL_ID = elem.getAttribute("id");
            break;
        }
        return act_reel;
    }
    static get_active_player_container() {
        const act_reel = YoutubeShortsFilter.s_get_active_reel();
        if (act_reel == null) {
            return null;
        }
        const act_pl_container = YoutubeShortsFilter.s_get_player_container(act_reel);
        if (act_pl_container == null) {
            return null;
        }
        return act_pl_container;
    }

    static get_next_reel() {
        const act_reel = YoutubeShortsFilter.s_get_active_reel();
        if (act_reel == null) {
            return null;
        }
        return act_reel.nextElementSibling;
    }
    static get_next_player_container() {
        const next_reel = YoutubeShortsFilter.get_next_reel();
        if (next_reel == null) {
            return null;
        }
        const next_pl_container = YoutubeShortsFilter.s_get_player_container(next_reel);
        if (next_pl_container == null) {
            return null;
        }
        return next_pl_container;
    }

    static count_upper_reel(reel) {
        let cnt = 0;
        while(1) {
            reel = reel.previousElementSibling;
            if (reel != null
             && !reel.className.startsWith("reel-video-in-sequence-new")) {
                break;
            }
            cnt++;
        }
        return cnt;
    }

    static s_is_reel_detached(reel_id) {
        if (!YoutubeShortsFilter.B_REEL_NEW) {
            return false;
        }
        const elem = YoutubeShortsFilter.s_get_reel(reel_id);
        return (elem != null) ?YoutubeShortsFilter.is_detached(elem)
                              :false;
    }

    static is_end_video_filtering() {
        const act_reel = YoutubeShortsFilter.s_get_active_reel();
        if (act_reel == null) {
            return false;
        }
        return act_reel.hasAttribute("channel_id") ||
               YoutubeShortsFilter.is_detached(act_reel);
    }
    static is_detached(reel) {
        return reel.hasAttribute("rmv");
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
        reel.setAttribute("rmv", '');
        HTMLUtil.remove_children_all(reel);
    }

    static is_selected_reel(reel) {
        const st_container = ShortScrollInfo.get_shorts_container();
        if (st_container == null) {
            return false;
        }
        const stc = st_container;
        const diff = stc.scrollTop - (reel.offsetTop-stc.offsetTop);
        // 完全一致判定だとfullscreen時にすっぽ抜ける
        return Math.abs(diff) <= 16;
    }
    static is_no_author_reel(reel) {
        return null != reel.querySelector("ytd-ad-slot-renderer");
    }

    static recalculation() {
        const prev_reel_id = YoutubeShortsFilter.PREV_ACTIVE_REEL_ID;
        const prev_reel = YoutubeShortsFilter.s_get_reel(prev_reel_id);
        if (prev_reel == null) {
            return false;
        }
        if (YoutubeShortsFilter.is_detached(prev_reel)) {
            HTMLUtil.recalculation();
        }
        return true;
    }

    static set_active_viewed_mark() {
        const reel = YoutubeShortsFilter.s_get_active_reel();
        if (reel != null) {
            reel.setAttribute(TAG_VIEWED_MARKER, '');
        }
    }
    static check_viewed_mark(elem) {
        return elem.hasAttribute(TAG_VIEWED_MARKER);
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
        const title = document.querySelector("title").textContent;
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
                HTMLUtil.remove_children_all(act_reel);
            }
            return;
        }
        if (YoutubeShortsFilter.OVERLAY_DENSITY == 1) {
            if (YoutubeShortsFilter.check_panel_expanded()) {
                this.req_recalculation = false;
            } else if (this.req_recalculation) {
                if (YoutubeShortsFilter.recalculation()) {
                    this.req_recalculation = false;
                }
            }
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
        if (author_url == null || author_url === "") {
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
        const b_collabo = YoutubeShortsFilter.is_collaboration_channel(author_url);
        let channel = null;
        let channel_id = null;
        let video_id = null;
        if (!b_collabo) {
            const channel_code = YoutubeUtil.cut_channel_id(author_url);
            channel = this.data_counter.get_channel_name(channel_code);
        } else {
            video_id = YoutubeShortsFilter.s_get_video_id_from_title(act_reel);
            const channel_info = this.data_counter.get_channel_info(video_id);
            if (channel_info != null) {
                channel_id = channel_info.id;
                channel = channel_info.name;
            }
        }
        if (channel != null) {
            if (this.storage.channel_filter(channel, title)) {
                detach_func(act_reel);
                return;
            }
            const channel_work = YoutubeUtil.get_short_reel_channel_name(act_reel);
            if (channel_work !== channel) {
                YoutubeShortsFilter.set_channel_name(act_reel, channel);
            }
        }
        if (!b_collabo) {
            channel_id
                = this.data_counter.get_channel_id_from_author_url_or_entry_request(
                    author_url);
        } else if (channel_id == null) {
            channel_id = this.data_counter.entry_channel_id_request(video_id);
        }
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
        if (author_url == null || author_url === "" || title === "") {
            return;
        }
        if (!chk_func(author_url)) {
            return;
        }
        if (channel_code !== YoutubeUtil.cut_channel_id(author_url)) {
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
        const v_cont = pl_container.querySelector("div.html5-video-container");
        const video = v_cont.querySelector("video");
        if (video != null) {
            HTMLUtil.show_element(pl_container);
            HTMLUtil.recalculation();
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
        HTMLUtil.hide_element(pl_container);
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
        const player = act_reel.querySelector("div.html5-video-player");
        if (player == null) {
            return false;
        }
        switch (mode) {
        case YoutubeShortsFilter.PL_PAUSE_MODE:
            return player.className.indexOf("paused-mode") >= 0;
        case YoutubeShortsFilter.PL_PLAYING_MODE:
            return player.className.indexOf("playing-mode") >= 0;
        default:
            return false;
        }
    }
    static click_pause_button() {
        const act_reel = YoutubeShortsFilter.s_get_active_reel();
        if (act_reel == null) {
            return false;
        }
        const tag_button_shape = "yt-button-shape#play-pause-button-shape";
        const bt_shape = act_reel.querySelector(tag_button_shape);
        if (bt_shape == null) {
            return false;
        }
        const button = bt_shape.querySelector("button");
        if (button  == null) {
            return false;
        }
        button.click();
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
        const t_sh_reel = YoutubeShortsFilter.get_shorts_reel_new();
        if (t_sh_reel.length == 0) {
            return false;
        }
        const tag_thumb = "div.reel-video-in-sequence-thumbnail.style-scope.ytd-shorts";
        for (const elem of t_sh_reel) {
            const thumb = elem.querySelector(tag_thumb);
            if (thumb != null) {
                thumb.className = "reel-video-in-sequence-thumbnail";
            }
        }
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

    static get_volume_button(reel) {
        if (reel == null) {
            return null;
        }
        const vol_ctrl = reel.querySelector("volume-controls.ytdVolumeControlsHost");
        if (vol_ctrl == null) {
            return null;
        }
        const button = vol_ctrl.querySelector("button");
        const slider = vol_ctrl.querySelector("input");
        if (button == null || slider == null) {
            return null;
        }
        const value = slider.getAttribute("aria-valuetext");
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
        if (this.state_mute_button != STATE_MUTE_BUTTON_MUTED) {
            return;
        }
        vol_obj.button.click();
        this.state_mute_button = STATE_MUTE_BUTTON_COMP;
    }
    switch_mute_button() {
        const act_reel = YoutubeShortsFilter.s_get_active_reel();
        const vol_obj = YoutubeShortsFilter.get_volume_button(act_reel);
        if (vol_obj == null) {
            if (this.b_skip_switch_mute) {
                // 特殊処理A(*1)時例外
                // vol_objが復活しないことがあるのでskip
                this.b_skip_switch_mute = false;
                return true;
            }
            return false;
        }
        switch (this.state_mute_button) {
            case STATE_MUTE_BUTTON_TIMER_MUTE:
                if (vol_obj.b_muted) {
                    return true;
                }
                vol_obj.button.click();
                this.state_mute_button = STATE_MUTE_BUTTON_MUTED;
                break;
            case STATE_MUTE_BUTTON_MUTED:
                if (!vol_obj.b_muted) {
                    return false;
                }
                this.state_mute_button = STATE_MUTE_BUTTON_COMP;
                vol_obj.button.click();
                return true;
            case STATE_MUTE_BUTTON_COMP:
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
        if (pl_container != null) {
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
            this.state_mute_button = STATE_MUTE_BUTTON_COMP;
            return true;
        }
        vol_obj.button.click();
        this.state_mute_button = STATE_MUTE_BUTTON_MUTED;
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
            if (this.state_mute_button == STATE_MUTE_BUTTON_FAST_MUTE
                && !this.b_force_act_zero) {
                if (!this.mute_leaving_reel_video_renderer()) {
                    // detach済み等で失敗したらtimer式に切り替える
                    this.state_mute_button
                        = STATE_MUTE_BUTTON_TIMER_MUTE;
                }
            }
        }
        if (this.b_turn_reel
         && this.b_hide_prev
         && this.b_update_reel_info
         && (this.b_force_act_zero
          || this.state_mute_button != STATE_MUTE_BUTTON_FAST_MUTE)) {
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
        this.req_recalculation = YoutubeShortsFilter.OVERLAY_DENSITY == 1
                             && !YoutubeShortsFilter.check_panel_expanded();
    }
    static is_upper_limit_reel(leaving_id, next_id) {
        if (next_id < 0 && next_id < parseInt(leaving_id)) {
            const nx_reel = YoutubeShortsFilter.s_get_reel(next_id);
            if (nx_reel != null) {
                const nx1_reel = nx_reel.previousElementSibling;
                return nx_reel.className !== nx1_reel.className;
            }
        }
        return false;
    }
    static is_prev_upper_limit_reel(leaving_id, next_id) {
        if (next_id < 0 && next_id < parseInt(leaving_id)) {
            const nx_reel = YoutubeShortsFilter.s_get_reel(next_id);
            if (nx_reel != null) {
                const nx1_reel = nx_reel.previousElementSibling;
                const nx2_reel = nx1_reel.previousElementSibling;
                if (nx2_reel == null) {
                    return false;
                }
                return nx1_reel.className !== nx2_reel.className;
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
        for (const elem of YoutubeShortsFilter.get_shorts_reel_new()) {
            if (YoutubeShortsFilter.ACTIVE_REEL_ID !== elem.getAttribute("id")) {
                elem.removeAttribute(YoutubeShortsFilter.TAG_VIEWED_MARKER);
                elem.removeAttribute("channel_id");
                elem.removeAttribute("rmv");
            }
        }
        return true;
    }
    /*!
     *  @brief  ショート動画スクロールコールバック
     *  @note   URL変更より早いタイミングでやりたい処理がある
     */
    is_stop_scroll() {
        const hist_num = 3;
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
        const hist_num = 3;
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
        if (YoutubeShortsFilter.get_shorts_reel_new().length == 0) {
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
                YoutubeShortsFilter.B_UPPER_LIMIT = true;
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
            this.observing_scroll_timer = setInterval(()=> {
                const lv_reel_id = this.leaving_reel_id;
                const lv_reel = YoutubeShortsFilter.s_get_reel(lv_reel_id);
                const nx_reel_id = this.next_reel_id;
                const nx_reel = YoutubeShortsFilter.s_get_reel(nx_reel_id);
                const scr_now = this.scroll.get_scroll_now();
                const diff = scr_now - this.scroll.top;
                const tm = YoutubeShortsFilter.SCROLL_TERMINATE_DIFF;
                const near = (nx_reel != null) ?Math.abs(scr_now - nx_reel.offsetTop) :0;
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
                     || (num_upper_reel == 2 && near <= tm)) {
                        this.b_skip_switch_mute = true;
                        b_end_scroll = true;
                    } else {
                        const termin = Math.abs(diff) - lv_reel.offsetHeight;
                        if (termin == tm || (b_same_pos && termin > 0 && near <= tm)) {
                            // 最上段例外(↑ボタンがなかったら最上段)
                            //  特殊処理A(*1)のスライド前に↑ボタンがない瞬間があるため
                            //  動画playerがappendされるのを待って判定
                            const tag_button_up = "div#navigation-button-up";
                            const button_up = document.body.querySelector(tag_button_up);
                            if (button_up != null) {
                                const tag_tooltip = "tp-yt-paper-tooltip";
                                const button_up_tip
                                    = button_up.querySelector(tag_tooltip);
                                const plc
                                    = YoutubeShortsFilter.s_get_player_container(nx_reel);
                                if (plc != null
                                && button_up_tip != null
                                && button_up_tip.hasAttribute("disable-upgrade")) {
                                    b_end_scroll = true;
                                }
                            }
                        }
                    }
                } else {
                    if (lv_reel == null) {
                        return;
                    }
                    const termin = Math.abs(diff) - lv_reel.offsetHeight;
                     //  1行目：通常
                     //  2行目：最上段(余剰scroll)用
                     //  3行目：通常(保険)
                    b_end_scroll = (termin == tm)
                                 ||((nx_reel == null) && diff == 0)
                                 ||((nx_reel != null) && b_same_pos
                                                      && termin > 0
                                                      && near <= tm);
                }
                if (b_end_scroll) {
                    clearInterval(this.observing_scroll_timer);
                    this.observing_scroll_timer = null;
                    if (nx_reel == null) {
                        // 上端reelから上にscrollしようとした場合の例外処理
                        clearInterval(this.leaving_reel_timer);
                        this.leaving_reel_timer = null;
                    } else {
                    }
                    if (this.b_upper_limit) {
                        this.b_upper_limit = false;
                        YoutubeShortsFilter.B_UPPER_LIMIT = false;
                        this.scroll.initialize();
                    } else if (this.b_prev_upper_limit) {
                    } else {
                        this.scroll.initialize();
                    }
                }
            }, 17); /*1/60sec*/
        }
        if (this.leaving_reel_timer == null) {
            this.state_mute_button = STATE_MUTE_BUTTON_FAST_MUTE;
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
        YoutubeShortsFilter.PREV_ACTIVE_REEL_ID = null;
        YoutubeShortsFilter.ACTIVE_REEL_ID = "0";
        //
        this.no_disp_mode = YoutubeShortsFilter.NO_DISP_NONE;
        //
        this.b_force_act_zero = true;
        this.b_first_init_scr_cb = true;
        this.state_mute_button = STATE_MUTE_BUTTON_FAST_MUTE;
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
        YoutubeShortsFilter.PREV_ACTIVE_REEL_ID = YoutubeShortsFilter.ACTIVE_REEL_ID;
        YoutubeShortsFilter.ACTIVE_REEL_ID = null;
    }
    /*!
     *  @param  shortsから出る際に行う処理
     */
     close() {
        const sc = ShortScrollInfo.get_shorts_container();
        const pl_container = YoutubeShortsFilter.s_get_player_container(sc);
        if (pl_container != null) {
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
        this.state_mute_button = STATE_MUTE_BUTTON_FAST_MUTE;
        this.switch_mute_button_timer = null;
        this.b_skip_switch_mute = false;
        //
        this.b_force_act_zero = false;
        this.req_recalculation = false;
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