/*!
 *  @brief  バッジ(拡張機能入れるとchromeメニューバーに出るアイコン)管理クラス
 */
class Badge  {

    constructor() {
    }
    
    update(storage) {
        if (storage.json.active) {
            chrome.browserAction.setIcon({ path : "../img/badge_on.png"});
        } else {
            chrome.browserAction.setIcon({ path : "../img/badge_off.png"});
        }
    }
};

/*!
 */
class ChannelFilterParam
{
    constructor(regexp, perfect_match, normalize, text) {
        this.b_regexp = (regexp == null) ?false :regexp;
        this.b_perfect_match = (perfect_match == null) ?false :perfect_match;
        this.b_normalize = (normalize == null) ?false :normalize;
        this.black_titles = text;
    }
};



/*!
 *  @brief  popup.js本体
 */
class Popup {

    constructor() {
        this.initialize();
    }

    initialize() {
        this.badge = new Badge();
        this.storage = new StorageData();
        this.storage.load().then(()=> {
            this.updateCheckbox();
            this.updateTextarea();
            this.badge.update(this.storage);
        });
        this.textarea_ex_title_val = [];
        this.ex_title_channel = '';
        //
        this.checkbox_sw_filter().change(()=> {
            this.button_save_enable();
        });
        this.checkbox_sw_stop_autoplay().change(()=> {
            this.button_save_enable();
        });
        this.checkbox_regexp().change(()=> {
            this.button_save_enable();
        });
        this.checkbox_perfect_match().change(()=> {
            this.button_save_enable();
        });
        this.checkbox_normalize().change(()=> {
            this.button_save_enable();
        });
        //
        this.selectbox_filter().change(()=> {
            this.selectbox_filter_change();
        });
        //
        this.textarea_filter_channel().keyup(()=> {
            this.textarea_filter_channel_keyup();
        });
        this.textarea_filter_title().keyup(()=> {
            this.textarea_filter_title_keyup();
        });
        this.textarea_filter_ex_title().keyup(()=> {
            this.textarea_filter_ex_title_keyup();
        });
        this.textarea_filter_channel().dblclick(()=> {
            this.textarea_filter_channel_dblclick();
        });
        //
        this.button_save().click(()=> {
            this.button_save_click();
        });
    }

    checkbox_sw_filter() {
        return  $("input[name=sw_filter]");
    }
    checkbox_sw_stop_autoplay() {
        return  $("input[name=sw_stop_autoplay]");
    }
    checkbox_regexp() {
        return  $("input#regexp");
    }
    checkbox_perfect_match() {
        return  $("input#perfectmatch");
    }
    checkbox_normalize() {
        return  $("input#normalize");
    }
    checkbox_label_regexp() {
        return  $("label#regexp");
    }
    checkbox_label_perfect_match() {
        return  $("label#perfectmatch");
    }
    checkbox_label_normalize() {
        return  $("label#normalize");
    }

    textarea_filter_channel() {
        return $("textarea[name=filter_channel]");
    }
    textarea_filter_title() {
        return $("textarea[name=filter_title]");
    }
    textarea_filter_ex_title() {
        return $("textarea[name=filter_ex_title]");
    }
    textarea_filter_channel_keyup() {
        if (this.textarea_filter_channel().val() != this.storage.ng_channel_text) {
            this.button_save().prop("disabled", false);
        }
    }
    textarea_filter_title_keyup() {
        if (this.textarea_filter_title().val() != this.storage.ng_title_text) {
            this.button_save().prop("disabled", false);
        }
    };
    textarea_filter_ex_title_keyup() {
        if (this.textarea_filter_ex_title().val()
            != this.textarea_ex_title_val[this.ex_title_channel].black_titles) {
            this.button_save().prop("disabled", false);
        }
    }
    textarea_filter_channel_dblclick() {
        var t = this.textarea_filter_channel();
        const channel
            = text_utility.search_text_connected_by_new_line(
                t[0].selectionStart,
                t.val());
        if (channel == null) {
            return;
        }
        // 前ex_titleの後始末
        if (this.ex_title_channel != '') {
            const prev_channel = this.ex_title_channel;
            this.textarea_ex_title_val[prev_channel]
                = new ChannelFilterParam(
                    this.checkbox_regexp().prop("checked"),
                    this.checkbox_perfect_match().prop("checked"),
                    this.checkbox_normalize().prop("checked"),
                    this.textarea_filter_ex_title().val());
            //
            var key = this.selectbox_filter_key()
                    + " option[value=" + this.selectbox_value_ex_title() + "]";
            $(key).remove();
        }
        this.ex_title_channel = channel;
        // selectboxに「$(channel)の非表示タイトル」を追加
        {
            const val = this.selectbox_value_ex_title();
            const max_disp_channel = 32;
            const text = channel.slice(0, max_disp_channel) + 'の非表示タイトル';
            this.selectbox_filter().append($("<option>").val(val).text(text));
        }
        // ex_title用textareaの準備
        {
            if (channel in this.textarea_ex_title_val) {
                const obj = this.textarea_ex_title_val[channel];
                this.textarea_filter_ex_title().val(obj.black_titles);
                this.checkbox_regexp().prop("checked", obj.b_regexp);
                this.checkbox_perfect_match().prop("checked", obj.b_perfect_match);
                this.checkbox_normalize().prop("checked", obj.b_normalize);
            } else {
                this.textarea_filter_ex_title().val('');
                this.checkbox_regexp().prop("checked", false);
                this.checkbox_perfect_match().prop("checked", false);
                this.checkbox_normalize().prop("checked", false);
                this.textarea_ex_title_val[channel]
                    = new ChannelFilterParam(false, false, false, '');
            }
        }
        this.selectbox_filter().val(this.selectbox_value_ex_title());
        this.selectbox_filter_change();
    }

    selectbox_filter_key() {
        return "select[name=select_filter]";
    }
    selectbox_filter() {
        return $(this.selectbox_filter_key());
    }
    is_selected_ng_channel() {
        return this.selectbox_filter().val() == "ng_channel";
    }
    is_selected_ng_title() {
        return this.selectbox_filter().val() == "ng_title";
    }
    selectbox_value_ex_title() {
        return "ng_ex_title";
    }
    selectbox_filter_change() {
        if (this.is_selected_ng_channel()) {
            this.textarea_filter_channel().show();
            this.textarea_filter_title().hide();
            this.textarea_filter_ex_title().hide();
            this.checkbox_regexp().hide();
            this.checkbox_perfect_match().hide();
            this.checkbox_normalize().hide();
            this.checkbox_label_regexp().hide();
            this.checkbox_label_perfect_match().hide();
            this.checkbox_label_normalize().hide();
        } else if (this.is_selected_ng_title()) {
            this.textarea_filter_channel().hide();
            this.textarea_filter_title().show();
            this.textarea_filter_ex_title().hide();
            this.checkbox_regexp().hide();
            this.checkbox_perfect_match().hide();
            this.checkbox_normalize().hide();
            this.checkbox_label_regexp().hide();
            this.checkbox_label_perfect_match().hide();
            this.checkbox_label_normalize().hide();
        } else {
            this.textarea_filter_channel().hide();
            this.textarea_filter_title().hide();
            this.textarea_filter_ex_title().show();
            this.checkbox_regexp().show();
            this.checkbox_perfect_match().show();
            this.checkbox_normalize().show();
            this.checkbox_label_regexp().show();
            this.checkbox_label_perfect_match().show();
            this.checkbox_label_normalize().show();
        }
    }

    button_save() {
        return $("button[name=req_save]");
    }
    button_save_click() {
        this.storage.clear();
        if (this.ex_title_channel != '') {
            this.textarea_ex_title_val[this.ex_title_channel]
                = new ChannelFilterParam(this.checkbox_regexp().prop("checked"),
                                         this.checkbox_perfect_match().prop("checked"),
                                         this.checkbox_normalize().prop("checked"),
                                         this.textarea_filter_ex_title().val());
        }
        //
        {
            var filter = text_utility.split_by_new_line(this.textarea_filter_channel().val());
            for (const word of filter) {
                if (word != "") {
                    var ng_channel = {};
                    ng_channel.keyword = word;
                    if (word in this.textarea_ex_title_val) {
                        const obj = this.textarea_ex_title_val[word];
                        ng_channel.black_titles =
                            text_utility.split_by_new_line(obj.black_titles);
                        ng_channel.b_regexp = obj.b_regexp;
                        ng_channel.b_perfect_match = obj.b_perfect_match;
                        ng_channel.b_normalize = obj.b_normalize;
                    } else {
                        ng_channel.black_titles = [];
                        ng_channel.b_regexp = false;
                        ng_channel.b_perfect_match = false;
                        ng_channel.b_normalize = false;
                    }
                    ng_channel.sub_dirs = [];
                    //
                    this.storage.json.ng_channel.push(ng_channel);
                }
            }
        }
        {
            var filter = text_utility.split_by_new_line(this.textarea_filter_title().val());
            for (const word of filter) {
                if (word != "") {
                    this.storage.json.ng_title.push(word);
                }
            }
        }
        this.storage.json.active = this.checkbox_sw_filter().prop("checked");
        this.storage.json.stop_autoplay = this.checkbox_sw_stop_autoplay().prop("checked");
        this.storage.save();
        this.send_message_to_relative_tab("update");
        //
        this.button_save_disable();
        this.badge.update(this.storage);
        this.storage.update_text();
    }
    button_save_enable() {
        this.button_save().prop("disabled", false);
    }
    button_save_disable() {
        this.button_save().prop("disabled", true);
    }

    updateCheckbox() {
        var json = this.storage.json;
        this.checkbox_sw_filter().prop("checked", json.active);
        this.checkbox_sw_stop_autoplay().prop("checked",
            json.stop_autoplay == null ?false
                                       :json.stop_autoplay);
    }

    updateTextarea() {
        this.textarea_filter_channel().val(this.storage.ng_channel_text);
        this.textarea_filter_title().val(this.storage.ng_title_text);
        // ex_title用の疑似textarea
        {
            const nlc = text_utility.new_line_code();
            this.textarea_ex_title_val = [];
            for (const ngc of this.storage.json.ng_channel) {
                var bt_text = "";
                for (const bt of ngc.black_titles) {
                    bt_text += bt + nlc;
                }
                this.textarea_ex_title_val[ngc.keyword]
                    = new ChannelFilterParam(ngc.b_regexp,
                                             ngc.b_perfect_match,
                                             ngc.b_normalize,
                                             bt_text);
            }

        }
    }

    send_message_to_relative_tab(message) {
        browser.tabs.query({}, (tabs)=> {
            for (const tab of tabs) {
                const url = new urlWrapper(tab.url);
                if (url.in_youtube() || url.in_google()) {
                    browser.tabs.sendMessage(tab.id, message, (response)=> {
                    });
                }
            }
        });
    }

};

var popup = new Popup();
