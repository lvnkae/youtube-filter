/*!
 *  @brief  動画/プレイ/MIXリストにフィルタをかける
 *  @param  elem            対象ノード
 *  @param  storage         StorageDataクラスインスタンス
 *  @param  data_counter    YoutubeDataCounterクラスインスタンス
 *  @retval true            処理打ち切りまたは要素削除
 */
function filtering_lockup_vm_content(elem, storage, data_counter) {
    const renderer_root = YoutubeUtil.search_renderer_root(elem);
    if (renderer_root == null) {
        return true;
    }
    YoutubeUtil.remove_renderer_node_channel_id(renderer_root);
    //
    const elem_title = YoutubeUtil.get_lockup_vm_title_elem(elem);
    if (elem_title == null) {
        return true;
    }
    const title
        = text_utility.remove_blank_line_and_head_space(elem_title.textContent);
    if (storage.title_filter(title)) {
        renderer_root.remove();
        return true;
    }
    const elem_ch_link = YoutubeUtil.get_lockup_vm_channel_link_element(elem);
    let channel = '';
    let channel_id = null;
    if (elem_ch_link == null) {
        // チャンネルlinkノードがない[MIXリスト/collabo-channel]
        const elem_link = YoutubeUtil.get_lockup_vm_link_elem(elem);
        if (elem_link == null) {
            return true;
        }
        const url = elem_link.href;
        if (YoutubeUtil.is_mixlist_link(url)) {
            YoutubeFilteringUtil.completed(renderer_root);
            return false;
        }
        const video_id = YoutubeUtil.cut_movie_hash(url);
        const channel_info = data_counter.get_channel_info(video_id);
        if (channel_info == null ||
            channel_info.id == null ||
            channel_info.name == null) {
            YoutubeFilteringUtil.set_collabo(renderer_root);
            YoutubeUtil.clear_attribute_channel_name(renderer_root);
            data_counter.entry_channel_id_request(video_id);
            return false;
        } else {
            channel = channel_info.name;
            channel_id = channel_info.id;
            const elem_channel = YoutubeUtil.get_lockup_vm_channel_element(elem);
            const collabo_ch = elem_channel.textContent;
            const channel_2nd = YoutubeUtil.cut_collabo_channel_2nd(channel, collabo_ch);
            if (channel_2nd != null) {
                if (storage.channel_filter(channel_2nd, title)) {
                    renderer_root.remove();
                    return true;
                }
            }
            YoutubeUtil.set_attribute_channel_name(renderer_root, channel);
        }
    } else {
        channel = elem_ch_link.textContent;
    }
    if (storage.channel_filter(channel, title)) {
        renderer_root.remove();
        return true;
    }
    if (channel_id == null) {
        const author_url = elem_ch_link.href;
        channel_id
            = data_counter.get_channel_id_from_author_url_or_entry_request(author_url);
        if (channel_id == null) {
            YoutubeFilteringUtil.set_wait(renderer_root);
            return false;
        }
    }
    return YoutubeFilteringUtil.filtering_renderer_node_by_channel_id(renderer_root,
                                                                      channel_id,
                                                                      title,
                                                                      null,
                                                                      storage);
}
/*!
 *  @brief  動画/プレイ/MIXリストにフィルタをかける
 *  @param  elem            対象ノード
 *  @param  channel_code    ユーザ名/カスタムチャンネル名/ハンドル
 *  @param  channel_id      チャンネルID
 *  @param  storage         StorageDataクラスインスタンス
 */
function filtering_lockup_vm_content_by_channel_id(elem,
                                                   channel_code,
                                                   channel_id,
                                                   storage) {
    const renderer_root = YoutubeUtil.search_renderer_root(elem);
    if (renderer_root == null) {
        return;
    }
    const elem_link = YoutubeUtil.get_lockup_vm_channel_link_element(elem);
    if (elem_link == null) {
        return;
    }
    const author_url = elem_link.href;
    if (YoutubeUtil.cut_channel_author2(author_url) !== channel_code) {
        return;
    }
    const elem_title = YoutubeUtil.get_lockup_vm_title_elem(elem);
    if (elem_title == null) {
        return;
    }
    const title
        = text_utility.remove_blank_line_and_head_space(elem_title.textContent);
    YoutubeFilteringUtil.filtering_renderer_node_by_channel_id(renderer_root,
                                                               channel_id,
                                                               title,
                                                               null,
                                                               storage);        
}

/*!
 *  @brief  動画/プレイリストにフィルタをかける(collabo-channel)
 *  @param  elem                対象ノード
 *  @param  content_id          ID(動画ID/プレイリストID)
 *  @param  channel_id          チャンネルID
 *  @param  storage             StorageDataクラスインスタンス
 *  @param  video_info_accessor VideoInfoAccessorクラスインスタンス
 */
function filtering_lockup_vm_collabo_by_channel_id(renderer_root,
                                                   content_id,
                                                   channel_id,
                                                   storage,
                                                   video_info_accessor) {
    const elem_link = YoutubeUtil.get_lockup_vm_link_elem(renderer_root);
    if (elem_link == null) {
        return;
    }
    const url = elem_link.href;
    if (YoutubeUtil.is_mixlist_link(url)) {
        return;
    } else
    if (YoutubeUtil.is_list_link(url)) {
        return;
    } else {
        if (content_id != YoutubeUtil.get_video_hash_by_link(url)) {
            return;
        }
    }
    const elem_title = YoutubeUtil.get_lockup_vm_title_elem(renderer_root);
    if (elem_title == null) {
        return;
    }
    const title
        = text_utility.remove_blank_line_and_head_space(elem_title.textContent);
    const channel = video_info_accessor.get_channel_name(content_id);
    if (storage.channel_filter(channel, title)) {
        renderer_root.remove();
        return;
    }
    const elem_channel = YoutubeUtil.get_lockup_vm_channel_element(renderer_root);
    const channel_2nd = YoutubeUtil.cut_collabo_channel_2nd(channel,
                                                            elem_channel.textContent);
    if (channel_2nd != null) {
        // pair-collabo例外
        // 2番目のチャンネルにもフィルタを適用
        if (storage.channel_filter(channel_2nd, title)) {
            renderer_root.remove();
            return;
        }
    }
    if (YoutubeFilteringUtil.filtering_renderer_node_by_channel_id(renderer_root,
                                                                   channel_id,
                                                                   title,
                                                                   null,
                                                                   storage)){
        return;
    }
    YoutubeUtil.set_attribute_channel_name(renderer_root, channel);
}

/*!
 *  @brief  コンテンツフィルタ(チャンネルページ)
 *  @param  elem            コンテンツ(動画/playlist)ノード
 *  @param  elem_title      タイトルノード
 *  @param  channel_func    チャンネルノード取得関数
 *  @param  channel_info    チャンネルページ情報
 *  @note   個人チャンネルページの「チャンネル名省略形式」にも対応
 */
function filtering_channel_content(elem,
                                   elem_title,
                                   channel_func,
                                   channel_info,
                                   storage,
                                   data_counter) {
    const renderer_root = YoutubeUtil.search_renderer_root(elem);
    if (renderer_root == null) {
        return;
    }
    YoutubeUtil.remove_renderer_node_channel_id(renderer_root);
    //
    if (elem_title == null) {
        return;
    }
    const title
        = text_utility.remove_blank_line_and_head_space(elem_title.textContent);
    if (storage.title_filter(title)) {
        renderer_root.remove();
        return;
    }
    //
    let channel = channel_info.name;
    let channel_id = channel_info.id;
    //
    const b_lockup_vm = channel_func != YoutubeUtil.get_channel_name_element;
    let elem_ch_links = { length:0 }
    const elem_channel = channel_func(elem);
    if (elem_channel == null) {
        // チャンネル名表記なしplaylists例外
        if (b_lockup_vm) {
            YoutubeUtil.set_attribute_channel_name(renderer_root, channel);
        }
    } else {
        elem_ch_links = elem_channel.querySelectorAll("a");
    }
    if (b_lockup_vm && elem_ch_links.length == 2) {
        // アルバム(?)用のcollabo-channel特殊処理
        let rmv = false;
        for (const link of elem_ch_links) {
            const channel = link.textContent;
            if (storage.channel_filter(channel, title)) {
                renderer_root.remove();
                rmv = true;
                break;
            }
        }
        if (rmv) {
            return;
        } else {
            YoutubeUtil.set_attribute_channel_name(renderer_root, channel);
        }
    } 
    if (elem_ch_links.length == 1) {
        const elem_ch_link = elem_ch_links[0];
        const author_url = elem_ch_link.href;
        if (author_url == null || author_url === "") {
            // 複合チャンネル
            const collabo_ch = elem_channel.textContent;
            // 主チャンネルは必ず含まれてるはず
            if (storage.channel_filter(channel, title)) {
                renderer_root.remove();
                return;
            }
            const ret = YoutubeUtil.is_collabo_channel(channel, collabo_ch);
            if (!ret.result) {
                // 別のチャンネルが1st
                const video_id = YoutubeUtil.cut_movie_hash(elem_title.href);
                const channel2nd_info = data_counter.get_channel_info(video_id);
                if (channel2nd_info == null) {
                    data_counter.entry_channel_id_request(video_id);
                    return;
                } else {
                    channel = channel2nd_info.name;
                    channel_id = channel2nd_info.id;
                }
            } else {
                // ページ主が1st
                if (ret.ch2nd != null) {
                    if (storage.channel_filter(ret.ch2nd, title)) {
                        renderer_root.remove();
                        return;
                    }
                }
            }
            // contextMenu用に書き込み
            YoutubeUtil.set_attribute_channel_name(renderer_root, channel);
        } else if (YoutubeUtil.is_channel_link(author_url)) {
            // チャンネル名なしplaylist(list_url)を弾く
            // 別チャンネル
            channel_id
                = data_counter.get_channel_id_from_author_url_or_entry_request(author_url);
            if (channel_id == null) {
                YoutubeFilteringUtil.set_wait(renderer_root);
                return;
            }
        }
    }
    YoutubeFilteringUtil.filtering_renderer_node_by_channel_id(renderer_root,
                                                               channel_id,
                                                               title,
                                                               null,
                                                               storage);
}
/*!
 *  @brief  動画(チャンネルページ)にdo_funcを実行
 */
function each_channel_videos(do_func) {
    const tag_title = YoutubeUtil.get_content_title_tag();
    const tag_channel = YoutubeUtil.get_channel_link_tag();
    // horizontal-list、ytd-grid-renderer両対応
    const tag_grid_video = "div#meta.style-scope.ytd-grid-video-renderer";
    for (const elem of document.body.querySelectorAll(tag_grid_video)) {
        do_func(elem, tag_title, tag_channel);
    }
}
/*!
 *  @brief  動画(チャンネルページ)にフィルタをかける
 *  @param  channel_info    当該ページチャンネル情報
 */
function filtering_channel_videos(channel_info, storage, data_counter) {
    each_channel_videos((elem, tag_title)=> {
        filtering_channel_content(elem,
                                  elem.querySelector(tag_title),
                                  YoutubeUtil.get_channel_name_element,
                                  channel_info,
                                  storage,
                                  data_counter);
    });
}
/*!
 *  @brief  動画(チャンネルページ)にフィルタをかける
 *  @param  channel_code    ユーザ名/カスタムチャンネル名/ハンドル
 *  @param  channel_id      チャンネルID
 *  @param  fl_func         フィルタ関数
 *  @note   動画更新情報(xml)またはチャンネル情報(html)↓
 *  @note   取得完了通知後処理から呼ばれる
 */
function filtering_channel_videos_by_channel_id(channel_code, channel_id, fl_func) {
    each_channel_videos((elem, tag_title, tag_channel)=> {
        fl_func(elem, tag_title, tag_channel, channel_code, channel_id);
    });
}


function filtering_channel_lists(p_parent, channel_info, storage, data_counter,
                                 channel_func) {
    YoutubeFilteringUtil.each_lockup_view_model_fresh((elem)=>{
        const elem_title = YoutubeUtil.get_lockup_vm_title_elem(elem);
        filtering_channel_content(elem,
                                  elem_title,
                                  channel_func,
                                  channel_info,
                                  storage,
                                  data_counter);
    }, p_parent);
}


/*!
 *  @class  Youtubeフィルタ
 */
class YoutubeFilter extends FilterBase {
    /*!
     *  @brief  動画フィルタ
     *  @param  elem        親ノード
     *  @param  tag_title   動画タイトルタグ
     *  @param  tag_channel 動画チャンネルタグ
     *  @retval true        処理打ち切りまたは要素削除
     */
    filtering_video(elem, tag_title, tag_channel) {
        const renderer_root = YoutubeUtil.search_renderer_root(elem);
        if (renderer_root == null) {
            return true;
        }
        YoutubeUtil.remove_renderer_node_channel_id(renderer_root);
        //
        const elem_title = elem.querySelector(tag_title);
        if (elem_title == null) {
            return true;
        }
        const storage = this.storage;
        const title
            = text_utility.remove_blank_line_and_head_space(elem_title.textContent);
        if (storage.title_filter(title)) {
            renderer_root.remove();
            return true;
        }
        const url = elem_title.href;
        if (url == null) {
            return true;
        }
        if (storage.is_mute_shorts()) {
            if (YoutubeUtil.is_shorts(url)) {
                renderer_root.remove();
                return true;
            }
        }
        const elem_channel
            = HTMLUtil.find_first_appearing_element(elem, tag_channel);
        if (elem_channel == null) {
            return true;
        }        
        let channel = ''
        let channel_id = null;
        let author_url = elem_channel.href;
        if (author_url === "") {
            // urlがなかったらcollabo-chnnnel
            const video_info_accessor = this.video_info_accessor;
            const video_id = YoutubeUtil.cut_movie_hash(url);
            const channel_info = video_info_accessor.get_channel_info(video_id);
            if (channel_info == null ||
                channel_info.id == null ||
                channel_info.name == null) {
                YoutubeFilteringUtil.set_collabo(renderer_root);
                video_info_accessor.entry(video_id);
                return false;
            } else {
                channel = channel_info.name;
                channel_id = channel_info.id;
                const collabo_ch = YoutubeUtil.get_attributed_channel_name(elem);
                const channel_2nd
                    = YoutubeUtil.cut_collabo_channel_2nd(channel, collabo_ch);
                if (channel_2nd != null) {
                    if (storage.channel_filter(channel_2nd, title)) {
                        renderer_root.remove();
                        return true;
                    }
                }
                // ContentMenu用に書き込み
                YoutubeUtil.set_attribute_channel_name(renderer_root, channel);
            }
        } else {
            channel = elem_channel.textContent;
        }
        if (storage.channel_filter(channel, title)) {
            renderer_root.remove();
            return true;
        }
        const dc = this.data_counter;
        if (channel_id == null) {
            channel_id
                = dc.get_channel_id_from_author_url_or_entry_request(author_url);
            if (channel_id == null) {
                YoutubeFilteringUtil.set_wait(renderer_root);
            }
        }
        return YoutubeFilteringUtil.filtering_renderer_node_by_channel_id(renderer_root,
                                                                          channel_id,
                                                                          title,
                                                                          null,
                                                                          storage);
    }

    /*!
     *  @brief  動画フィルタリング手続き
     *  @note   フィルタリング呼び出しとマーカー処理のセット
     */
    filtering_video_procedure(elem, tag_title, tag_channel) {
        // ytd-video-rendererノードは使い回される(tab切り替え時など)
        // ただマークするだけだと動画が差し替えられた時にフィルタされない
        // tab切り替え時にclear処理を入れてもタイミング的に×
        // → 動画ハッシュをマーカーとし、前回と一致した場合のみ弾く
        const marker = YoutubeUtil.get_filtered_marker(elem);
        const hash = YoutubeUtil.get_video_hash(elem, tag_title);
        if (marker != null && hash == marker) {
            return;
        }
        YoutubeUtil.remove_filtered_marker(elem);
        YoutubeUtil.clear_attribute_channel_name(YoutubeUtil.search_renderer_root(elem));
        //
        if (this.filtering_video(elem, tag_title, tag_channel)) {
            return;
        }
        //
        YoutubeUtil.set_filtered_marker(elem, hash);
    }    

    /*!
     *  @brief  動画フィルタ(チャンネルコード)
     *  @param  elem            親ノード
     *  @param  tag_title       動画タイトルタグ
     *  @param  tag_channel     動画チャンネルタグ
     *  @param  channel_code    ユーザ名/カスタムチャンネル名/ハンドル
     *  @param  channel_id      チャンネルID
     *  @param  chk_func        チャンネル判別関数
     *  @retval true            処理打ち切りまたは要素削除
     *  @note   チャンネルコードを基点とした動画フィルタ
     */
    filtering_video_by_channel_code(elem, tag_title, tag_channel,
                                    channel_code, channel_id, chk_func) {
        const renderer_root = YoutubeUtil.search_renderer_root(elem);
        if (renderer_root == null) {
            return true;
        }
        const elem_channel = HTMLUtil.find_first_appearing_element(elem, tag_channel);
        if (elem_channel == null) {
            return true;
        }
        const author_url = elem_channel.href;
        if (author_url == null) {
            return true;
        }
        if (!chk_func(author_url)) {
            return true;
        }
        if (channel_code != YoutubeUtil.cut_channel_author2(author_url)) {
            return true;
        }
        const elem_title = elem.querySelector(tag_title);
        if (elem_title == null) {
            return true;
        }
        const title
            = text_utility.remove_blank_line_and_head_space(elem_title.textContent);
        return YoutubeFilteringUtil.filtering_renderer_node_by_channel_id(renderer_root,
                                                                          channel_id,
                                                                          title,
                                                                          null,
                                                                          this.storage);
    }
    /*!
     *  @brief  動画フィルタ(ユーザ名)
     *  @param  elem        親ノード
     *  @param  tag_title   動画タイトルタグ
     *  @param  tag_channel 動画チャンネルタグ
     *  @param  username    ユーザ名
     *  @param  channel_id  チャンネルID
     *  @retval true        処理打ち切りまたは要素削除
     */
    filtering_video_by_username(elem, tag_title, tag_channel, username, channel_id) {
        return this.filtering_video_by_channel_code(elem,
            tag_title,
            tag_channel,
            username,
            channel_id,
            YoutubeUtil.is_userpage_url);
    }
    /*!
     *  @brief  動画フィルタ(カスタムチャンネル名/ハンドル)
     *  @param  elem        親ノード
     *  @param  tag_title   動画タイトルタグ
     *  @param  tag_channel 動画チャンネルタグ
     *  @param  unique_name 独自チャンネル名
     *  @param  channel_id  チャンネルID
     *  @retval true        処理打ち切りまたは要素削除
     */
    filtering_video_by_unique_name(elem, tag_title, tag_channel,
                                   unique_name, channel_id) {
        return this.filtering_video_by_channel_code(elem,
            tag_title,
            tag_channel,
            unique_name,
            channel_id,
            YoutubeUtil.is_uniquepage_url);
    }
    /*!
     *  @brief  動画フィルタ(collabo-channel)
     *  @param  video_id    動画ID
     *  @param  channel_id  チャンネルID
     *  @param  tag_marker  marker保持ノードタグ
     *  @param  tag_title   動画タイトルタグ
     */    
    filtering_collabo_video_by_channel_id(video_id, channel_id, tag_marker, tag_title) {
        const tag_elem = `${tag_marker}[marker="${video_id}"]`;
        const tag_channel = YoutubeUtil.get_channel_link_tag();                                    
        for (const elem of document.body.querySelectorAll(tag_elem)) {
            const renderer_root = YoutubeUtil.search_renderer_root(elem);
            const elem_title = elem.querySelector(tag_title);
            const elem_channel
                = HTMLUtil.find_first_appearing_element(elem, tag_channel);
            if (renderer_root == null || elem_title == null || elem_channel == null) {
                continue;
            }
            const title
                = text_utility.remove_blank_line_and_head_space(elem_title.textContent);
            const storage = this.storage;
            if (storage.channel_id_filter(channel_id, title)) {
                renderer_root.remove();
                continue;
            }
            const channel = this.video_info_accessor.get_channel_name(video_id);
            if (storage.channel_filter(channel, title)) {
                renderer_root.remove();
                continue;
            }
            const collabo_ch = YoutubeUtil.get_attributed_channel_name(elem);
            const channel_2nd
                = YoutubeUtil.cut_collabo_channel_2nd(channel, collabo_ch);
            if (channel_2nd != null && storage.channel_filter(channel_2nd, title)) {
                renderer_root.remove();
                continue;
            }
            YoutubeUtil.set_attribute_channel_name(renderer_root, channel);
            YoutubeUtil.set_renderer_node_channel_id(renderer_root, channel_id);
        }
    }

    /*!
     *  @brief  動画フィルタ(collabo-channel)
     *  @param  video_id    動画ID
     *  @param  channel_id  チャンネルID
     */
    filtering_videos_by_channel_id(video_id, channel_id) {
        const storage = this.storage;
        const urlw = this.current_location;
        const video_info_accessor = this.video_info_accessor;
        if (urlw.in_top_page()) {
            YoutubeFilteringUtil.each_rich_grid_renderer((rc_grid)=>{
                YoutubeFilteringUtil.each_lockup_view_model_collabo((elem)=> {
                    filtering_lockup_vm_collabo_by_channel_id(elem,
                                                              video_id,
                                                              channel_id,
                                                              storage,
                                                              video_info_accessor);
                }, rc_grid);
            });
        } else if (urlw.in_youtube_search_page()) {
            this.filtering_searched_collabo_by_channel_id(video_id, channel_id);
        } else if (urlw.in_youtube_sports_or_live() ||
                   urlw.in_youtube_hashtag() ||
                   urlw.in_youtube_news()) {
            this.filtering_sp_channel_collabo_by_channel_id(video_id, channel_id);
        } else if (urlw.in_youtube_any_channnel_page() ||
                   urlw.in_youtube_gaming()) {
            this.filtering_channel_page_collabo_by_channel_id(video_id, channel_id);
        }
    }

    /*!
     *  @brief  動画(検索)にフィルタをかける
     */
    filtering_searched_video() {
        const tag_video_renderer = ".text-wrapper.style-scope.ytd-video-renderer";
        const tag_title = YoutubeUtil.get_content_title_tag();
        const tag_channel = YoutubeUtil.get_channel_link_tag();
        for (const elem of document.body.querySelectorAll(tag_video_renderer)) {
            this.filtering_video_procedure(elem, tag_title, tag_channel);
        }
    }
    /*!
     *  @brief  動画(検索)にフィルタをかける
     *  @param  channel_code    ユーザ名/カスタムチャンネル名/ハンドル
     *  @param  channel_id      チャンネルID
     *  @param  fl_func         フィルタ関数
     *  @note   チャンネルコードを持つ動画のフィルタリング
     *  @note   チャンネルID受信処理から呼ばれる
     */
    filtering_searched_video_by_channel_id(channel_code, channel_id, fl_func) {
        const tag_video_renderer = ".text-wrapper.style-scope.ytd-video-renderer";
        const tag_title = YoutubeUtil.get_content_title_tag();
        const tag_channel = YoutubeUtil.get_channel_link_tag();
        for (const elem of document.body.querySelectorAll(tag_video_renderer)) {
            fl_func(elem, tag_title, tag_channel, channel_code, channel_id);
        }
    }
    /*!
     *  @brief  動画(検索)にフィルタをかける
     *  @param  channel_code    ユーザ名/カスタムチャンネル名/ハンドル
     *  @param  channel_id      チャンネルID
     *  @param  fl_func         フィルタ関数
     *  @note   チャンネルコードを持つ動画のフィルタリング
     *  @note   チャンネルID受信処理から呼ばれる
     */
    filtering_searched_collabo_by_channel_id(video_id, channel_id) {
        const tag_marker = "div.text-wrapper.style-scope.ytd-video-renderer";
        const tag_title = YoutubeUtil.get_content_title_tag();
        this.filtering_collabo_video_by_channel_id(video_id, channel_id,
                                                   tag_marker, tag_title);
    }
    /*!
     *  @brief  動画(検索)のマーカーをクリアする
     *  @note   ContextMenu用
     */
    clear_searched_video_marker() {
        const tag_video_renderer = ".text-wrapper.style-scope.ytd-video-renderer";
        for (const elem of document.body.querySelectorAll(tag_video_renderer)) {
            YoutubeUtil.remove_filtered_marker(elem);
        }
    }

    /*!
     *  @brief  チャンネル(検索)にフィルタをかける
     *  @note   動画検索(フィルタなし)時に差し込まれるチャンネルタイルの除去
     */
    filtering_searched_channel() {
        const storage = this.storage;
        const data_counter = this.data_counter;
        for (const elem of document.body.getElementsByTagName("ytd-channel-renderer")) {
            const channel = YoutubeUtil.get_channel_name(elem);
            if (storage.channel_filter(channel)) {
                elem.remove();
                continue;
            }
            const e_channel_link = elem.querySelector("a#main-link");
            if (e_channel_link == null) {
                continue;
            }
            const author_url = e_channel_link.href;
            const channel_id
                = data_counter.get_channel_id_from_author_url_or_entry_request(
                    author_url);
            YoutubeFilteringUtil.filtering_renderer_node_by_channel_id(elem,
                                                                       channel_id,
                                                                       null, null,
                                                                       storage);
        }
    }
    /*!
     *  @brief  チャンネル(検索)にフィルタをかける
     *  @param  channel_code    ユーザ名/カスタムチャンネル名/ハンドル
     *  @param  channel_id      チャンネルID
     *  @param  chk_func        チャンネル判別関数
     *  @note   動画更新情報(xml)またはチャンネル情報(html)↓
     *  @note   取得完了通知後処理から呼ばれる
     */
    filtering_searched_channel_by_channel_id(channel_code, channel_id, chk_func) {
        const storage = this.storage;
        for (const elem of document.body.getElementsByTagName("ytd-channel-renderer")) {
            const e_channel_link = elem.querySelector("a#main-link");
            if (e_channel_link == null) {
                continue;
            }
            const author_url = e_channel_link.href;
            if (!chk_func(author_url)) {
                continue;
            }
            if (channel_code !== YoutubeUtil.cut_channel_author2(author_url)) {
                continue;
            }
            if (storage.channel_id_filter(channel_id)) {
                elem.remove();
                continue;
            }
            YoutubeUtil.set_renderer_node_channel_id(elem, channel_id);
        }
    }

    /*!
     *  @brief  プレイリスト/MIXリスト(検索)にフィルタをかける
     *  @note   24年11月以降の構成に対応
     */
    filtering_searched_lists() {
        const storage = this.storage;
        const data_counter = this.data_counter;
        YoutubeFilteringUtil.each_item_section_renderer((section)=>{
            YoutubeFilteringUtil.each_lockup_view_model((elem)=> {
                const marker = YoutubeUtil.get_filtered_marker(elem);
                const elem_link = YoutubeUtil.get_lockup_vm_link_elem(elem);
                const hash = YoutubeUtil.get_playlist_hash_by_node(elem_link);
                if (marker != null && hash == marker) {
                    return;
                }
                YoutubeUtil.remove_filtered_marker(elem);
                //
                if (filtering_lockup_vm_content(elem, storage, data_counter)) {
                    return;
                }
                //
                YoutubeUtil.set_filtered_marker(elem, hash);
            }, section);
        });
    }
    filtering_searched_list_by_channel_id(channel_code, channel_id) {
        const storage = this.storage;
        YoutubeFilteringUtil.each_item_section_renderer((section)=>{
            YoutubeFilteringUtil.each_lockup_view_model_wait((elem)=> {
                filtering_lockup_vm_content_by_channel_id(elem,
                                                          channel_code,
                                                          channel_id,
                                                          storage);
            }, section);
        });
    }
    /*!
     *  @brief  プレイリスト/MIXリスト(検索)のマーカーをクリアする
     *  @note   ContextMenu用
     */
    clear_searched_lists_marker() {
        YoutubeFilteringUtil.each_item_section_renderer((section)=>{
            YoutubeFilteringUtil.each_lockup_view_model((elem)=> {
                YoutubeUtil.remove_filtered_marker(elem);
            }, section);
        });
    }

    /*!
     *  @brief  チャンネルページ検索にフィルタをかける
     */
    filtering_channel_search() {
        const tag_title = YoutubeUtil.get_content_title_tag();
        const tag_channel = YoutubeUtil.get_channel_link_tag();
        YoutubeFilteringUtil.each_item_section_renderer((section)=>{
            YoutubeFilteringUtil.each_video_renderer_fresh((elem)=>{
                this.filtering_video(elem, tag_title, tag_channel);
            },section);
        });
        const tag_pl_title
            = "a.yt-simple-endpoint.style-scope.ytd-playlist-renderer";
        YoutubeFilteringUtil.each_item_section_renderer((section)=>{
            YoutubeFilteringUtil.each_playlist_renderer_fresh((elem)=>{
                this.filtering_video(elem, tag_pl_title, tag_channel);
            },section);
        });
    }    
    /*!
     *  @note  チャンネルID受信処理から呼ばれる
     */
    filtering_channel_search_by_channel_id(channel_code, channel_id, fl_func) {
        const tag_title = YoutubeUtil.get_content_title_tag();
        const tag_channel = YoutubeUtil.get_channel_link_tag();
        YoutubeFilteringUtil.each_item_section_renderer((section)=>{
            YoutubeFilteringUtil.each_video_renderer_wait((elem)=>{
                fl_func(elem, tag_title, tag_channel, channel_code, channel_id);
            },section);
        });
        const tag_pl_title
            = "a.yt-simple-endpoint.style-scope.ytd-playlist-renderer";
        YoutubeFilteringUtil.each_item_section_renderer((section)=>{
            YoutubeFilteringUtil.each_playlist_renderer_wait((elem)=>{
                fl_func(elem, tag_pl_title, tag_channel, channel_code, channel_id);
            },section);
        });
    }    

    /*!
     *  @param  チャンネル所属コンテンツにフィルタをかける
     *  @param  channel_code    ユーザ名/カスタムチャンネル名/ハンドル
     *  @param  channel_id      チャンネルID
     *  @note   チャンネル名省略形式用
     *  @note   チャンネルID受信処理から呼ばれる
     */
    filtering_channel_private_contents_by_channel_id(channel_code, channel_id) {
        const storage = this.storage;
        const fl_func = (elem, tag_title, channel_func)=> {
            fl_dir_func(elem, elem.querySelector(tag_title), channel_func);
        }
        const fl_dir_func = (elem, elem_title, channel_func)=> {
            const renderer_root = YoutubeUtil.search_renderer_root(elem);
            if (renderer_root == null) {
                return false;
            }
            const elem_channel = channel_func(elem);
            const is_personal
                = (elem_channel == null
                || YoutubeUtil.cut_channel_author2(elem_channel.href) === channel_code);
            if (!is_personal) {
                return false;   
            }
            const ret = YoutubeFilteringUtil.filtering_renderer_node_by_channel_id(
                        renderer_root,
                        channel_id,
                        elem_title.textContent,
                        null,
                        storage);
            return ret;
        };
        const lvm_channel_func = YoutubeUtil.get_lockup_vm_channel_link_element;
        // Home>Videos
        each_channel_videos((elem, tag_title)=> {
            fl_func(elem, tag_title, lvm_channel_func);
        });
        // Videos/Live
        YoutubeFilteringUtil.each_rich_grid_media_wait((elem, tag_title)=> {
            fl_func(elem, tag_title, lvm_channel_func);
        });
        // 24年11月以降の構成に対応/Playlists
        YoutubeFilteringUtil.each_grid_renderer((grid)=>{
            YoutubeFilteringUtil.each_lockup_view_model_wait((elem)=> {
                const elem_title = YoutubeUtil.get_lockup_vm_title_elem(elem);
                fl_dir_func(elem, elem_title, lvm_channel_func);
            }, grid);
        });
        // Home>playlists
        YoutubeFilteringUtil.each_horizontal_list_renderer((horizontal)=>{
            YoutubeFilteringUtil.each_lockup_view_model_wait((elem)=> {
                const elem_title = YoutubeUtil.get_lockup_vm_title_elem(elem);
                fl_dir_func(elem, elem_title, lvm_channel_func);
            }, horizontal);
        });
    }


    /*!
     *  @brief  チャンネル(チャンネルページ)フィルタ
     *  @param  elem        基点ノード
     *  @param  tag_title   チャンネル名タグ
     *  @param  tag_link    チャンネルURLタグ
     */
    filtering_channel_channel(elem, tag_title, tag_link) {
        const renderer_root = YoutubeUtil.search_renderer_root(elem);
        if (renderer_root == null) {
            return;
        }
        const elem_chname = elem.querySelector(tag_title);
        const elem_chlink = elem.querySelector(tag_link);
        if (elem_chname == null || elem_chlink == null) {
            return;
        }
        const channel = elem_chname.textContent;
        if (this.storage.channel_filter(channel)) {
            renderer_root.remove();
            return;
        }
        const author_url = elem_chlink.href;
        const dc = this.data_counter;
        const channel_id
            = dc.get_channel_id_from_author_url_or_entry_request(author_url);
        YoutubeFilteringUtil.filtering_renderer_node_by_channel_id(renderer_root,
                                                                   channel_id,
                                                                   null, null,
                                                                   this.storage);
    }
    filtering_channel_channels_core(filtering_func) {
        const tag_title = "span#title";
        const tag_link = "a#channel-info"
        const tag_learge_reg = "div#channel.style-scope.ytd-grid-channel-renderer";
        for (const elem of document.body.querySelectorAll(tag_learge_reg)) {
            filtering_func(elem, tag_title, tag_link);
        }
    }
    filtering_channel_channels() {
        this.filtering_channel_channels_core((elem, tag_title, tag_link)=> {
            this.filtering_channel_channel(elem, tag_title, tag_link);
        });
    }
    /*!
     *  @brief  チャンネル(チャンネルページ)にフィルタをかける
     *  @param  channel_code    ユーザ名/カスタムチャンネル名/ハンドル
     *  @param  channel_id      チャンネルID
     *  @param  chk_func        チャンネル判別関数
     *  @note   動画更新情報(xml)またはチャンネル情報(html)↓
     *  @note   取得完了通知後処理から呼ばれる
     */
    filtering_channel_channels_by_channel_id(channel_code, channel_id, chk_func) {
        const fl_func = ((elem, tag_link)=>{
            const renderer_root = YoutubeUtil.search_renderer_root(elem);
            if (renderer_root == null) {
                return;
            }
            const elem_chlink = elem.querySelector(tag_link);
            if (elem_chlink == null) {
                return;
            }
            const author_url = elem_chlink.href;
            if (!chk_func(author_url) ||
                channel_code !== YoutubeUtil.cut_channel_author2(author_url)) {
                return;
            }
            if (this.storage.channel_id_filter(channel_id)) {
                renderer_root.remove();
                return;
            }
            YoutubeUtil.set_renderer_node_channel_id(renderer_root, channel_id);
        });
        this.filtering_channel_channels_core((elem, tag_title, tag_link)=> {
            fl_func(elem, tag_link);
        });
    }

    /*!
     *  @brief  チャンネルページにフィルタをかける
     */
    filtering_channel_page() {
        YoutubeUtil.permit_clearing_section_list_header();
        //
        const storage = this.storage;
        const data_counter = this.data_counter;
        //
        let channel_info = {};
        channel_info.name = YoutubeUtil.get_page_channel_name();
        if (channel_info.name == null) {
            return;
        }
        const author_url = YoutubeUtil.get_page_author_url();
        channel_info.id
            = data_counter.get_channel_id_from_author_url_or_entry_request(author_url);
        //
        const t_grid = YoutubeUtil.get_rich_grid_header_tag();
        this.shorts_filter.filtering_slim_videos2(t_grid);
        const t_reel = YoutubeUtil.get_reel_shelf_header_tag();
        this.shorts_filter.filtering_slim_videos2(t_reel);    
        // Home>videos
        filtering_channel_videos(channel_info, storage, data_counter);
        // Vidoes/Live
        YoutubeFilteringUtil.each_rich_grid_media_fresh((elem, tag_title)=> {
            filtering_channel_content(elem, 
                                      elem.querySelector(tag_title),
                                      YoutubeUtil.get_channel_name_element,
                                      channel_info,
                                      storage,
                                      data_counter);
        });
        // 24年11月以降の構成に対応/Playlists
        YoutubeFilteringUtil.each_grid_renderer((grid)=>{
            filtering_channel_lists(grid, channel_info, storage, data_counter,
                                    YoutubeUtil.get_lockup_vm_channel_element);
        });
        // Home>playlists
        YoutubeFilteringUtil.each_horizontal_list_renderer((horizontal)=>{
            filtering_channel_lists(horizontal, channel_info, storage, data_counter,
                                YoutubeUtil.get_lockup_vm_channel_page_channel_element);
        });
        // Home>channels
        this.filtering_channel_channels();
        //
        YoutubeUtil.remove_carousel_banner();
        YoutubeUtil.clearing_section_list_header();
        const e_parent = document.querySelector("div#items.style-scope.ytd-grid-renderer");
        if (e_parent != null) {
            YoutubeUtil.remove_spiner_renderer(e_parent);
        }
    }

    filtering_channel_page_collabo_by_channel_id(video_id) {
        // Home>videos
        const storage = this.storage;
        const data_counter = this.data_counter;
        const ch_url = YoutubeUtil.get_page_author_url();
        const channel_info = {
            name:YoutubeUtil.get_page_channel_name(),
            id:data_counter.get_channel_id_from_author_url_or_entry_request(ch_url) };
        const channel_func = YoutubeUtil.get_channel_name_element;
        each_channel_videos((elem, tag_title)=> {
            const elem_title = elem.querySelector(tag_title);
            const url = elem_title.href;
            if (video_id != YoutubeUtil.get_video_hash_by_link(url)) {
                return;
            }
            filtering_channel_content(elem,
                                      elem_title,
                                      channel_func,
                                      channel_info,
                                      storage,
                                      data_counter);
        });
    }

    /*!
     *  @brief  Videos/Liveのstate削除
     *  @note   ContextMenu用
     */
    clear_channel_content_state() {
        // Home>playlists
        YoutubeFilteringUtil.each_horizontal_list_renderer((horizontal)=>{
            YoutubeFilteringUtil.each_lockup_view_model((elem)=> {
                YoutubeFilteringUtil.remove_state(elem);
            }, horizontal);
        });        
    }

    /*!
     *  @brief  特殊チャンネルページにフィルタをかける
     *  @note   26/02時点では「ニュース」「スポーツ」「ライブ」
     */ 
    filtering_sp_channel_page() {
        const tag_channel = YoutubeUtil.get_channel_link_tag();
        YoutubeFilteringUtil.each_rich_grid_media((elem, tag_title)=> {
            this.filtering_video_procedure(elem, tag_title, tag_channel);
        });
        YoutubeUtil.remove_carousel_banner();
    }
    /*!
     *  @note   チャンネルID受信処理から呼ばれる
     */ 
    filtering_sp_channel_page_by_channel_id(channel_code, channel_id, fl_func) {
        const tag_channel = YoutubeUtil.get_channel_link_tag();
        YoutubeFilteringUtil.each_rich_grid_media((elem, tag_title)=> {
            fl_func(elem, tag_title, tag_channel, channel_code, channel_id);
        });
    }
    /*!
     *  @note   チャンネルID受信処理から呼ばれる
     */ 
    filtering_sp_channel_collabo_by_channel_id(video_id, channel_id) {
        const tag_marker = "div#dismissible.style-scope.ytd-rich-grid-media";
        const tag_title = "#video-title-link";
        this.filtering_collabo_video_by_channel_id(video_id, channel_id,
                                                   tag_marker, tag_title);
    }

    filtering_comments() {
        this.comment_filter.refiltering();
    }

    /*!
     *  @brief  動画(動画再生ページ)にフィルタをかける
     */
    filtering_watch_video() {
        this.recommend_filter.filtering_contents();
        this.recommend_filter.filtering_endscreen_video();
        this.recommend_filter.filtering_fullscreen_videowall();
        const t_reel = YoutubeUtil.get_reel_shelf_header2_tag();
        this.shorts_filter.filtering_slim_videos2(t_reel);
        const t_reel_login = YoutubeUtil.get_reel_shelf_header_tag();
        this.shorts_filter.filtering_slim_videos2(t_reel_login);
    }

    /*!
     *  @brief  動画/プレイリスト/MIXリスト(Youtubeホーム)にフィルタをかける
     */
    filtering_home_contents() {
        // 24年11月以降の構成に対応
        const storage = this.storage;
        const data_counter = this.data_counter;
        YoutubeFilteringUtil.each_rich_grid_renderer((rc_grid)=>{
            YoutubeFilteringUtil.each_lockup_view_model_fresh((elem)=>{
                filtering_lockup_vm_content(elem, storage, data_counter);
            }, rc_grid);
        });
        //
        const t_rich = YoutubeUtil.get_rich_shelf_header_tag();
        this.shorts_filter.filtering_slim_videos2(t_rich);
    }
    /*!
     *  @brief  動画/プレイリスト(Youtubeホーム)にフィルタをかける
     *  @note   チャンネルID受信処理から呼ばれる
     *  @note   24年11月以降の構成に対応
     */
    filtering_home_lockup_vm_content_by_channel_id(channel_code, channel_id) {
        const storage = this.storage;
        YoutubeFilteringUtil.each_rich_grid_renderer((rc_grid)=>{
            YoutubeFilteringUtil.each_lockup_view_model_wait((elem)=> {
                filtering_lockup_vm_content_by_channel_id(elem,
                                                          channel_code,
                                                          channel_id,
                                                          storage);
            }, rc_grid);
        });
    }
    /*!
     *  @brief  動画/プレイリスト/MIXリスト(Youtubeホーム)のstate削除
     *  @note   ContextMenu用
     */
    clear_home_lockup_vm_state() {
        YoutubeFilteringUtil.each_lockup_view_model((elem)=>{
            YoutubeFilteringUtil.remove_state(elem);
        }, document.body);
    }


    /*!
     *  @brief  フィルタリング
     */
    filtering() {
        const loc = this.current_location;
        this.func_get_collabo_channel_info = YoutubeUtil.get_home_collabo_channel_info;
        if (this.storage.is_mute_shorts()) {
            if (loc.in_top_page() ||
                loc.in_youtube_gaming() ||
                loc.in_youtube_movie_page() ||
                loc.in_youtube_search_page()) {
                YoutubeShortsFilter.remove_whole_header2();
            }
        }
        if (loc.in_youtube_search_page()) {
            this.func_get_collabo_channel_info
                = YoutubeUtil.get_searched_collabo_channel_info;
            this.filtering_searched_video();
            this.filtering_searched_channel();
            this.filtering_searched_lists();
            const t_gs_vm = YoutubeShortsFilter.TAG_GRID_SHELF_VM();
            this.shorts_filter.filtering_slim_videos2(t_gs_vm);
        } else if (loc.in_youtube_channel_search()) {
            this.filtering_channel_search();
        } else if (loc.in_youtube_sports_or_live() ||
                   loc.in_youtube_hashtag() ||
                   loc.in_youtube_news()) {
            this.filtering_sp_channel_page();
        } else if (loc.in_youtube_any_channnel_page() || /*↑でsports/liveを弾いてる*/
                   loc.in_youtube_gaming()) {
            this.filtering_channel_page();
        } else if (loc.in_youtube_short_page()) {
            // ページ切り替わりタイミングでの誤操作抑制
            const act_reel = this.shorts_filter.get_active_reel();
            if (this.active_short_reel == null || act_reel == this.active_short_reel) {
                this.shorts_filter.filtering_video();
            }
        } else if (loc.in_youtube_movie_page()) {
            this.filtering_watch_video();
        } else if (loc.in_top_page() ||
                   loc.in_youtube_feeds())  {
            this.filtering_home_contents();
        } else {
            return;
        }
        this.video_info_accessor.kick();
        this.author_info_accessor.kick();
        this.channel_info_accessor.kick();
        this.playlist_searcher.kick();
    }

    /*!
     *  @brief  ポストフィルタ(チャンネルコード)
     *  @param  channel_code    ユーザ名/カスタムチャンネル名/ハンドル
     *  @param  channel_id      チャンネルID
     *  @param  fl_func         フィルタリング関数
     *  @param  chk_func        urlチェック関数
     *  @note   チャンネルコードを基点とした各種フィルタ処理
     */
    post_filtering_by_channel_code(channel_code, channel_id, fl_func, chk_func) {
        const loc = this.current_location;
        if (loc.in_youtube_movie_page()) {
            this.comment_filter.tell_get_channel_id(channel_code);
        } else if (loc.in_youtube_search_page()) {
            this.filtering_searched_video_by_channel_id(channel_code, channel_id, fl_func);
            this.filtering_searched_channel_by_channel_id(channel_code, channel_id, chk_func);
            this.filtering_searched_list_by_channel_id(channel_code, channel_id, chk_func);
        } else if (loc.in_top_page()) {
            this.filtering_home_lockup_vm_content_by_channel_id(channel_code, channel_id);
        } else if (loc.in_youtube_channel_search()) {
            this.filtering_channel_search_by_channel_id(channel_code, channel_id, fl_func);
        } else if (loc.in_youtube_gaming() ||
                   loc.in_youtube_channel_page() ||
                   loc.in_youtube_user_page() ||
                   loc.in_youtube_custom_channel_page() ||
                   loc.in_youtube_handle_page()) {
            if (channel_code == YoutubeUtil.cut_channel_id(loc.url)) {
                this.filtering_channel_private_contents_by_channel_id(channel_code, channel_id);
            }
            filtering_channel_videos_by_channel_id(channel_code, channel_id, fl_func);
            this.filtering_channel_channels_by_channel_id(channel_code, channel_id, chk_func);
            YoutubeUtil.clearing_section_list_header();
        } else if (loc.in_youtube_short_page()) {
            this.shorts_filter.filtering_video_by_channel_code(channel_code, channel_id, chk_func);
            this.comment_filter.tell_get_channel_id(channel_code);
        } else if (loc.in_youtube_channel_post()) {
            this.comment_filter.tell_get_channel_id(channel_code);
        } else {
            this.filtering_sp_channel_page_by_channel_id(channel_code, channel_id, fl_func);
        }
    }
    /*!
     *  @brief  ポストフィルタ(チャンネルユーザ名)
     *  @note   チャンネルユーザ名を基点とした各種フィルタ処理
     *  @note   チャンネルID受信処理から呼ばれる
     */
    post_filtering_by_username(username, channel_id) {
        const fl_func = this.filtering_video_by_username.bind(this);
        const chk_func = YoutubeUtil.is_userpage_url;
        this.post_filtering_by_channel_code(username, channel_id, fl_func, chk_func);
    }
    /*!
     *  @brief  ポストフィルタ(カスタムチャンネル名/ハンドル)
     *  @note   独自チャンネル名を基点とした各種フィルタ処理
     *  @note   チャンネルID受信処理から呼ばれる
     */
    post_filtering_by_unique_name(unique_name, channel_id) {
        const fl_func = this.filtering_video_by_unique_name.bind(this);
        const chk_func = YoutubeUtil.is_uniquepage_url;
        this.post_filtering_by_channel_code(unique_name, channel_id, fl_func, chk_func);
    }
    /*!
     *  @brief  ポストフィルタ(動画ID)
     *  @note   動画IDを基点とした各種フィルタ処理
     *  @note   チャンネルID受信処理から呼ばれる
     */
    post_filtering_by_video_id(video_id, channel_id) {
        if (this.current_location.in_youtube_movie_page()) {
            this.recommend_filter.filtering_videos_by_channel_id(video_id, channel_id);
        } else {
            this.filtering_videos_by_channel_id(video_id, channel_id);
        }
        this.shorts_filter.filtering_slim_video_by_video_id2(video_id);
    }
    /*!
     *  @brief  ポストフィルタ(リストID)
     *  @note   リストIDを基点とした各種フィルタ処理
     *  @note   チャンネルID受信処理から呼ばれる
     */
    post_filtering_by_playlist_id(list_id, channel_id) {
        this.recommend_filter.filtering_playlists_by_channel_id(list_id, channel_id);
    }

    /*!
     *  @brief  動画情報(json)取得完了通知後処理
     *  @param  obj 動画オブジェクト
     */
    post_proc_tell_get_video_json(obj) {
        if (obj.channel_id != null) {
            if (obj.video_id != null) {
                this.post_filtering_by_video_id(obj.video_id, obj.channel_id);
            } else if (obj.list_id != null) {
                this.post_filtering_by_playlist_id(obj.list_id, obj.channel_id);
            }
        } else if (obj.username) {
            // jsonからチャンネルIDを得られなかった場合はこっち
            const channel_id = this.author_info_accessor.get_channel_id(obj.username);
            if (channel_id != null) {
                if (obj.video_id != null) {
                    this.video_info_accessor.set_channel_id(obj.video_id, channel_id);
                    this.post_filtering_by_video_id(obj.video_id, channel_id);
                } else if (obj.list_id != null) {
                    this.playlist_searcher.set_channel_id(obj.list_id, channel_id);
                    this.post_filtering_by_playlist_id(obj.list_id, channel_id);
                }
            } else {
                // usernameをキーにfeedを得る
                this.author_info_accessor.entry(obj.username);
                this.author_info_accessor.kick();
            }
        } else {
            // jsonからチャンネルIDもuserも得られなかった場合の最終手段
            const unique_name = obj.unique_name;
            const channel_id = this.channel_info_accessor.get_channel_id(unique_name);
            if (channel_id != null) {
                if (obj.video_id != null) {
                    this.video_info_accessor.set_channel_id(obj.video_id, channel_id);
                    this.post_filtering_by_video_id(obj.video_id, channel_id);
                } else if (obj.list_id != null) {
                    this.playlist_searcher.set_channel_id(obj.list_id, channel_id);
                    this.post_filtering_by_playlist_id(obj.list_id, channel_id);
                }
            } else {
                this.channel_info_accessor.entry(obj.unique_name);
                this.channel_info_accessor.kick();
            }
        }
        YoutubeUtil.clearing_section_list_header();
    }
    /*!
     *  @brief  動画情報(json)取得完了通知
     *  @param  result      結果
     *  @param  video_id    動画ID
     *  @param  json        動画情報(json)
     */
    tell_get_video_json(result, video_id, json) {
        if (result === "success") {
            this.video_info_accessor
                .tell_get_json(video_id,
                               json,
                               this.post_proc_tell_get_video_json.bind(this));
        } else if (result === "unauthorized") {
            this.video_searcher.entry(video_id);
            this.video_searcher.kick();
        }
    }

    /*!
     *  @brief  動画更新情報(feed)取得完了通知後処理
     *  @param  obj 動画オブジェクト
     */
    post_proc_tell_get_videos_xml(obj) {
        const video_ids
            = this.video_info_accessor.tell_get_channel_id(obj.username, obj.channel_id);
        for (const video_id of video_ids) {
            this.post_filtering_by_video_id(video_id, obj.channel_id);
        }
        const list_ids
            = this.playlist_searcher.tell_get_channel_id(obj.username, obj.channel_id);
        for (const list_id of list_ids) {
            this.post_filtering_by_playlist_id(list_id, obj.channel_id);
        }        
        this.post_filtering_by_username(obj.username, obj.channel_id);
    }
    /*!
     *  @brief  動画更新情報(feed)取得完了通知
     *  @param  result      結果
     *  @param  username    ユーザページID
     *  @param  xml         動画更新情報(xml)
     */
    tell_get_videos_xml(result, username, xml) {
        if (result === "success") {
            this.author_info_accessor
                .tell_get_xml(username,
                              xml,
                              this.post_proc_tell_get_videos_xml.bind(this));
        }
    }

    /*!
     *  @brief  チャンネル情報(html)取得完了通知後処理
     *  @param  obj 動画オブジェクト
     */
    post_proc_tell_get_channel_html(obj) {
        const video_ids
            = this.video_info_accessor
                  .tell_get_channel_id_by_unique_channel(obj.unique_name,
                                                         obj.channel_id);
        for (const video_id of video_ids) {
            this.post_filtering_by_video_id(video_id, obj.channel_id);
        }
        const list_ids
            = this.playlist_searcher
                  .tell_get_channel_id_by_unique_channel(obj.unique_name,
                                                         obj.channel_id);
        for (const list_id of list_ids) {
            this.post_filtering_by_playlist_id(list_id, obj.channel_id);
        }        
        this.post_filtering_by_unique_name(obj.unique_name, obj.channel_id);
    }
    /*!
     *  @brief  チャンネル情報(html)取得完了通知
     *  @param  result      結果
     *  @param  unique_name カスタムチャンネル名/ハンドル
     *  @param  html        チャンネル情報(html)
     */
    tell_get_channel_html(result, unique_name, html) {
        if (result === "success") {
            this.channel_info_accessor
                .tell_get_html(unique_name,
                               html,
                               this.post_proc_tell_get_channel_html.bind(this));
        }
    }

    /*!
     *  @brief  動画検索結果(html)取得完了通知後処理
     *  @param  video_id        動画ID
     *  @param  author_url      チャンネルURL
     *  @param  channel_name    チャンネル名
     */
    post_proc_tell_search_video_html(video_id, author_url, channel_name) {
        let obj = { video_id: video_id };
        const channel_code = YoutubeUtil.cut_channel_id(author_url);
        this.video_info_accessor.set_channel_name(video_id, channel_name);
        this.video_info_accessor.set_channel_code(video_id, author_url);
        if (YoutubeUtil.is_channel_url(author_url)) {
            obj.channel_id = channel_code;
        } else if (YoutubeUtil.is_userpage_url(author_url)) {
            obj.username = channel_code;
        } else if (YoutubeUtil.is_uniquepage_url(author_url)) {
            obj.unique_name = channel_code;
        } else {
            return; // 何らかの不具合
        }
        this.post_proc_tell_get_video_json(obj);
    }
    /*!
     *  @brief  動画検索結果(html)取得完了通知
     *  @param  result      結果
     *  @param  video_id    動画ID
     *  @param  html        検索結果(html)
     */
    tell_search_video_html(result, video_id, html) {
        if (result === "success") {
            this.video_searcher
                .tell_get_html(video_id,
                               html,
                               this.post_proc_tell_search_video_html.bind(this));
        }
    }

    /*!
     *  @brief  プレイリスト検索結果(html)解析後処理
     *  @param  list_id     リストID
     *  @param  author_url  チャンネルURL
     */
    post_proc_parse_search_playlist_html(list_id, author_url) {
        if (author_url == null) {
            return; // 特殊チャンネル
        }
        let obj = { list_id: list_id };
        const channel_code = YoutubeUtil.cut_channel_id(author_url);
        this.playlist_searcher.set_channel_code(list_id, author_url);
        if (YoutubeUtil.is_channel_url(author_url)) {
            obj.channel_id = channel_code;
        } else if (YoutubeUtil.is_userpage_url(author_url)) {
            obj.username = channel_code;_            
        } else if (YoutubeUtil.is_uniquepage_url(author_url)) {
            obj.unique_name = channel_code;
        } else {
            return; // 何らかの不具合
        }
        this.post_proc_tell_get_video_json(obj);
    }
    /*!
     *  @brief  プレイリスト検索結果(html)取得完了通知
     *  @param  result  結果
     *  @param  list_id 動画ID
     *  @param  html    検索結果(html)
     */
    tell_search_playlist_html(result, list_id, html) {
        if (result === "success") {
            PlaylistSearcher
                .parse_html(list_id,
                             html,
                             this.post_proc_parse_search_playlist_html.bind(this));
        }
    }

    /*!
     *  @brief  高速化用マーカーをクリアする
     */
    clear_marker() {
        const loc = this.current_location;
        if (loc.in_youtube_search_page()) {
            this.clear_searched_video_marker();
            this.clear_searched_lists_marker();
            const t_gs_vm = YoutubeShortsFilter.TAG_GRID_SHELF_VM();
            this.shorts_filter.clear_slim_videos_marker2(t_gs_vm);
        } else if (loc.in_top_page() ||
                   loc.in_youtube_feeds()) {
            this.clear_home_lockup_vm_state();
            const t_rich = YoutubeUtil.get_rich_shelf_header_tag();
            this.shorts_filter.clear_slim_videos_marker2(t_rich);
        } else if (loc.in_youtube_movie_page()) {
            this.recommend_filter.clear_contents_state();
            const t_reel = YoutubeUtil.get_reel_shelf_header2_tag();
            this.shorts_filter.clear_slim_videos_marker2(t_reel);
            const t_reel_login = YoutubeUtil.get_reel_shelf_header_tag();    
            this.shorts_filter.clear_slim_videos_marker2(t_reel_login);
        } else if (loc.in_youtube_gaming() ||
                   loc.in_youtube_channel_page() ||
                   loc.in_youtube_user_page() ||
                   loc.in_youtube_custom_channel_page() ||
                   loc.in_youtube_handle_page()) {
            this.clear_channel_content_state();
            const t_reel = YoutubeUtil.get_reel_shelf_header_tag();
            this.shorts_filter.clear_slim_videos_marker2(t_reel);    
            const t_grid = YoutubeUtil.get_rich_grid_header_tag();
            this.shorts_filter.clear_slim_videos_marker2(t_grid);    
        }
    }

    /*!
     *  @brief  DOM要素追加callback
     *  @note   DOM要素追加タイミングで行いたい処理群
     */
    callback_domelement_adition() {
        const storage = this.storage;
        // 自動再生をオフにする
        if (storage.json.stop_autoplay) {
            YoutubeUtil.disable_autoplay();
        }
        // アノテーションをオフにする
        if (storage.json.disable_annotation) {
            YoutubeUtil.disable_annotation();
        }
        // 'スリープタイマー'を消す
        if (storage.is_remove_sleeptimer()) {
            YoutubeUtil.remove_sleeptimer();
        }
    }

    get_observing_node(elem) {
        const tag = "ytd-page-manager#page-manager.style-scope.ytd-app";
        const e_page_manager = document.querySelector(tag);
        if (e_page_manager != null) { elem.push(e_page_manager); };
        const tag_popup = "ytd-popup-container.style-scope.ytd-app";
        const e_popup_container = document.querySelector(tag_popup);
        if (e_popup_container != null) { elem.push(e_popup_container); };
    }

    callback_domloaded() {
        if (this.current_location.in_youtube_short_page()) {
            this.shorts_filter.callback_domloaded();
        }
        super.filtering();
        super.callback_domloaded();
    }

    /*!
     *  @brief  無効な追加DOM要素か？
     *  @retun  true    無効
     */
    is_valid_records(records) {
        const chk_node = records[0].target;
        // マウスオーバによるアイテム追加は弾きたい
        if (chk_node.id != null) {
            if (chk_node.id.indexOf('-overlay') >= 0) {
                return true;
            }
            if (chk_node.id.indexOf('tooltip') >= 0) {
                return true;
            }
        }
        if (chk_node.className != null) {
            if (chk_node.className.indexOf('-overlay') >= 0) {
                return true;
            }
            if (chk_node.className.indexOf('tooltip') >= 0) {
                return true;
            }
            if (chk_node.className.indexOf('icon-shape') >= 0) {
                return true;
            }
            if (chk_node.className.indexOf('caption') >= 0) {
                return true;
            }
        }
        if (chk_node.localName != null) {
            if (chk_node.localName.indexOf('paper-tab') >= 0) {
                return true;
            }
            if (chk_node.localName.indexOf('yt-icon') >= 0) {
                return true;
            }
            if (chk_node.localName.indexOf('yt-thumbnail-view-model') >= 0) {
                return true;
            }            
        }
        return false;
    }

    /*!
     *  @brief  element追加callback
     *  @note   after_domloaded_observerから呼ばれる
     */
    callback_observing_element_change() {
        const urlw = this.current_location;
        this.comment_filter.callback_observing_element_change(urlw);
        if (urlw.in_youtube_movie_page()) {
            this.recommend_filter.callback_observing_element_change();
        } else
        if (urlw.in_youtube_short_page()) {
            const act_reel = this.shorts_filter.get_active_reel();
            if (this.active_short_reel == null || act_reel == this.active_short_reel) {
                this.shorts_filter.callback_observing_element_change();
            }
        }
    }
    /*!
     */
    callback_ready_element_observer() {
        if (this.storage.is_disable_border_radius()) {
            YoutubeUtil.disable_border_radius_of_thumbnail();
        }
    }

    callback_change_url(prev_urlw, to_urlw) {
        if (!this.storage.json.active) {
            return;
        }
        if (this.shorts_filtering_close_timer != null) {
            clearTimeout(this.shorts_filtering_close_timer);
            this.shorts_filtering_close_timer = null;
        }
        if (this.shorts_filtering_timer != null) {
            clearInterval(this.shorts_filtering_timer);
            this.shorts_filtering_timer = null;
        }
        if (prev_urlw.in_youtube_movie_page()) {
            this.recommend_filter.callback_exit_watch();
            this.comment_filter.callback_exit_have_comment_page();
        } else
        if (prev_urlw.in_youtube_channel_post()) {
            this.comment_filter.callback_exit_have_comment_page();
        }
        if (to_urlw.in_youtube_short_page())  {
            // shortsページ
            if (!prev_urlw.in_youtube_short_page()) {
                this.shorts_filter.open();
            } else {
                this.comment_filter.callback_turn_short();
                this.shorts_filter.turn();
            }
            // elem監視だけだとすっぽ抜けるのでtimerでサポートする
            this.active_short_reel = this.shorts_filter.get_active_reel();
            this.shorts_filtering_close_timer = setTimeout(()=> {
                // 2.5sec経ったらサポート打ち切ってOK
                clearTimeout(this.shorts_filtering_close_timer);
                this.shorts_filtering_close_timer = null;
            }, 2500);
            this.shorts_filtering_timer = setInterval(()=> {
                const act_reel = this.shorts_filter.get_active_reel();
                if (this.active_short_reel != null &&
                    act_reel != this.active_short_reel) {
                    // ページが切り替わってたら打ち切り
                    clearTimeout(this.shorts_filtering_close_timer);
                    this.shorts_filtering_close_timer = null;
                    clearInterval(this.shorts_filtering_timer);
                    this.shorts_filtering_timer = null;
                } else {
                    this.filtering();
                    if (this.storage.is_hidden_start()) {
                        this.shorts_filter.no_disp_initialize();
                    }
                    if (this.shorts_filter.is_end_filtering() &&
                        this.shorts_filtering_close_timer == null) {
                        clearInterval(this.shorts_filtering_timer);
                        this.shorts_filtering_timer = null;
                    }
                }
            }, 250); /* 1/4sec */
            if (prev_urlw.in_youtube_short_page()) {
                this.shorts_filter.player_initialize();
            }
        } else {
            if (prev_urlw.in_youtube_short_page()) {
                this.comment_filter.remove_comments_state();
                this.comment_filter.callback_exit_have_comment_page();
                this.shorts_filter.player_finalize();
                this.shorts_filter.close();
            }
        }
    }

    /*!
     *  @param storage  ストレージインスタンス
     */
    constructor(storage) {
        super(storage);
        super.create_after_domloaded_observer(this.is_valid_records.bind(this));
        this.recommend_filter
            = new YoutubeRecommendFilter(storage,
                                         this.data_counter,
                                         this.video_info_accessor,
                                         this.playlist_searcher);
        this.shorts_filter
            = new YoutubeShortsFilter(storage, this.data_counter);
        this.comment_filter
            = new YoutubeCommentFilter(storage, this.channel_info_accessor);
        this.func_get_collabo_channel_info = null;
        this.active_short_reel = null;
        this.shorts_filtering_close_timer = null;
        this.shorts_filtering_timer = null;
        //
        document.addEventListener("fullscreenchange", ()=>{
            if (this.current_location.in_youtube_short_page()) {
                this.shorts_filter.callback_fullscreenchange();
            }
        });
        window.addEventListener("resize", ()=>{
            if (this.current_location.in_youtube_short_page()) {
                this.shorts_filter.callback_resize_window();
            }
        });        
    }
}
