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
            chrome.storage.local.get((items) => {
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
        chrome.storage.local.set(jobj);
    }
    
    clear() {
        this.json = {}
        this.json.active = true;        // フィルタ 有効/無効
        this.json.stop_autoplay = false;// 自動再生停止 有効/無効
        this.json.ng_channel = [];      // チャンネルフィルタ
        this.json.ng_title = [];        // タイトルフィルタ

        this.ng_channel_text = "";      // チャンネルフィルタを改行コードで連結したテキスト
        this.ng_title_text = "";        // タイトルフィルタを改行コードで連結したテキスト
    }

    update_text() {
        this.ng_channel_text = "";
        for (const ngc of this.json.ng_channel) {
            this.ng_channel_text += ngc.keyword + text_utility.new_line_code();
        }
        this.ng_title_text = "";
        for (const ngt of this.json.ng_title) {
            this.ng_title_text += ngt+ text_utility.new_line_code();
        }
    }

    /*!
     *  @brief  チャンネルとタイトルでフィルタする
     *  @param  channel チャンネル名
     *  @param  title   タイトル
     *  @retval true    除外対象だ
     */
    channel_and_title_filter(channel, title) {
        for (const ngc of this.json.ng_channel) {
            if (this.channel_filter_single(ngc, channel)) {
                if (function(title, black_titles) {
                    if (black_titles.length == 0) {
                        return true;
                    }
                    for (const btitle of black_titles) {
                        if (text_utility.regexp_indexOf(btitle, title)) {
                            return true;
                        }
                    }
                } (title, ngc.black_titles)) {
                    return true;
                }
            }
        }
        return this.title_filter(title);
    }

    /*!
     *  @brief  チャンネルフィルタ
     *  @param  channel チャンネル名
     *  @retval true    除外対象だ
     */
    channel_filter(channel) {
        const channel_lw = channel.toLowerCase();
        for (const ngc of this.json.ng_channel) {
            if (this.channel_filter_single(ngc, channel)) {
                return true;
            }
        }
        return false;
    }

    /*!
     *  @brief  チャンネルフィルタ(1ワード分)
     *  @param  ng_channel  非表示チャンネル情報
     *  @param  channel     チャンネル名
     *  @retval true        除外対象だ
     */
    channel_filter_single(ng_channel, channel) {
        const channel_lw = channel.toLowerCase();
        if (ng_channel.b_regexp) {
            // 正規表現
            if (text_utility.regexp(ng_channel.keyword, channel, ng_channel.b_normalize)) {
                return true;
            }
        } else {
            if (ng_channel.b_perfect_match) {
                // 完全一致
                if (ng_channel.b_normalize) {
                    if (ng_channel.keyword.toLowerCase() == channel_lw) {
                        return true;
                    }
                } else {
                    if (ng_channel.keyword == channel) {
                        return true;
                    }
                }
            } else {
                // 部分一致
                if (ng_channel.b_normalize) {
                    if (channel_lw.indexOf(ng_channel.keyword.toLowerCase()) >= 0) {
                        return true;
                    }
                } else {
                    return channel.indexOf(ng_channel.keyword) >= 0;
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
}
