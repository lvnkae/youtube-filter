function has_key(arry, key) {
    let ret = false;
    for (const obs of arry) {
        if (obs.key === key) {
            return true;
        }
    }
    return false;
}
function is_contents(e) {
    return e.localName === "div" && e.id === "contents";
}

const TAG_COMMENT_ROOT = "ytd-comment-thread-renderer";
const TAG_AUTHOR_TEXT = "a#author-text.yt-simple-endpoint.style-scope";
const TAG_POST_ROOT = "ytd-browse.style-scope.ytd-page-manager";
const TAG_SHORT_ROOT = "div#shorts-panel-container";
const TAG_COMMMENT_SECTION = "ytd-item-section-renderer#sections.style-scope.ytd-comments";
const TAG_SHORT_COMMENT_SECTION = 'ytd-item-section-renderer'
                                + '[section-identifier="comment-item-section"]';

function remove_comment(e) {
    // shortsではcomment-nodeが使い回されるので削除しない
    // スクロールによる追加読み込みが効かなくなるのでrootはdetachしない
    e.hidden = true;
}
function comeback_comment(e) {
    // removeという名の非表示から復帰
    e.hidden = false;
}
function get_content_text_node(elem) {
    return elem.querySelector("yt-attributed-string#content-text");
}
function remove_author_text(elem) {
    const e_author = elem.querySelector(TAG_AUTHOR_TEXT);
    if (e_author != null) {
        e_author.removeAttribute("href")
    }
}
/*!
 *  @brief  問い合わせ待ちmapにelemを登録
 *  @param[out] wait_map    問い合わせ待ちmap
 *  @param[in]  handle      登録キー
 *  @param[in]  elem        登録elem
 *  @note   Map[key]->array
 */
function add_wait_comment_map(wait_map, handle, elem) {
    let array = wait_map.get(handle);
    if (array == null) {
        wait_map.set(handle, [elem]);
    } else {
        array.push(elem);
    }
}
/*!
 *  @brief  コメントフィルタ(1コメント分)
 *  @param[out] wait_map                問い合わせ待ちmap
 *  @param[in]  elem                    コメントノード
 *  @param[in]  channel_info_accessor   ChannelInfoAccessorクラスインスタンス
 *  @param[in]  storage                 StorageDataクラスインスタンス
 */
function filtering_unit(wait_map, elem, channel_info_accessor, storage) {
    let ret = { error: true };
    if (elem == null) {
        return ret;
    }
    const elem_author = elem.querySelector(TAG_AUTHOR_TEXT);
    if (elem_author == null) {
        return ret;
    }
    const author_url = elem_author.href;
    if (author_url == null) {
        return ret;
    }
    const elem_comment = get_content_text_node(elem);
    if (elem_comment == null) {
        return ret;
    }
    let handle = null;
    let userid = null;
    const author = YoutubeUtil.cut_channel_author(author_url);
    if (author == null) {
        return ret;
    }
    if (YoutubeUtil.is_handle_author(author)) {
        handle = author[0];
        userid = channel_info_accessor.get_channel_id(handle);
    } else if (YoutubeUtil.is_channel_id_author(author)) {
        userid = author[2];
    } else {
        return ret;
    }
    ret.error = false;
    const comment_info = YoutubeUtil.get_comment(elem_comment);
    if (comment_info.reply_id != null) {
        if (storage.comment_filter_by_id(comment_info.reply_id)) {
            ret.result = true;
            ret.add_ng_id = false;
            ret.state = YoutubeFilteringUtil.STATE_REMOVE;
            return ret;
        }
    }
    if (userid != null) {
        const username = channel_info_accessor.get_channel_name(handle);
        if (username != null) {
            ret = storage.comment_filter(username,
                                         userid,
                                         handle,
                                         comment_info.comment);
            if (ret.result) {
                ret.state = YoutubeFilteringUtil.STATE_REMOVE;
            } else {
                ret.state = YoutubeFilteringUtil.STATE_COMPLETE;
            }
        }
    } else 
    if (handle != null) {
        ret = storage.comment_filter_without_id(handle, comment_info.comment);
        if (!ret.result) {
            channel_info_accessor.entry(handle);
            add_wait_comment_map(wait_map, handle, elem);
            ret.state = YoutubeFilteringUtil.STATE_WAIT;
        } else {
            ret.state = YoutubeFilteringUtil.STATE_REMOVE;
        }
    }
    return ret;
}
/*!
 *  @brief  コメントフィルタ(呼び出し部分)
 *  @param[out] wait_map                        問い合わせ待ちmap
 *  @param[out] candidate_additional_ng_id      NG登録候補者ID
 *  @param[in]  comment_root                    親コメントノード
 *  @param[in]  state_func                      状態判定関数
 *  @param[in]  channel_info_accessor           ChannelInfoAccessorクラスインスタンス
 *  @param[in]  storage                         StorageDataクラスインスタンス
 */
function filtering_comment_calling(wait_map, candidate_additional_ng_id,
                                   comment_root, state_func,
                                   channel_info_accessor, storage) {
    if (state_func(comment_root)) {
        const tag_elem = "div#main";
        const elem = comment_root.querySelector(tag_elem);
        const ret = filtering_unit(wait_map, elem, channel_info_accessor, storage);
        if (!ret.error) {
            if (ret.result) {
                remove_comment(comment_root);
                if (ret.add_ng_id) {
                    candidate_additional_ng_id.push(ret.userid);
                }
            } else {
                filtering_replies(wait_map, candidate_additional_ng_id,
                                comment_root, state_func,
                                channel_info_accessor, storage);
            } 
            if (ret.state != null) {
                YoutubeFilteringUtil.set_state(comment_root, ret.state);
            }
        }
    } else {
        filtering_replies(wait_map, candidate_additional_ng_id,
                          comment_root, state_func,
                          channel_info_accessor, storage);
    }                                    
}
/*!
 *  @brief  リプライコメント群フィルタ
 *  @param[out] wait_map                        問い合わせ待ちmap
 *  @param[out] candidate_additional_ng_id      NG登録候補者ID
 *  @param[in]  parent_root                     親コメントノード
 *  @param[in]  state_func                      状態判定関数
 *  @param[in]  channel_info_accessor           ChannelInfoAccessorクラスインスタンス
 *  @param[in]  storage                         StorageDataクラスインスタンス
 */
const TAG_REPLIES_ROOT = "div#expanded-threads";
const TAG_REPLY = "yt-sub-thread";
function filtering_replies(wait_map, candidate_additional_ng_id,
                           parent_root, state_func,
                           channel_info_accessor, storage) {
    const e_replies = parent_root.querySelector(TAG_REPLIES_ROOT);
    if (e_replies == null) {
        return;
    }
    for (const e of e_replies.children) {
        if (e.localName !== TAG_REPLY) {
            continue;
        }
        const comment_root = e.querySelector(TAG_COMMENT_ROOT);
        if (comment_root == null) {
            continue;
        }
        filtering_comment_calling(wait_map, candidate_additional_ng_id,
                                  comment_root, state_func,
                                  channel_info_accessor, storage);
    }        
}
/*!
 *  @brief  リプライコメント群stateクリア
 *  @param  parent_root 親コメントノード
 */
function remove_replies_state(parent_root) {
    const e_replies = parent_root.querySelector(TAG_REPLIES_ROOT);
    if (e_replies == null) {
        return;
    }
    for (const e of e_replies.children) {
        if (e.localName !== TAG_REPLY) {
            continue;
        }
        const comment_root = e.querySelector(TAG_COMMENT_ROOT);
        if (comment_root == null) {
            continue;
        }
        YoutubeFilteringUtil.remove_state(comment_root);
        comeback_comment(comment_root);
        remove_replies_state(comment_root);
    }
}

/*!
 *  @class  Youtubeコメントフィルタ
 */
class YoutubeCommentFilter {

    /*!
     *  @brief  コメント非表示ID登録
     *  @note   ワードフィルタのオプション機能
     *  @note   "非表示IDに自動で追加"用処理
     */
    add_ng_id_to_storage(candidate_additional_ng_id) {
        if (this.storage.json.ng_comment_by_id == null) {
            this.storage.json.ng_comment_by_id = [];
        }
        let do_save = false;
        // jsonのng_comment_by_idはただの配列なので重複チェックが必要
        // フィルタ処理用のSetからすると無駄だけどしゃーない
        for (const ng_id of candidate_additional_ng_id) {
            if (!this.storage.ng_comment_by_id.has(ng_id)) {
                do_save = true;
                this.storage.ng_comment_by_id.add(ng_id);
                this.storage.json.ng_comment_by_id.push(ng_id);
            }
        }
        if (do_save) {
            this.storage.save();
            MessageUtil.send_message({command:MessageUtil.command_add_mute_id()});
        }
    }           
    /*!
     *  @brief  コメント群フィルタリング
     */
    filtering(observer, state_func) {
        let e_parent = null;
        for (const obj of this.renderer_observer) {
            if (obj.obs == observer || obj.obs_attr == observer) {
                e_parent = obj.elem;
                break;
            }
        }
        if (e_parent == null) {
            return;
        }
        const e_contents = HTMLUtil.search_children(e_parent, is_contents);
        if (e_contents == null) {
            return;
        }
        let wait_map = this.wait_comment_map;
        let candidate_additional_ng_id = [];
        const channel_info_accessor = this.channel_info_accessor;
        const storage = this.storage;
        for (const e of e_contents.children) {
            if (e.localName !== TAG_COMMENT_ROOT) {
                continue;
            }
            filtering_comment_calling(wait_map, candidate_additional_ng_id,
                                      e, state_func,
                                      channel_info_accessor, storage);
        }
        this.add_ng_id_to_storage(candidate_additional_ng_id);
    }

    /*!
     *  @brief  再フィルタリング
     *  @note   completeを再フィルタリング
     *  @note   contextMenuからミュート登録された際に使用
     */
    refiltering() {
        for (const obj of this.renderer_observer) {
            const e_contents = HTMLUtil.search_children(obj.elem, is_contents);
            if (e_contents == null) {
                continue;
            }
            let candidate_additional_ng_id = [];
            let wait_map = new Map();
            const channel_info_accessor = this.channel_info_accessor;
            const storage = this.storage;
            const check_complete = e=>{
                // 処理済のものだけ対象
                return YoutubeFilteringUtil.STATE_COMPLETE
                    === YoutubeFilteringUtil.get_state(e);
            };
            for (const e of e_contents.children) {
                if (e.localName !== TAG_COMMENT_ROOT) {
                    continue;
                }
                filtering_comment_calling(wait_map, candidate_additional_ng_id,
                                          e, check_complete,
                                          channel_info_accessor, storage);
            }
        }
    }

    /*!
     *  @brief  全コメントstate削除
     *  @note   shorts用/コメント使いまわしによる弊害を回避
     */
    remove_comments_state(e_contents) {
        if (e_contents == null) {
            return;
        }
        for (const e of e_contents.children) {
            if (e.localName !== TAG_COMMENT_ROOT) {
                continue;
            }
            YoutubeFilteringUtil.remove_state(e);
            comeback_comment(e);
            remove_author_text(e);
            remove_replies_state(e);
        }
    }    

    /*!
    *  @brief  コメントエリアclick-callback
    */
    click_comment_area(e, tag) {
        // 並び替えdropdown-menu監視
        const dmenu = e.target.closest('a.yt-simple-endpoint.style-scope.yt-dropdown-menu');
        if (dmenu != null) {
            const e_root = this.click_listener[tag].root;
            const tag_comment_contents = "div#contents.style-scope.ytd-item-section-renderer";
            const e_contents = e_root.querySelector(tag_comment_contents);
            this.remove_comments_state(e_contents);
        }
    }
    add_click_listener(tags, tag_parent) {
        const e_parent
            = (tag_parent == null) ?null
                                   :HTMLUtil.find_first_appearing_element_fast(
                                        document.body, tag_parent)
        for (const tag of tags) {
            if (tag in this.click_listener) {
                continue;
            }
            const elem = (e_parent == null) ?document.body.querySelector(tag)
                                            :e_parent.querySelector(tag);
            if (elem != null) {
                const click_cb = e=>{ this.click_comment_area(e, tag) };
                elem.addEventListener('click', click_cb);
                this.click_listener[tag] = {root:elem, func:click_cb}
            }
        }
    }

    /*!
     *  @brief  observer生成
     *  @note   node追加をフィルタトリガにしたい
     */
    create_observer(tag_parent, tag) {
        if (has_key(this.renderer_observer, tag_parent)) {
            return;
        }
        const e_parent
            = HTMLUtil.find_first_appearing_element_fast(document.body, tag_parent);
        if (e_parent == null) {
            return;
        }
        const ob_elem = e_parent.querySelector(tag);
        if (ob_elem == null || ob_elem.offsetParent == null) {
            return;
        };
        const check_fresh = e=>{
            // 未処理のものだけ対象
            // 非表示は弾く(shortsの使いまわしバグ対策)
            return null == YoutubeFilteringUtil.get_state(e) &&
                   e.offsetParent != null;
        };
        // 要素追加監視
        let observer = new MutationObserver((records, observer)=> {
            const tgt = records[0].target;
            if (tgt.id === "button" ||
                tgt.id === "tooltip" ||
                tgt.localName === "yt-img-shadow" ||
                tgt.className != null && tgt.className.indexOf("button") >= 0)
            {
                return;
            }
            this.filtering(observer, check_fresh);
            this.channel_info_accessor.kick();
        });
        observer.observe(ob_elem, {
            childList: true,
            subtree: true,
        });
        // 要素変更監視
        let observer_attr = new MutationObserver((records, observer)=> {
            //this.filtering(observer, check_fresh);
        });
        observer_attr.observe(ob_elem, {
            attributes: true,
            attributeFilter: ['src'],
            subtree: true,
        });
        this.renderer_observer.push({
                key:tag_parent,
                obs:observer,
                obs_attr:observer_attr,
                elem:ob_elem });
    }
    /*!
     *  @brief  element追加callback
     *  @note   after_domloaded_observerから呼ばれる
     */
    callback_observing_element_change(urlw) {
        // sort-tabのclick監視
        if (Object.keys(this.click_listener).length != this.required_listener) {
            if (urlw.in_youtube_short_page()) {
                const tags = ["div#anchored-panel"];
                this.add_click_listener(tags, TAG_SHORT_ROOT);
            } else
            if (urlw.in_youtube_movie_page()) {
                const tags = ["ytd-comments#comments", "div#panels"];
                this.required_listener = tags.length;
                this.add_click_listener(tags);
            } else 
            if (urlw.in_youtube_channel_post()) {
                const tags = [TAG_COMMMENT_SECTION];
                this.required_listener = tags.length;
                this.add_click_listener(tags, TAG_POST_ROOT);
            }
        }
        // コメントノードobserver生成
        if (this.renderer_observer.length == this.required_observer) {
            return;
        }
        if (urlw.in_youtube_short_page()) {
            this.required_observer = 1;
            this.create_observer(TAG_SHORT_ROOT, TAG_SHORT_COMMENT_SECTION);
        } else
        if (urlw.in_youtube_movie_page()) {
            this.required_observer = 2;
            const tag_primary = "div#primary-inner";
            this.create_observer(tag_primary, TAG_COMMMENT_SECTION);
            const tag_panels = "div#panels";
            this.create_observer(tag_panels, TAG_COMMMENT_SECTION);
        } else
        if (urlw.in_youtube_channel_post()) {
            this.required_observer = 1;
            this.create_observer(TAG_POST_ROOT, TAG_COMMMENT_SECTION);
        }
    }

    /*!
     *  @brief  コメントを持つページから脱出callback
     */
    callback_exit_have_comment_page() {
        let renderer_parent = [];
        // observer切断
        for (const obs of this.renderer_observer) {
            obs.obs.disconnect();
            obs.obs_attr.disconnect();
            renderer_parent.push(obs.elem);
        }
        this.renderer_observer = [];
        this.required_observer = -1;
        //
        this.wait_comment_map = new Map();
        // event-listener削除
        for (const key in this.click_listener) {
            const ls = this.click_listener[key];
            ls.root.removeEventListener('click', ls.func);
        }
        this.click_listener = [];
        this.required_listener = -1
        // 使い回されるのでstateは消す
        for (const e_parent of renderer_parent) {
            const e_contents = HTMLUtil.search_children(e_parent, is_contents);
            this.remove_comments_state(e_contents);
        }
    }
    /*!
     *  @brief  short切替時callback
     */
    callback_turn_short() {
        let renderer_parent = [];
        // 念の為observer切断
        for (const obj of this.renderer_observer) {
            obj.obs.disconnect;
            obj.obs_attr.disconnect;
            renderer_parent.push(obj.elem);
        }
        this.renderer_observer = [];
        // 使い回されるのでstateは消す
        for (const e_parent of renderer_parent) {
            const e_contents = HTMLUtil.search_children(e_parent, is_contents);
            this.remove_comments_state(e_contents);
        }
    }


    tell_get_channel_id(unique_name) {
        let wait_map = this.wait_comment_map;
        let array = wait_map.get(unique_name);
        if (array == null) {
            return;
        }
        const channel_info_accessor = this.channel_info_accessor;
        const storage = this.storage;
        for (const it of array) {
            const comment_root = HTMLUtil.search_parent_node(it, e=>{
                return e.localName === TAG_COMMENT_ROOT;
            });
            const ret = filtering_unit(wait_map, it, channel_info_accessor, storage);
            if (ret.result) {
                remove_comment(comment_root);
            }
            if (ret.state !== YoutubeFilteringUtil.STATE_WAIT) {
                YoutubeFilteringUtil.set_state(comment_root, ret.state);
            }
        }
        wait_map.delete(unique_name);
    }

    /*!
     *  @param storage                  ストレージインスタンス
     *  @param channel_info_accessor    チャンネル情報
     */
    constructor(storage, channel_info_accessor) {
        this.storage = storage;
        this.renderer_observer = [];
        this.required_observer = -1;
        this.channel_info_accessor = channel_info_accessor;
        this.wait_comment_map = new Map();
        this.click_listener = [];
        this.required_listener = -1;
    }
}
