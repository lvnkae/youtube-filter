/*!
 *  @brief  24年2月後半からテストの始まった新UIをできる限り無効化する
 */
class Youtube24febUIDisabler {

    /*!
     *  @brief  生配信か？
     */
    static is_live() {
        const ts = $("div.ytp-time-display.notranslate.ytp-live");
        return ts.length == 1;
    }
    /*!
     *  @note   ※旧 → ytd-watch-flexy
     *  @note   ※新 → ytd-watch-grid
     */
    static get_watch_grid_manager_tag() {
        return "ytd-watch-grid.style-scope.ytd-page-manager";
    }
    /*!
     *  @brief  動画再生ページに切り替わったか？
     *  @param  video_id    現在再生されているはずの動画ID
     *  @note   htmlの再構築が行われずに遷移するのでチェックが必要
     *  @note   ※24年2月新UIでのみ有効
     */
    static is_watch_page_switching(video_id) {
        const id
            = $(Youtube24febUIDisabler.get_watch_grid_manager_tag()).attr("video-id");
        return (id != null && id == video_id);
    }

    static is_24feb_ui_enable() {
        return $(Youtube24febUIDisabler.get_watch_grid_manager_tag()).length == 1;
    }

    static get_description_tag() {
        const tag_description
            = "ytd-structured-description-content-renderer"
            + ".style-scope"
            + ".ytd-engagement-panel-section-list-renderer";
        return tag_description;
    }

    exit_watch_page() {
        this.req_reset = true;
    }
    /*!
     *  @brief  要素変更無効化をリセットする
     */
    reset_disable_element(video_id) {
        if (!this.transport_description) {
            return;
        }
        const primary = $("div#primary-inner");
        const secondary = $("div#secondary-inner");
        const tag_description = Youtube24febUIDisabler.get_description_tag();
        if (this.last_watch_video == video_id) {
            this.no_change_video = true;
        } else {
            this.no_change_video = false;
            // metaは準備できるまで隠しておく
            $(primary).find("ytd-watch-metadata").attr("hidden", "");
            // 移動した概要をdetachしておく
            const description = primary.find(tag_description);
            $(description).detach();
            // 動画情報が別で差し込まれてたらdetach
            $(primary).find("div#factoids").detach();
            // 移動したストアshelfは戻しておく
            const shop_shelf_tag = "ytd-merch-shelf-renderer.style-scope";
            const shop_shelf = primary.find(shop_shelf_tag);
            if (shop_shelf.length == 1) {
                if (secondary.find(shop_shelf_tag).length == 0) {
                    $(shop_shelf).appendTo(secondary);
                    shop_shelf[0].className = "style-scope ytd-watch-grid";
                    $(shop_shelf).attr("item-style", "small-item");
                } else {
                    $(shop_shelf).detach();
                }
            }
            // 移動したコメントを戻しておく
            const comments = primary.find("ytd-comments#comments");
            if (comments.length == 1) {
                comments.attr("hidden", "");
                if (secondary.find("ytd-comments#comments").length == 0) {
                    $(comments).appendTo(secondary);
                } else {
                    $(comments).detach();
                }
            }
            //
            this.transport_description = null;
            this.transport_comments = null;
            this.last_watch_video = video_id;
        }
    }

    /*!
     *  @brief  css変更の無効化
     */
    static disable_css() {
        const NLC = text_utility.new_line_code_lf();
        const css_setting =
            'ytd-comment-view-model[use-small-avatars] #author-thumbnail.ytd-comment-view-model yt-img-shadow.ytd-comment-view-model  {' + NLC +
            'width: 40px;' + NLC +
            'height: 40px;' + NLC +
            'margin-right: 16px' + NLC +
            '}' + NLC +
            'ytd-comment-view-model[is-reply] #author-thumbnail.ytd-comment-view-model yt-img-shadow.ytd-comment-view-model { ' + NLC +
            'width: 24px;' + NLC +
            'height: 24px;' + NLC +
            '}' + NLC +
            'ytd-comment-replies-renderer[is-watch-grid] {' + NLC +
            'margin-left: 56px' + NLC +
            '}' + NLC +
            'ytd-structured-description-content-renderer[engagement-panel] ytd-horizontal-card-list-renderer.ytd-structured-description-content-renderer {' + NLC +
            'margin: 0px;' + NLC +
            '}';
        $('head').append('<style id="disable_24feb_ui">' + css_setting + '</style>');
    }

    /*!
     *  @brief  css更新
     *  @note   shortsではwatch用のcss設定を消す
     *  @note   (icon関連がまずい)
     */
    update_css(urlw) {
        if (urlw.in_youtube_movie_page()) {
            if ($('head').find('style#disable_24feb_ui').length == 0) {
                Youtube24febUIDisabler.disable_css();
            }
        } else
        if (urlw.in_youtube_short_page()) {
            $('head').find('style#disable_24feb_ui').detach();
        }
    }

    /*!
     *  @brief  コメントの「展開」ボタンを消す
     *  @note   disable_element内でもやってるが意図せず復活することが
     *  @note   あるのでnode追加トリガーで毎回やりたい
     */
    detach_comments_panel_button() {
        const button = $("div#primary-inner").find("div#panel-button");
        if (button.length == 1) {
            $(button).detach();
        }
    }

    /*!
     *  @brief  要素変更の無効化
     */
    disable_element_description() {
        const inner_1st = $("div#primary-inner");
        const fixed_2nd = $("div#fixed-secondary");
        const secondady = $("div#secondary")
        if (this.transport_description == null) {
            if (this.transport_meta != null) {
                const meta = $(inner_1st).find("ytd-watch-metadata");
                const bottom_row = $(inner_1st).find("div#bottom-row");
                const tag_description = Youtube24febUIDisabler.get_description_tag();
                const ext_description = $(secondady).find(tag_description);
                if (ext_description.length != 1) {
                    return;
                }
                $(meta).removeAttr("hidden"); // meta再表示
                $(meta).find("div#description").hide();
                // liveやarchiveは旧概要欄を一部利用する
                const factoids = ext_description.find("div#factoids");
                const len_factoids = $(factoids).children().length;
                if (len_factoids == 0) {
                    $(meta).find("div#description").show();
                    $(meta).find("ytd-text-inline-expander").hide();
                }
                const ext_descript_core = $(ext_description).find("div#description.style-scope.ytd-expandable-video-description-body-renderer");
                if (ext_descript_core.length == 1) {
                    ext_description.prependTo(bottom_row);
                    ext_description.find("div#shorts-title").detach();
                    ext_description.find("ytd-video-description-transcript-section-renderer").appendTo(ext_descript_core);
                    ext_description.find("ytd-video-description-infocards-section-renderer").appendTo(ext_descript_core);
                    ext_description.find("ytd-horizontal-card-list-renderer").appendTo(ext_descript_core);
                    ext_description.find("ytd-reel-shelf-renderer").appendTo(ext_descript_core);
                    //
                    const shop_shelf = $("ytd-merch-shelf-renderer.style-scope.ytd-watch-grid");
                    if (shop_shelf.length == 1) {
                        $(shop_shelf).insertAfter(meta);
                        shop_shelf[0].className = "style-scope ytd-watch-flexy";
                        $(shop_shelf).attr("item-style", "large-item");
                    }
                } else
                if (len_factoids > 0) {
                    factoids.prependTo(bottom_row);
                }
                // 概要パネルは不要なので消す
                const dsc_panel =
                    HTMLUtil.search_node(fixed_2nd, "ytd-engagement-panel-section-list-renderer", (elem) => {
                        return $(elem).attr("target-id") == "engagement-panel-structured-description";
                    });
                if (dsc_panel != null) {
                    $(dsc_panel).detach();
                }
                this.transport_description = true;
            }
        }
    }
    disable_element(current_location) {
        if (!current_location.in_youtube_movie_page()) {
            return;
        }
        if (!this.storage.is_disable_24feb_ui()) {
            return;
        }
        if (!Youtube24febUIDisabler.is_24feb_ui_enable()) {
            return;
        }
        const video_id = YoutubeUtil.cut_movie_hash(current_location.url);
        if (this.req_reset) {
            this.reset_disable_element(video_id);
            this.req_reset = false;
        }
        if (!Youtube24febUIDisabler.is_watch_page_switching(video_id)) {
            return;
        }
        // 復活対策
        this.detach_comments_panel_button();
        //
        if (this.no_change_video) {
            return;
        }
        //
        const inner_1st = $("div#primary-inner");
        const inner_2nd = $("div#secondary-inner");
        const bgrid = $(inner_1st).find("div#bottom-grid");
        if (bgrid.length == 1) {
            if (this.transport_meta == null) {
                const meta = $(inner_2nd).find("ytd-watch-metadata");
                $(meta).insertBefore(bgrid);
                $(inner_2nd).append($(meta).clone().hide());
                const top_row = $(meta).find("div#top-row");
                $(meta).find("div#actions").prependTo(top_row);
                $(meta).find("div#owner").prependTo(top_row);
                $(meta).attr("video-id", video_id);
                $(meta).attr("is-watch-flexy", "");
                $(meta).attr("larger-item-wrap", "");
                $(meta).removeAttr("skinny-mode");
                $(meta).removeAttr("actions-on-separate-line");
                meta[0].className = "watch-active-metadata style-scope ytd-watch-flexy style-scope ytd-watch-flexy";
                this.transport_meta = true;
            }
            //
            this.disable_element_description();
            //
            if (this.transport_comments == null) {
                if (this.transport_meta != null) {
                    const comments = $(inner_2nd).find("ytd-comments#comments");
                    if (comments.length == 1) {
                        if (comments.attr("hidden") != null) {
                            return;
                        }
                        if (comments.find("ytd-continuation-item-renderer") == 0) {
                            return;
                        }
                        $(comments).insertBefore(bgrid);
                        this.transport_comments = true;
                    }
                }
            }
        }
    }

    /*!
     */
    constructor(storage, last_watch_video) {
        this.storage = storage;
        this.last_watch_video = last_watch_video;
        this.transport_description = null;
        this.req_reset = false;
        this.no_change_video = false;
        if (storage.is_disable_24feb_ui()) {
            Youtube24febUIDisabler.disable_css();
        }
    }
}
