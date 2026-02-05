/*!
 *  @brief  右クリックメニュー制御(youtube用)
 */
class ContextMenuController_Youtube extends ContextMenuController {

    static TYPE_CHANNEL = 1;
    static TYPE_COMMENT = 2;

    static get_channel_text(element) {
        // 動画/チャンネル/プレイリスト
        const ch_name = YoutubeUtil.get_channel_name(element[0]);
        if (ch_name != "") {
            return ch_name;
        }
        // 動画/チャンネル/プレイリスト(25年07月以降/lockup-view-model)
        const lvm_ch_name = YoutubeUtil.get_lockup_vm_channel_name(element[0]);
        if (lvm_ch_name != "") {
            return lvm_ch_name;
        }
        // shorts(reel/24年12月下旬以降)
        const srch_name = YoutubeUtil.get_short_reel_channel_name(element);
        if (srch_name != null && srch_name != "") {
            return srch_name;
        }
        // プレイリスト(24年11月以降)
        const pl_channel = YoutubeUtil.get_list_channel_element(element[0]);
        if (pl_channel != null) {
            return pl_channel.textContent;
        }
        // shorts(チャンネル名なし)例外
        const sch_name = $(element).attr("channel_name");
        if (sch_name != null) {
            return sch_name;
        }
        // grid-channel(○水平リスト)例外
        const gr_ch_tag = "span#title.style-scope.ytd-grid-channel-renderer";
        const gr_ch_node = $(element).find(gr_ch_tag);
        if (gr_ch_node.length != 0) {
            return $(gr_ch_node).text();
        }
        // fullscreen-reccomend(26/01時点では動画終了画面おすすめ含む)例外
        const fullscr_ch_tag = "span.ytp-modern-videowall-still-info-author";
        const fullscr_ch_node = $(element).find(fullscr_ch_tag);
        if (fullscr_ch_node.length != 0) {
            return $(fullscr_ch_node).text();
        }
        // endscreen-content(動画終了画面おすすめ動画)例外
        const edscr_ch_tag = "span.ytp-videowall-still-info-author";
        const edscr_ch_node = $(element).find(edscr_ch_tag);
        if (edscr_ch_node.length != 0) {
            return YoutubeUtil.get_channel_from_author_info($(edscr_ch_node).text());
        }
        return '';
    }

    /*!
     *  @brief  Youtubeチャンネル名を得る
     *  @param  element 起点ノード
     */
    get_channel(element) {
        const channel = ContextMenuController_Youtube.get_channel_text(element);
        if (channel.length > 0) {
            return channel;
        }
        // personal_channel_video
        return YoutubeUtil.get_page_channel_name();
    }
    
    /*!
     *  @brief  renderノードを得る
     *  @param  element 起点ノード
     */
    get_renderer_node(element) {
        // shorts例外(25/07対応)
        const sub_short_reel = HTMLUtil.search_upper_node($(element), (e)=> {
            if (e.localName != 'div' || e.className == null  || e.id == null) {
                return false;
            }
            if (e.id == 'actions' || e.id == 'overlay') {
                return e.className.indexOf('ytd-reel-player-overlay-renderer') > 0;
            } else
            if (e.id == 'short-video-container') {
                return e.className.indexOf('short-video-container') == 0;
            }
        });
        if (sub_short_reel.length != 0) {
            const short_reel = HTMLUtil.search_upper_node($(element), (e)=> {
                return e.localName == 'div' &&
                       e.className != null &&
                       e.className.indexOf('reel-video-in-sequence-new') == 0;
            });
            if (short_reel.length != 0) {
                return short_reel;
            }
        }
        const chid_node = YoutubeUtil.search_renderer_root(element);
        if (chid_node != null) {
            return $(chid_node);
        }
        // shorts(チャンネル名なし/検索結果画面)例外
        const shorts_node = YoutubeUtil.search_shorts_renderer_root(element);
        if (shorts_node != null) {
            return $(shorts_node);
        }
        // fullscreen-reccomend(26/01時点では動画終了画面おすすめ含む)例外
        return HTMLUtil.search_upper_node($(element), (e)=> {
            return e.localName == 'a' &&
                   e.className != null &&
                   e.className.indexOf('ytp-modern-videowall-still') >= 0;
        });        
        // endscreen-content(動画終了画面おすすめ動画)例外
        return HTMLUtil.search_upper_node($(element), (e)=> {
            return e.localName == 'a' &&
                   e.className != null &&
                   e.className.indexOf('ytp-videowall-still') >= 0;
        });
    }
    /*!
     *  @brief  commentノードを得る
     *  @param  element 起点ノード
     */
    get_comment_node(element) {
        return HTMLUtil.search_upper_node($(element), (e)=> {
            return e.localName == 'ytd-comment-renderer' ||
                   e.localName == 'ytd-comment-view-model';
        });
    }

    /*!
     *  @brief  右クリックメニューの「$(channel)をコメントミュート」を有効化
     *  @param  element
     */
    on_commentmute(element) {
        const nd_channel_id = $(element).find("a#author-text");
        if (nd_channel_id.length == 0) {
            return false;
        }
        const max_disp_channel = 32;
        let channel_id = null;
        let channel
            = text_utility.remove_blank_line_and_head_space(
                $(nd_channel_id).text());
        const author_url = $(nd_channel_id).attr("href");
        const unique_name = YoutubeUtil.cut_channel_id(author_url);
        if (YoutubeUtil.is_handle_channel_url(author_url)) {
            channel = this.channel_info_accessor.get_channel_name(unique_name);
            channel_id = this.channel_info_accessor.get_channel_id(unique_name);
        } else {
            channel_id = unique_name;
        }
        if (channel_id == null) {
            return false;
        }
        if (channel == null) {
            return false;
        }
        const channel_st = channel.slice(0, max_disp_channel-1);
        this.context_menu.channel_id = channel_id;
        const title = channel_st + "をコメントミュート";
        MessageUtil.send_message({
            command: MessageUtil.command_update_contextmenu(),
            click_command: MessageUtil.command_mute_comment_id(),
            title: title,
            channel_id: channel_id,
            channel: channel_st
        });
        return true;
    }

    /*!
     *  @brief  右クリックメニューの独自項目を有効化
     *  @param  element
     */
    on_mute_menu(type, element) {
        if (type == ContextMenuController_Youtube.TYPE_CHANNEL) {
            return super.on_usermute(element);
        } else
        if (type == ContextMenuController_Youtube.TYPE_COMMENT) {
            return this.on_commentmute(element);
        } else {
            return false;
        }
    }

    /*!
     *  @brief  elementの基準ノード取得
     *  @param  loc     現在location(urlWrapper)
     *  @param  target  注目element
     */
    get_base_node(loc, element) {
        const ret = { type:ContextMenuController.TYPE_NONE, base_node:{length:0}};
        if (loc.in_youtube_handle_page()) {
            if (loc.in_youtube_handle_playlists()) {
                return ret;
            }
        } else 
        if (loc.in_youtube_custom_channel_page() ||
            loc.in_youtube_channel_page() ||
            loc.in_youtube_user_page()) {
            if (loc.in_youtube_channel_playlists()) {
                return ret;
            }
        } else
        if (!loc.in_youtube_sp_channel_page() &&
            !loc.in_youtube_channel_post() &&
            !loc.in_youtube_search_page() &&
            !loc.in_youtube_short_page() &&
            !loc.in_youtube_movie_page() &&
            !loc.in_youtube_hashtag() &&
            !loc.in_youtube_sports() &&
            !loc.in_top_page()) {
            return ret;
        }
        const nd_preview = YoutubeUtil.search_preview_node($(element));
        if (nd_preview.length > 0) {
            // previewノードは全動画で共用している
            // 埋め込んだチャンネル情報も辿れないので無視したい
            ret.type = ContextMenuController_Youtube.TYPE_IGNORE;
            ret.base_node = null;
            return ret;
        }
        const nd_comment = this.get_comment_node(element);
        if (nd_comment.length > 0) {
            ret.type = ContextMenuController_Youtube.TYPE_COMMENT;
            ret.base_node = nd_comment;
            return ret;
        }
        const nd_renderer = this.get_renderer_node(element);
        if (nd_renderer.length > 0) {
            ret.type = ContextMenuController_Youtube.TYPE_CHANNEL;
            ret.base_node = nd_renderer;
            return ret; 
        }
        return ret;
    }

    /*!
     */
    constructor(active, channel_info_accessor) {
        super(active);
        this.channel_info_accessor = channel_info_accessor;
    }
}
