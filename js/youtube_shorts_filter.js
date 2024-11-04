/*!
 *  @brief  YoutubeShortsフィルタ
 */
class YoutubeShortsFilter {

    static TAG_GRID_SLIM_MEDIA() { return ".style-scope.ytd-rich-grid-slim-media"; }
    static TAG_SHELF_RENDERER() { return ".style-scope.ytd-rich-shelf-renderer"; }
    static TAG_REEL_RENDERER()  { return ".style-scope.ytd-reel-item-renderer"; }

    static TAG_SHORTS_V2() { return "ytm-shorts-lockup-view-model-v2"; }
    static TAG_SHORTS_REEL() { return ".reel-video-in-sequence.style-scope.ytd-shorts"; }

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
        const t_rich = YoutubeUtil.get_rich_shelf_header_tag();
        YoutubeShortsFilter.remove_whole_header2_core(t_rich);
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
        const e_ch_parent = YoutubeShortsFilter.get_channel_elem(elem);
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
    static get_channel_name(elem) {
        const e_channel = YoutubeShortsFilter.get_channel_elem(elem);
        if (e_channel.length == 1) {
            const e_a = $(e_channel).find("a");
            if (e_a.length == 1) {
                return $(e_a).text();
            }
        }
        return null;
    }
    static set_channel_name(elem, name) {
        const e_channel = YoutubeShortsFilter.get_channel_elem(elem);
        if (e_channel.length != 1) {
            return;
        }
        const e_a = $(e_channel).find("a");
        if (e_a.length == 1) {
            $(e_a).text(name);
        }
    }


    /*!
     *  @brief  動画(ショート)にフィルタをかける
     */
    filtering_video() {
        const title = $("title").text();
        const tag_short = YoutubeShortsFilter.TAG_SHORTS_REEL();
        const detach_func = HTMLUtil.detach_children_all;
        $(tag_short).each((inx, elem)=> {
            if ($(elem).attr("is-active") == null) {
                return true;
            }
            if (this.storage.title_filter(title)) {
                detach_func(elem);
                return false;
            }
            const author_url = YoutubeShortsFilter.get_author_url(elem);
            if (author_url == null || author_url == "") {
                return false;
            }
            const channel_code = YoutubeUtil.cut_channel_id(author_url);
            const channel = this.data_counter.get_channel_name(channel_code);
            if (channel != null) {
                if (this.storage.channel_filter(channel, title)) {
                    detach_func(elem);
                    return false;
                }
                const channel_work = YoutubeUtil.get_channel_name(elem);
                if (channel_work != channel) {
                    YoutubeUtil.set_channel_name(elem, channel);
                }
                const channel_work_neo = YoutubeShortsFilter.get_channel_name(elem);
                if (channel_work_neo != null && channel_work_neo != channel) {
                    YoutubeShortsFilter.set_channel_name(elem, channel);
                }
            }
            const channel_id
                = this.data_counter.get_channel_id_from_author_url_or_entry_request(
                    author_url);
            YoutubeFilteringUtil.filtering_renderer_node_by_channel_id(
                elem, channel_id, title, detach_func, this.storage);
            return false;
        });
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
        const tag_short = YoutubeShortsFilter.TAG_SHORTS_REEL();
        $(tag_short).each((inx, elem)=> {
            if ($(elem).attr("is-active") == null) {
                return true;
            }
            const author_url = YoutubeShortsFilter.get_author_url(elem);
            const title = YoutubeShortsFilter.get_title(elem);
            if (author_url == null || author_url == "" || title == "") {
                return true;
            }
            if (!chk_func(author_url)) {
                return true;
            }
            if (channel_code != YoutubeUtil.cut_channel_id(author_url)) {
                return true;
            }
            if (this.storage.channel_id_filter(channel_id, title)) {
                HTMLUtil.detach_children_all(elem);
                return false;
            }
            const channel = this.data_counter.get_channel_name(channel_code);
            if (channel != null) {
                if (this.storage.channel_and_title_filter(channel, title)) {
                    HTMLUtil.detach_children_all(elem);
                    return false;
                } else {
                    YoutubeShortsFilter.set_channel_name(elem, channel);
                    YoutubeUtil.set_channel_name(elem, channel);
                }
            }
            YoutubeUtil.set_renderer_node_channel_id(elem, channel_id);
            return false;
        });
    }

    /*!
     *  @param storage  ストレージインスタンス
     */
    constructor(storage, data_counter) {
        this.storage = storage;
        this.data_counter = data_counter;
        this.dismissible_tag = null;
    }
}
