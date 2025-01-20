/*!
 *  @brief  データクラス
 */
class StorageData {

    constructor() {
        this.clear();
    }

    filter_key() {
        return "Filter";
    }

    load() {
        return new Promise((resolve, reject) => {
            browser.storage.local.get((items) => {
                if (this.filter_key() in items) {
                    this.json = JSON.parse(items[this.filter_key()]);
                    this.update_text();
                } else {
                    this.clear();
                }
                resolve();
            });
        }); 
    }

    save() {
        var jobj = {};
        jobj[this.filter_key()] = JSON.stringify(this.json);
        return browser.storage.local.set(jobj);
    }
    
    clear() {
        this.json = {}
        this.json.active = true;                // フィルタ 有効/無効
        this.json.stop_autoplay = false;        // 自動再生停止 有効/無効
        this.json.disable_annotation = false;   // アノテーション無効化 有効/無効
        this.json.remove_sleeptimer = false;    // スリープタイマー非表示化 有効/無効
        this.json.disable_border_radius = false;// thumbnail角丸無効化 有効/無効
        this.json.mute_shorts = false;          // shortsミュート 有効/無効
        this.json.remove_suggestion = false;    // ショート動画のサジェスト削除 有効/無効
        this.json.disable_24feb_ui = false;     // 24年2月新UI無効化 有効/無効
        this.json.ng_channel = [];              // チャンネルフィルタ(ワード)
        this.json.ng_channel_id = [];           // チャンネルフィルタ(ID)
        this.json.ng_title = [];                // タイトルフィルタ
        this.json.ng_comment_by_user = [];      // コメントフィルタ(ユーザ)
        this.json.ng_comment_by_id = [];        // コメントフィルタ(ID)
        this.json.ng_comment_by_word = [];      // コメントフィルタ(ワード)
        this.json.ng_comment_by_handle = [];    // コメントフィルタ(ハンドル)

        this.clear_text_buffer();
    }

    clear_text_buffer() {
        this.ng_channel_text = "";
        this.ng_channel_id_text = "";
        this.ng_title_text = "";
        this.ng_comment_by_user_text = "";
        this.ng_comment_by_id_text = "";
        this.ng_comment_by_word_text = "";
        this.ng_comment_by_handle_text = "";
    }

    update_text() {
        this.clear_text_buffer();
        //  フィルタを改行コードで連結してバッファに格納
        const NLC = text_utility.new_line_code_lf();
        for (const ngc of this.json.ng_channel) {
            this.ng_channel_text += ngc.keyword + NLC;
        }
        if (this.json.ng_channel_id != null) {
            for (const ngci of this.json.ng_channel_id) {
                this.ng_channel_id_text += ngci.channel_id + NLC;
            }
        }
        for (const ngt of this.json.ng_title) {
            this.ng_title_text += ngt + NLC;
        }
        if (this.json.ng_comment_by_user != null) {
            for (const ngcu of this.json.ng_comment_by_user) {
                this.ng_comment_by_user_text += ngcu.keyword + NLC;
            }
        }
        if (this.json.ng_comment_by_id != null) {
            for (const ngci of this.json.ng_comment_by_id) {
                this.ng_comment_by_id_text += ngci + NLC;
            }
        }
        if (this.json.ng_comment_by_word != null) {
            for (const ngcw of this.json.ng_comment_by_word) {
                this.ng_comment_by_word_text += ngcw + NLC;
            }
        }
        if (this.json.ng_comment_by_handle != null) {
            for (const ngch of this.json.ng_comment_by_handle) {
                this.ng_comment_by_handle_text += ngch + NLC;
            }
        }
    }

    /*!
     *  @brief  チャンネルIDフィルタ設定を追加(重複チェックあり)
     *  @param  channel_id  チャンネルID
     *  @param  channel     チャンネル名(32文字上限)
     *  @retval true        storage構成変更があった
     */
    add_channel_id_mute_with_check(channel_id, channel) {
        if (this.json.ng_channel_id == null) {
            this.json.ng_channel_id = [];
        }
        for (const ngci of this.json.ng_channel_id) {
            if (ngci.channel_id == channel_id) {
                return false;
            }
        }
        var ng_channel = {};
        ng_channel.channel_id = channel_id;
        ng_channel.black_titles = [];
        ng_channel.comment = channel;
        this.json.ng_channel_id.push(ng_channel);
        return true;
    }

    /*!
     *  @brief  コメントフィルタ(ID)設定を追加(重複チェックあり)
     *  @param  channel_id  チャンネルID
     *  @retval true        storage構成変更があった
     */
    add_comment_id_mute_with_check(channel_id) {
        if (this.json.ng_comment_by_id == null) {
            this.json.ng_comment_by_id = [];
        }
        for (const ngci of this.json.ng_comment_by_id) {
            if (ngci == channel_id) {
                return false;
            }
        }
        this.json.ng_comment_by_id.push(channel_id);
        return true;
    }

    static word_filter(word, filtering_words) {
        if (word != null) {
            for (const w of filtering_words) {
                if (text_utility.regexp_indexOf(w, word)) {
                    return true;
                }
            }
        }
        return false;
    }

    /*!
     *  @brief  チャンネルとタイトルでフィルタする
     *  @param  channel チャンネル名
     *  @param  title   タイトル
     *  @retval true    除外対象だ
     */
    channel_and_title_filter(channel, title) {
        return this.channel_filter(channel, title) ||
               this.title_filter(title);
    }

    /*!
     *  @brief  チャンネルフィルタ
     *  @param  channel     チャンネル名
     *  @param  title       タイトル
     *  @retval true        除外対象だ
     */
    channel_filter(channel, title) {
        for (const ngc of this.json.ng_channel) {
            if (this.conditional_filter_single(ngc, channel)) {
                if (ngc.black_titles.length == 0 ||
                    StorageData.word_filter(title, ngc.black_titles)) {
                    return true;
                }
            }
        }
        return false;
    }

    /*!
     *  @brief  チャンネルIDフィルタする
     *  @param  channel_id  チャンネルID
     *  @param  title       タイトル
     *  @retval true        除外対象だ
     */
    channel_id_filter(channel_id, title) {
        if (this.json.ng_channel_id == null) {
            return false;
        }
        for (const ngci of this.json.ng_channel_id) {
            if (ngci.channel_id == channel_id) {
                if (ngci.black_titles.length == 0 ||
                    StorageData.word_filter(title, ngci.black_titles)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    /*!
     *  @brief  タイトルフィルタ
     *  @param  title   タイトル
     *  @retval true    除外対象だ
     */
    title_filter(title) {
        for (const ngt of this.json.ng_title) {
            if (text_utility.regexp_indexOf(ngt, title)) {
                return true;
            }
        }
        return false;
    }

    comment_filter_by_id(id) {
        if (this.json.ng_comment_by_id != null) {
            for (const ngci of this.json.ng_comment_by_id) {
                if (ngci == id) {
                    return true;
                }
            }
        }
        return false;
    }
    comment_filter_by_word(comment) {
        if (this.json.ng_comment_by_word != null) {
            for (const ngcw of this.json.ng_comment_by_word) {
                if (text_utility.regexp_indexOf(ngcw, comment)) {
                    return true;
                }
            }
        }
        return false;
    }
    comment_filter_by_handle(handle) {
        if (this.json.ng_comment_by_handle != null) {
            for (const ngch of this.json.ng_comment_by_handle) {
                if (ngch == handle) {
                    return true;
                }
            }
        }
        return false;
    }
    /*!
     *  @param  handle  投稿者ハンドル
     *  @param  comment コメント本体
     *  @note   userid取得前の簡易フィルタ
     */
    comment_filter_without_id(handle, comment) {
        var ret = {result:true, add_ng_id:false, userid:null};
        if (this.comment_filter_by_handle(handle)) {
            return ret;
        }
        if (this.comment_filter_by_word(comment)) {
            return ret;
        }
        ret.result = false;
        return ret;
    }    
    /*!
     *  @param  name    投稿者名
     *  @param  id      投稿者ID
     *  @param  handle  投稿者ハンドル
     *  @param  comment コメント本体
     */
    comment_filter(name, id, handle, comment) {
        var ret = {result:true, add_ng_id:false, userid:id};
        //
        if (this.json.ng_comment_by_user != null) {
            for (const ngcu of this.json.ng_comment_by_user) {
                if (this.conditional_filter_single(ngcu, name)) {
                    ret.add_ng_id = ngcu.b_auto_ng_id;
                    return ret;
                }
            }
        }
        if (this.comment_filter_by_id(id)) {
            return ret;
        }
        if (this.comment_filter_by_handle(handle)) {
            return ret;
        }
        if (this.comment_filter_by_word(comment)) {
            return ret;
        }
        ret.result = false;
        return ret;
    }


    /*!
     *  @brief  条件つきフィルタ(1ワード分)
     *  @param  setting フィルタ設定
     *  @param  dst     対象ワード
     *  @retval true    除外対象だ
     */
    conditional_filter_single(setting, dst) {
        if (setting.b_regexp) {
            // 正規表現
            return text_utility.regexp(setting.keyword, dst, setting.b_normalize);
        } else {
            if (setting.b_perfect_match) {
                // 完全一致
                if (setting.b_normalize) {
                    return setting.keyword.toLowerCase() == dst.toLowerCase();
                } else {
                    return setting.keyword == dst;
                }
            } else {
                // 部分一致
                if (setting.b_normalize) {
                    return dst.toLowerCase().indexOf(setting.keyword.toLowerCase()) >= 0;
                } else {
                    return dst.indexOf(setting.keyword) >= 0;
                }
            }
        }
    }

    /*!
     *  @brief  動画再生設定の'スリープ タイマー'を除去すべきか
     *  @retval true    除去すべき
     */
    is_remove_sleeptimer () {
        return this.json.remove_sleeptimer != null &&
               this.json.remove_sleeptimer != false;
    }
    /*!
     *  @brief  (thumbnailの)角丸を無効にすべきか
     *  @retval true    無効にすべき
     */
    is_disable_border_radius() {
        return this.json.disable_border_radius != null &&
               this.json.disable_border_radius != false;
    }
    /*!
     *  @brief  shortsをミュートすべきか
     */
    is_mute_shorts() {
        return this.json.mute_shorts != null &&
               this.json.mute_shorts != false;
    }
    /*!
     *  @brief  short動画のサジェストを消すべきか
     */
    is_remove_suggestion() {
        return this.json.remove_suggestion != null &&
               this.json.remove_suggestion != false;
    }    
    /*!
     *  @brief  24年2月新UIを無効化するか
     */
    is_disable_24feb_ui() {
        return this.json.disable_24feb_ui != null &&
               this.json.disable_24feb_ui != false;
    }
}
