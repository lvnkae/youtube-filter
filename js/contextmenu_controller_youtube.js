/*!
 *  @brief  右クリックメニュー制御(youtube用)
 */
class ContextMenuController_Youtube extends ContextMenuController {

    static TYPE_CHANNEL = 1;
    static TYPE_COMMENT = 2;

    static get_channel_text(element) {
        // 動画/チャンネル/プレイリスト
        const ch_name = YoutubeUtil.get_channel_name(element);
        if (ch_name != "") {
            return ch_name;
        }
        // grid-channel(○水平リスト)例外
        const gr_ch_tag = "span#title.style-scope.ytd-grid-channel-renderer";
        const gr_ch_node = $(element).find(gr_ch_tag);
        if (gr_ch_node.length != 0) {
            return $(gr_ch_node).text();
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
        const chid_node = YoutubeUtil.search_renderer_root($(element));
        if (chid_node.length != 0) {
            return chid_node;
        }
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
            return e.localName == 'ytd-comment-renderer';
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
        const nd_channel
            = $(nd_channel_id).find("span.style-scope.ytd-comment-renderer");
        if (nd_channel.length == 0) {
            return false;
        }
        const max_disp_channel = 32;
        const channel
            = text_utility
              .remove_line_head_space(text_utility
                                      .remove_blank_line($(nd_channel).text()));
        const channel_st = channel.slice(0, max_disp_channel-1);
        const channel_id = 
            YoutubeUtil.cut_channel_id($(nd_channel_id).attr("href"));
        if (channel_id == null) {
            return false;
        }
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
        if (!loc.in_youtube_custom_channel_page() &&
            !loc.in_youtube_sp_channel_page() &&
            !loc.in_youtube_channel_page() &&
            !loc.in_youtube_handle_page() &&
            !loc.in_youtube_user_page() &&
            !loc.in_youtube_search_page() &&
            !loc.in_youtube_short_page() &&
            !loc.in_youtube_movie_page() &&
            !loc.in_youtube_trending() &&
            !loc.in_youtube_hashtag() &&
            !loc.in_youtube_sports() &&
            !loc.in_top_page()) {
            return ret;
        }
        const nd_renderer = this.get_renderer_node(element);
        if (nd_renderer.length > 0) {
            ret.type = ContextMenuController_Youtube.TYPE_CHANNEL;
            ret.base_node = nd_renderer;
            return ret; 
        }
        const nd_comment = this.get_comment_node(element);
        if (nd_comment.length > 0) {
            ret.type = ContextMenuController_Youtube.TYPE_COMMENT;
            ret.base_node = nd_comment;
            return ret;
        }
        return ret;
    }

    /*!
     */
    constructor(active) {
        super(active);
    }
}
