/*!
 *  @brief  Youtubeコメントフィルタ
 */
class YoutubeCommentFilter {

    /*!
     *  @brief  フィルタリング呼び出し
     *  @param  e_parent    親ノード
     *  @param  tag_comment コメントタグ
     *  @param  fl_func     フィルタ関数
     */
    call_filtering(e_parent, tag_comment, fl_func) {
        $(e_parent).find(tag_comment).each((inx, elem)=>{
            fl_func(elem);
        });
    }

    get_string_node(elem, tag) {
        const e = $(elem).find("yt-formatted-string" + tag);
        if (e.length > 0) {
            return e;
        }
        return $(elem).find("yt-attributed-string" + tag);
    }

    get_content_text_node(elem) {
        return this.get_string_node(elem, "#content-text");
    }

    /*!
     *  @brief  コメントフィルタ(1コメント分)
     */
    filtering_unit(elem) {
        const author_tag
            = "a#author-text.yt-simple-endpoint.style-scope";
        let ret = {};
        const elem_author = $(elem).find(author_tag);
        if (elem_author.length != 1) {
            return ret;
        }
        const elem_comment = this.get_content_text_node(elem);
        if (elem_comment.length != 1) {
            return ret;
        }
        const author_url = $(elem_author).attr("href");
        if (author_url == null) {
            return ret;
        }
        let handle = null;
        let userid = null;
        if (YoutubeUtil.is_handle_channel_url(author_url)) {
            handle = YoutubeUtil.cut_channel_id(author_url);
            userid = this.channel_info_accessor.get_channel_id(handle);
        } else {
            userid = YoutubeUtil.cut_channel_id(author_url);
        }
        const comment_info = YoutubeUtil.get_comment(elem_comment);
        if (comment_info.reply_id != null) {
            if (this.storage.comment_filter_by_id(comment_info.reply_id)) {
                ret.result = true;
                ret.add_ng_id = false;
                return ret;
            }
        }
        if (userid != null) {
            const username = this.channel_info_accessor.get_channel_name(handle);
            if (username != null) {
                ret = this.storage.comment_filter(username,
                                                  userid,
                                                  handle,
                                                  comment_info.comment);
                if (!ret.result) {
                    // ハンドルをユーザ名にすげ替える
                    let elem_aname = this.get_string_node(elem_author, "");
                    if (elem_aname.length == 1) {
                        if ($(elem_aname).text() != username) {
                            $(elem_aname).text(username);
                        }
                    }
                 }
                return ret;
            }
        } else 
        if (handle != null) {
            ret = this.storage.comment_filter_without_id(handle, comment_info.comment);
            if (!ret.result) {
                this.channel_info_accessor.entry(handle);
                this.inq_comment_list[handle] = null;
            }
        }
        return ret;
    }
    /*!
     *  @brief  コメント非表示ID登録
     *  @note   ワードフィルタのオプション機能
     *  @note   "非表示IDに自動で追加"用処理
     */
    add_ng_id_to_storage(candidate_of_additional_ng_id) {
        if (this.storage.json.ng_comment_by_id == null) {
            this.storage.json.ng_comment_by_id = [];
        }
        var additional_ng_id = [];
        for (const ng_id of candidate_of_additional_ng_id) {
            if (!this.storage.json.ng_comment_by_id.includes(ng_id)) {
                additional_ng_id.push(ng_id);
            }
        }
        if (additional_ng_id.length > 0) {
            for (const ng_id of additional_ng_id) {
                this.storage.json.ng_comment_by_id.push(ng_id);
            }
            this.storage.save();
            MessageUtil.send_message({command:MessageUtil.command_add_mute_id()});
        }
    }
    /*!
     *  @brief  リプライコメント群フィルタ
     */
    filtering_replies(comment_root) {
        const nd_ex_contents = $(comment_root).find("div#expander-contents");
        if (nd_ex_contents.length == 0) {
            return;
        }
        let candidate_of_additional_ng_id = [];
        let remain_reply = 0;
        let have_reply = false;
        const tag_reply_old = "ytd-comment-renderer";
        const tag_reply_new = "ytd-comment-view-model";
        let tag_reply = tag_reply_old;
        if ($(nd_ex_contents).find(tag_reply).length == 0) {
            tag_reply = tag_reply_new;
        }
        const tag_elem = "div#main";
        this.call_filtering(nd_ex_contents, tag_reply, (reply_root)=> {
            have_reply = true;
            const elem = HTMLUtil.find_first_appearing_element(reply_root, tag_elem);
            const ret = this.filtering_unit(elem);
            if (ret.result) {
                // shortページのcomment-dialogではcomment-rendererが使いまわされて
                // いるためdetach厳禁。
                // (detachされたrendererに再割当てされたコメントは非表示になってしまう)
                $(reply_root).attr("hidden", "");
                if (ret.add_ng_id) {
                    candidate_of_additional_ng_id.push(ret.userid);
                }
            } else {
                $(reply_root).removeAttr("hidden");
                remain_reply++;
            }
        });
        if (have_reply && remain_reply == 0) {
            YoutubeUtil.set_num_reply_or_remove(comment_root, remain_reply);
        }
        this.add_ng_id_to_storage(candidate_of_additional_ng_id);
    }
    /*!
     *  @brief  コメント群フィルタリング
     */
    filtering() {
        let candidate_of_additional_ng_id = [];
        const comments_root_grp = $("ytd-comments");
        const tag_comment = "ytd-comment-thread-renderer";
        const tag_elem = "div#main";
        for (const comments_root of comments_root_grp) {
            this.call_filtering(comments_root, tag_comment, (comment_root)=> {
                const elem
                    = HTMLUtil.find_first_appearing_element(comment_root, tag_elem);
                const ret = this.filtering_unit(elem);
                if (ret.result) {
                    // reply群を先に削除
                    const tag_replies = "div#replies";
                    HTMLUtil.detach_lower_node(comment_root, tag_replies);
                    // スクロールによる追加読み込みが効かなくなるのでrootはdetachしない
                    const comment_body = $(elem).parent().parent();
                    $(comment_body).detach();
                    if (ret.add_ng_id) {
                        candidate_of_additional_ng_id.push(ret.userid);
                    }
                } else {
                    this.filtering_replies(comment_root);
                }
            });
        }
        this.add_ng_id_to_storage(candidate_of_additional_ng_id);
    }

    /*!
     *  @brief  observer生成
     *  @note   node追加をフィルタトリガにしたい
     */
    create_observer(tag_parent, tag) {
        if (tag in this.renderer_observer) {
            return;
        }
        let ob_elem = [];
        $(tag_parent).find(tag).each((inx, e)=> {
            ob_elem.push(e);
        });
        if (ob_elem.length == 0) {
            return;
        }
        // 要素追加監視
        let observer = new MutationObserver((records)=> {
            const tgt = records[0].target;
            if (tgt.id == "button" ||
                tgt.id == "tooltip" ||
                tgt.localName == "yt-img-shadow" ||
                tgt.className != null && tgt.className.indexOf("button") >= 0)
            {
                return;
            }
            this.filtering();
            this.channel_info_accessor.kick();
        });
        for (const e of ob_elem) {
            observer.observe(e, {
                childList: true,
                subtree: true,
            });
        }
        this.renderer_observer[tag] = observer;
        // 要素変更監視
        let observer_attr = new MutationObserver((records)=> {
            this.filtering();
        });
        for (const e of ob_elem) {
            observer_attr.observe(e, {
                attributes: true,
                attributeFilter: ['src'],
                subtree: true,
            });
        }
        const attr_tag = tag + '_attr'
        this.renderer_observer[attr_tag] = observer_attr;
    }
    /*!
     *  @brief  element追加callback
     *  @note   after_domloaded_observerから呼ばれる
     */
    callback_observing_element_change(records, b_change_url) {
        // URL変更時処理
        if (b_change_url) {
            for (const key in this.renderer_observer) {
                const observer = this.renderer_observer[key];
                observer.disconnect();
            }
            this.renderer_observer = [];
        }
        // コメントノードobserver生成
        if (Object.keys(this.renderer_observer).length > 0) {
            return;
        }
        let ob_elem = [];
        const tag_shorts = "div#shorts-container"
        const tag_panel = "div#watch-while-engagement-panel";
        this.create_observer(tag_shorts, tag_panel);
        const tag_watch
            = (Youtube24febUIDisabler.is_24feb_ui_enable()) ?"div#secondary-inner"
                                                            :"div#primary";
        const tag_item_sec
            = "ytd-item-section-renderer#sections.style-scope.ytd-comments";
        this.create_observer(tag_watch, tag_item_sec);
    }

    tell_get_channel_id(unique_name, channel_id) {
        if (unique_name in this.inq_comment_list) {
            this.filtering();
        }
    }

    /*!
     *  @param storage                  ストレージインスタンス
     *  @param channel_info_accessor    チャンネル情報
     */
    constructor(storage, channel_info_accessor) {
        this.storage = storage;
        this.renderer_observer = [];
        this.channel_info_accessor = channel_info_accessor;
        this.inq_comment_list = [];
    }
}
