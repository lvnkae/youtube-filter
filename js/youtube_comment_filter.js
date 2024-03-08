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
    /*!
     *  @brief  コメントフィルタ(1コメント分)
     */
    filtering_unit(elem) {
        const author_tag
            = "a#author-text.yt-simple-endpoint.style-scope.ytd-comment-renderer";
        const comment_tag
            = "yt-formatted-string#content-text.style-scope.ytd-comment-renderer";
        let ret = {};
        const elem_author = $(elem).find(author_tag);
        if (elem_author.length != 1) {
            return ret;
        }
        const elem_comment = $(elem).find(comment_tag)
        if (elem_comment.length != 1) {
            return ret;
        }
        const username
            = text_utility.remove_blank_line_and_head_space(
                $(elem_author).text());
        const author_url = $(elem_author).attr("href");
        if (author_url == null) {
            return ret;
        }
        const userid = YoutubeUtil.cut_channel_id(author_url);
        const comment = YoutubeUtil.get_comment(elem_comment);
        return this.storage.comment_filter(username, userid, comment);
    }
    /*!
     *  @brief  コメント非表示ID登録
     *  @note   ワードフィルタのオプション機能
     *  @note   "非表示IDに自動で追加"用処理
     */
    add_ng_id_to_storage(candidate_of_additional_ng_id) {
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
        const tag_reply = "ytd-comment-renderer";
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
        if (!this.storage.have_ng_comment_data()) {
            return;
        }
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
        });
        for (const e of ob_elem) {
            observer.observe(e, {
                childList: true,
                subtree: true,
            });
        }
        this.renderer_observer[tag] = observer;
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
        const tag_primary = "div#primary"
        const tag_item_sec
            = "ytd-item-section-renderer#sections.style-scope.ytd-comments";
        this.create_observer(tag_primary, tag_item_sec);
    }

    /*!
     *  @param storage  ストレージインスタンス
     */
    constructor(storage) {
        this.storage = storage;
        this.renderer_observer = [];
    }
}
