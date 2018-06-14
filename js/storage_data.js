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
        this.json.ng_thumbnail = false; // サムネイル除去 有効/無効
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
}
