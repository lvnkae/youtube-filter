/*!
 *  @brief  バッジ(拡張機能入れるとchromeメニューバーに出るアイコン)管理クラス
 */
class Badge  {

    constructor() {
        // 右クリックメニューが残ってしまうので非表示指示を出しとく
        MessageUtil.send_message({
            command: MessageUtil.command_update_contextmenu(),
        });
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
class ChannelFilterParam {
    constructor(regexp, perfect_match, normalize, text) {
        this.b_regexp = (regexp == null) ?false :regexp;
        this.b_perfect_match = (perfect_match == null) ?false :perfect_match;
        this.b_normalize = (normalize == null) ?false :normalize;
        this.black_titles = text;
    }
};
class ChannelIDFilterParam {
    constructor(comment, text) {
        this.comment = comment;
        this.black_titles = text;
    }
};
class CommentFilterByUserParam {
    constructor(regexp, perfect_match, normalize, auto_ng_id) {
        this.b_regexp = (regexp == null) ?false :regexp;
        this.b_perfect_match = (perfect_match == null) ?false :perfect_match;
        this.b_normalize = (normalize == null) ?false :normalize;
        this.b_auto_ng_id = (auto_ng_id == null) ?false : auto_ng_id;
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
        this.ex_channel_buffer = [];        // 非表示チャンネル詳細設定バッファ(各種フラグ/個別非表示タイトル)
        this.ex_channel_last = '';          // 最後に「非表示チャンネル詳細設定」画面を開いたチャンネル名
        this.ex_channel_id_buffer = [];     // 非表示チャンネル詳細設定バッファ(各種フラグ/個別非表示タイトル)
        this.ex_channel_id_last = '';       // 最後に「非表示チャンネル詳細設定」画面を開いたチャンネル名
        this.ex_comment_user_buffer = [];   // 非表示コメント(ユーザ)詳細設定バッファ(各種フラグ)
        this.ex_comment_user_last = '';     // 最後に「非表示コメント(ユーザ)詳細設定」画面を開いたユーザ名
        //
        this.checkbox_sw_filter().change(()=> {
            this.button_save_enable();
        });
        this.checkbox_sw_stop_autoplay().change(()=> {
            this.button_save_enable();
        });
        this.checkbox_sw_disable_annotation().change(()=> {
            this.button_save_enable();
        });
        this.checkbox_sw_disable_border_radius().change(()=> {
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
        this.checkbox_com_regexp().change(()=> {
            this.button_save_enable();
        });
        this.checkbox_com_perfect_match().change(()=> {
            this.button_save_enable();
        });
        this.checkbox_com_normalize().change(()=> {
            this.button_save_enable();
        });
        this.checkbox_com_auto_ng_id().change(()=> {
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
        this.textarea_filter_channel().dblclick(()=> {
            this.textarea_filter_channel_dblclick();
        });
        this.textarea_filter_channel_id().keyup(()=> {
            this.textarea_filter_channel_id_keyup();
        });
        this.textarea_filter_channel_id().dblclick(()=> {
            this.textarea_filter_channel_id_dblclick();
        });
        this.textarea_filter_title().keyup(()=> {
            this.textarea_filter_title_keyup();
        });
        this.textarea_filter_ex_channel().keyup(()=> {
            this.textarea_filter_ex_channel_keyup();
        });
        this.textarea_filter_ex_channel_id().keyup(()=> {
            this.textarea_filter_ex_channel_id_keyup();
        });
        this.textbox_ch_username().keyup(()=> {
            this.textbox_ch_username_keyup();
        });
        this.textarea_filter_comment_by_user().keyup(()=> {
            this.textarea_filter_comment_by_user_keyup();
        });
        this.textarea_filter_comment_by_user().dblclick(()=> {
            this.textarea_filter_comment_by_user_dblclick();
        });
        this.textarea_filter_comment_by_id().keyup(()=> {
            this.textarea_filter_comment_by_id_keyup();
        });
        this.textarea_filter_comment_by_word().keyup(()=> {
            this.textarea_filter_comment_by_word_keyup();
        });
        this.textarea_import_storage().on('paste',(e)=> {
            this.button_import_enable();
        });
        //
        this.button_save().click(()=> {
            this.button_save_click();
        });
        this.button_import().click(()=> {
            this.button_import_click();
        });
    }

    checkbox_sw_filter() {
        return $("input[name=sw_filter]");
    }
    checkbox_sw_stop_autoplay() {
        return $("input[name=sw_stop_autoplay]");
    }
    checkbox_sw_disable_annotation() {
        return $("input[name=sw_disable_annotation]");
    }
    checkbox_sw_disable_border_radius() {
        return $("input[name=sw_disable_border_radius]");
    }
    checkbox_regexp() {
        return $("input#regexp");
    }
    checkbox_perfect_match() {
        return $("input#perfectmatch");
    }
    checkbox_normalize() {
        return $("input#normalize");
    }
    checkbox_com_regexp() {
        return $("input#com_regexp");
    }
    checkbox_com_perfect_match() {
        return $("input#com_perfectmatch");
    }
    checkbox_com_normalize() {
        return $("input#com_normalize");
    }
    checkbox_com_auto_ng_id() {
        return $("input#com_autongid");
    }
    checkbox_label_regexp() {
        return $("label#regexp");
    }
    checkbox_label_perfect_match() {
        return $("label#perfectmatch");
    }
    checkbox_label_normalize() {
        return $("label#normalize");
    }
    checkbox_label_com_regexp() {
        return $("label#com_regexp");
    }
    checkbox_label_com_perfect_match() {
        return $("label#com_perfectmatch");
    }
    checkbox_label_com_normalize() {
        return $("label#com_normalize");
    }
    checkbox_label_com_auto_ng_id() {
        return $("label#com_autongid");
    }
    textbox_ch_username() {
        return $("input#ch_username");
    }
    textbox_label_ch_username() {
        return $("label#ch_username");
    }
    textbox_label_ch_username_br() {
        return $("label#ch_username_br");
    }

    textarea_filter_channel() {
        return $("textarea[name=filter_channel]");
    }
    textarea_filter_channel_id() {
        return $("textarea[name=filter_channel_id]");
    }
    textarea_filter_title() {
        return $("textarea[name=filter_title]");
    }
    textarea_filter_ex_channel() {
        return $("textarea[name=filter_ex_channel]");
    }
    textarea_filter_ex_channel_id() {
        return $("textarea[name=filter_ex_channel_id]");
    }
    textarea_filter_comment_by_user() {
        return $("textarea[name=filter_comment_by_user]");
    }
    textarea_filter_comment_by_id() {
        return $("textarea[name=filter_comment_by_id]");
    }
    textarea_filter_comment_by_word() {
        return $("textarea[name=filter_comment_by_word]");
    }
    textarea_export_storage() {
        return $("textarea[name=export_storage]");
    }
    textarea_import_storage() {
        return $("textarea[name=import_storage]");
    }

    button_save() {
        return $("button[name=req_save]");
    }
    button_save_enable() {
        this.button_save().prop("disabled", false);
    }
    button_save_disable() {
        this.button_save().prop("disabled", true);
    }
    button_import() {
        return $("button[name=req_import]");
    }
    button_import_enable() {
        this.button_import().prop("disabled", false);
    }
    button_import_disable() {
        this.button_import().prop("disabled", true);
    }

    hide_textarea_all() {
        this.textarea_filter_channel().hide();
        this.textarea_filter_channel_id().hide();
        this.textarea_filter_title().hide();
        this.hide_ex_channel();
        this.hide_ex_channel_id();
        this.textarea_filter_comment_by_user().hide();
        this.textarea_filter_comment_by_id().hide();
        this.textarea_filter_comment_by_word().hide();
        this.hide_ex_comment_by_user();
        this.textarea_export_storage().hide();
        this.textarea_import_storage().hide();
        this.textarea_import_storage().val("");
    }
    hide_ex_channel() {
        this.textarea_filter_ex_channel().hide();
        this.checkbox_regexp().hide();
        this.checkbox_perfect_match().hide();
        this.checkbox_normalize().hide();
        this.checkbox_label_regexp().hide();
        this.checkbox_label_perfect_match().hide();
        this.checkbox_label_normalize().hide();
    }
    hide_ex_channel_id() {
        this.textarea_filter_ex_channel_id().hide();
        this.textbox_ch_username().hide();
        this.textbox_label_ch_username().hide();
        this.textbox_label_ch_username_br().hide();
    }
    hide_ex_comment_by_user() {
        this.checkbox_com_regexp().hide();
        this.checkbox_com_perfect_match().hide();
        this.checkbox_com_normalize().hide();
        this.checkbox_com_auto_ng_id().hide();
        this.checkbox_label_com_regexp().hide();
        this.checkbox_label_com_perfect_match().hide();
        this.checkbox_label_com_normalize().hide();
        this.checkbox_label_com_auto_ng_id().hide();
    }
    show_ex_channel() {
        this.textarea_filter_ex_channel().show();
        this.checkbox_regexp().show();
        this.checkbox_perfect_match().show();
        this.checkbox_normalize().show();
        this.checkbox_label_regexp().show();
        this.checkbox_label_perfect_match().show();
        this.checkbox_label_normalize().show();
    }
    show_ex_channel_id() {
        this.textarea_filter_ex_channel_id().show();
        this.textbox_ch_username().show();
        this.textbox_label_ch_username().show();
        this.textbox_label_ch_username_br().show();
    }
    show_ex_comment_by_user() {
        this.checkbox_com_regexp().show();
        this.checkbox_com_perfect_match().show();
        this.checkbox_com_normalize().show();
        this.checkbox_com_auto_ng_id().show();
        this.checkbox_label_com_regexp().show();
        this.checkbox_label_com_perfect_match().show();
        this.checkbox_label_com_normalize().show();
        this.checkbox_label_com_auto_ng_id().show();
    }
    show_export_storage() {
        this.textarea_export_storage().val(StoragePorter.export(this.storage.json));
        this.textarea_export_storage().show();
        this.button_save().hide();
    }
    show_import_storage() {
        this.textarea_import_storage().show();
        this.button_save().hide();
        this.button_import().show();
    }

    textarea_filter_channel_keyup() {
        if (this.textarea_filter_channel().val() != this.storage.ng_channel_text) {
            this.button_save_enable();
        }
    }
    textarea_filter_channel_id_keyup() {
        if (this.textarea_filter_channel_id().val() != this.storage.ng_channel_id_text) {
            this.button_save_enable();
        }
    }
    textarea_filter_title_keyup() {
        if (this.textarea_filter_title().val() != this.storage.ng_title_text) {
            this.button_save_enable();
        }
    };
    textarea_filter_ex_channel_keyup() {
        if (this.textarea_filter_ex_channel().val()
            != this.ex_channel_buffer[this.ex_channel_last].black_titles) {
            this.button_save_enable();
        }
    }
    textarea_filter_ex_channel_id_keyup() {
        if (this.textarea_filter_ex_channel_id().val()
            != this.ex_channel_id_buffer[this.ex_channel_id_last].black_titles) {
            this.button_save_enable();
        }
    }
    textbox_ch_username_keyup() {
        if (this.textbox_ch_username().val()
            != this.ex_channel_id_buffer[this.ex_channel_id_last].commment) {
            this.button_save_enable();
        }
    }
    textarea_filter_comment_by_user_keyup() {
        if (this.textarea_filter_comment_by_user().val()
            != this.storage.ng_comment_by_user_text) {
            this.button_save_enable();
        }
    }
    textarea_filter_comment_by_id_keyup() {
        if (this.textarea_filter_comment_by_id().val()
            != this.storage.ng_comment_by_id_text) {
            this.button_save_enable();
        }
    };
    textarea_filter_comment_by_word_keyup() {
        if (this.textarea_filter_comment_by_word().val()
            != this.storage.ng_comment_by_word_text) {
            this.button_save_enable();
        }
    }

    /*!
     *  @brief  前回「非表示チャンネル詳細設定」の後始末
     */
    cleanup_ex_channel() {
        if (this.ex_channel_last != '') {
            this.ex_channel_buffer_to_reflect_current(this.ex_channel_last);
            var key = this.selectbox_filter_key()
                    + " option[value=" + this.selectbox_value_ex_channel() + "]";
            $(key).remove();
        }
    }
    //
    textarea_filter_channel_dblclick() {
        var t = this.textarea_filter_channel();
        const channel
            = text_utility.search_text_connected_by_new_line(
                t[0].selectionStart,
                t.val());
        if (channel == null) {
            return;
        }
        this.cleanup_ex_channel();
        this.cleanup_ex_channel_id();
        this.cleanup_ex_comment_by_user();
        this.ex_channel_last = channel;
        // selectboxに「$(channel)の非表示タイトル」を追加
        {
            const val = this.selectbox_value_ex_channel();
            const max_disp_channel = 32;
            const text = channel.slice(0, max_disp_channel) + 'の非表示タイトル';
            this.selectbox_filter().append($("<option>").val(val).text(text));
        }
        // ex_channel用textareaの準備
        {
            if (channel in this.ex_channel_buffer) {
                const obj = this.ex_channel_buffer[channel];
                this.textarea_filter_ex_channel().val(obj.black_titles);
                this.checkbox_regexp().prop("checked", obj.b_regexp);
                this.checkbox_perfect_match().prop("checked", obj.b_perfect_match);
                this.checkbox_normalize().prop("checked", obj.b_normalize);
            } else {
                this.textarea_filter_ex_channel().val('');
                this.checkbox_regexp().prop("checked", false);
                this.checkbox_perfect_match().prop("checked", false);
                this.checkbox_normalize().prop("checked", false);
                this.ex_channel_buffer[channel]
                    = new ChannelFilterParam(false, false, false, '');
            }
        }
        this.selectbox_filter().val(this.selectbox_value_ex_channel());
        this.selectbox_filter_change();
    }

    /*!
     *  @brief  前回「非表示チャンネル(ID)詳細設定」の後始末
     */
    cleanup_ex_channel_id() {
        if (this.ex_channel_id_last != '') {
            this.ex_channel_id_buffer_to_reflect_current(this.ex_channel_id_last);
            var key = this.selectbox_filter_key()
                    + " option[value=" + this.selectbox_value_ex_channel_id() + "]";
            $(key).remove();
        }
    }
    //
    textarea_filter_channel_id_dblclick() {
        var t = this.textarea_filter_channel_id();
        const channel_id
            = text_utility.search_text_connected_by_new_line(
                t[0].selectionStart,
                t.val());
        if (channel_id == null) {
            return;
        }
        this.cleanup_ex_channel_id();
        this.cleanup_ex_channel();
        this.cleanup_ex_comment_by_user();
        this.ex_channel_id_last = channel_id;
        // selectboxに「$(channel)の非表示タイトル」を追加
        {
            const val = this.selectbox_value_ex_channel_id();
            const max_disp_channel_id = 24;
            const text = channel_id.slice(0, max_disp_channel_id) + 'の非表示タイトル';
            this.selectbox_filter().append($("<option>").val(val).text(text));
        }
        // ex_channel用textareaの準備
        {
            if (channel_id in this.ex_channel_id_buffer) {
                const obj = this.ex_channel_id_buffer[channel_id];
                this.textarea_filter_ex_channel_id().val(obj.black_titles);
                this.textbox_ch_username().val(obj.comment);
            } else {
                this.textarea_filter_ex_channel_id().val('');
                this.textbox_ch_username().val('');
                this.ex_channel_id_buffer[channel_id]
                    = new ChannelIDFilterParam('', '');
            }
        }
        this.selectbox_filter().val(this.selectbox_value_ex_channel_id());
        this.selectbox_filter_change();
    }

    /*!
     *  @brief  前回「非表示コメント(ユーザ)詳細設定」の後始末
     */
    cleanup_ex_comment_by_user() {
        if (this.ex_comment_user_last != '') {
            this.ex_comment_user_buffer_to_reflect_current(this.ex_comment_user_last);
            var key = this.selectbox_filter_key()
                    + " option[value=" + this.selectbox_value_ex_comment_user() + "]";
            $(key).remove();
        }
    }
    //
    textarea_filter_comment_by_user_dblclick() {
        var t = this.textarea_filter_comment_by_user();
        const user
            = text_utility.search_text_connected_by_new_line(
                t[0].selectionStart,
                t.val());
        if (user == null) {
            return;
        }
        this.cleanup_ex_comment_by_user();
        this.cleanup_ex_channel();
        this.cleanup_ex_channel_id();
        this.ex_comment_user_last = user;
        // selectboxに「$(user)の詳細設定」を追加
        {
            const val = this.selectbox_value_ex_comment_user();
            const max_disp_user = 32;
            const text = user.slice(0, max_disp_user) + 'の詳細設定';
            this.selectbox_filter().append($("<option>").val(val).text(text));
        }
        // checkbox準備
        {
            if (user in this.ex_comment_user_buffer) {
                const obj = this.ex_comment_user_buffer[user];
                this.checkbox_com_regexp().prop("checked", obj.b_regexp);
                this.checkbox_com_perfect_match().prop("checked", obj.b_perfect_match);
                this.checkbox_com_normalize().prop("checked", obj.b_normalize);
                this.checkbox_com_auto_ng_id().prop("checked", obj.b_auto_ng_id);
            } else {
                this.checkbox_com_regexp().prop("checked", false);
                this.checkbox_com_perfect_match().prop("checked", false);
                this.checkbox_com_normalize().prop("checked", false);
                this.checkbox_com_auto_ng_id().prop("checked", false);
                this.ex_comment_user_buffer[user]
                    = new CommentFilterByUserParam(false, false, false, false);
            }
        }
        this.selectbox_filter().val(this.selectbox_value_ex_comment_user());
        this.selectbox_filter_change();
    }

    selectbox_filter_key() {
        return "select[name=select_filter]";
    }
    selectbox_filter() {
        return $(this.selectbox_filter_key());
    }

    selectbox_value_ex_channel() {
        return "ng_ex_channel";
    }
    selectbox_value_ex_channel_id() {
        return "ng_ex_channel_id";
    }
    selectbox_value_ex_comment_user() {
        return "ng_ex_comment_user";
    }

    is_selected_ng_channel() {
        return this.selectbox_filter().val() == "ng_channel_word";
    }
    is_selected_ng_channel_id() {
        return this.selectbox_filter().val() == "ng_channel_id";
    }
    is_selected_ng_title() {
        return this.selectbox_filter().val() == "ng_title";
    }
    is_selected_ng_ex_channel() {
        return this.selectbox_filter().val() == 
                this.selectbox_value_ex_channel();
    }
    is_selected_ng_ex_channel_id() {
        return this.selectbox_filter().val() == 
                this.selectbox_value_ex_channel_id();
    }
    is_selected_ng_comment_by_user() {
        return this.selectbox_filter().val() == "ng_comment_user";
    }
    is_selected_ng_comment_by_id() {
        return this.selectbox_filter().val() == "ng_comment_id";
    }
    is_selected_ng_comment_by_word() {
        return this.selectbox_filter().val() == "ng_comment_word";
    }
    is_selected_export_storage() {
        return this.selectbox_filter().val() == "export";
    }
    is_selected_import_storage() {
        return this.selectbox_filter().val() == "import";
    }

    selectbox_filter_change() {
        this.hide_textarea_all();
        this.button_import().hide();
        this.button_save().show();
        if (this.is_selected_ng_channel()) {
            this.textarea_filter_channel().show();
        } else if (this.is_selected_ng_channel_id()) {
            this.textarea_filter_channel_id().show();
        } else if (this.is_selected_ng_title()) {
            this.textarea_filter_title().show();
        } else if (this.is_selected_ng_ex_channel()) {
            this.show_ex_channel();
        } else if (this.is_selected_ng_ex_channel_id()) {
            this.show_ex_channel_id();
        } else if (this.is_selected_ng_comment_by_user()) {
            this.textarea_filter_comment_by_user().show();
        } else if (this.is_selected_ng_comment_by_id()) {
            this.textarea_filter_comment_by_id().show();
        } else if (this.is_selected_ng_comment_by_word()) {
            this.textarea_filter_comment_by_word().show();
        } else if (this.is_selected_export_storage()) {
            this.show_export_storage();
        } else if (this.is_selected_import_storage()) {
            this.show_import_storage();
        } else {
            this.show_ex_comment_by_user();
        }
    }

    button_save_click() {
        this.storage.clear();
        if (this.ex_channel_last != '') {
            this.ex_channel_buffer_to_reflect_current(this.ex_channel_last);
        }
        if (this.ex_channel_id_last != '') {
            this.ex_channel_id_buffer_to_reflect_current(this.ex_channel_id_last);
        }
        if (this.ex_comment_user_last != '') {
            this.ex_comment_user_buffer_to_reflect_current(this.ex_comment_user_last);
        }
        //
        {
            var filter
                = text_utility.split_by_new_line(this.textarea_filter_channel().val());
            for (const word of filter) {
                if (word != "") {
                    var ng_channel = {};
                    ng_channel.keyword = word;
                    if (word in this.ex_channel_buffer) {
                        const obj = this.ex_channel_buffer[word];
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
            var filter
                = text_utility
                  .split_by_new_line(this.textarea_filter_channel_id().val());
            for (const channel_id of filter) {
                if (channel_id != "") {
                    var ng_channel = {};
                    ng_channel.channel_id = channel_id;
                    if (channel_id in this.ex_channel_id_buffer) {
                        const obj = this.ex_channel_id_buffer[channel_id];
                        ng_channel.black_titles =
                            text_utility.split_by_new_line(obj.black_titles);
                        ng_channel.comment = obj.comment;
                    } else {
                        ng_channel.black_titles = [];
                        ng_channel.comment = '';
                    }
                    //
                    this.storage.json.ng_channel_id.push(ng_channel);
                }
            }
        }
        {
            var filter
                = text_utility.split_by_new_line(this.textarea_filter_title().val());
            for (const word of filter) {
                if (word != "") {
                    this.storage.json.ng_title.push(word);
                }
            }
        }
        {
            var filter
                = text_utility.split_by_new_line(
                    this.textarea_filter_comment_by_user().val());
            for (const word of filter) {
                if (word != "") {
                    var ng_comment_by_user = {};
                    ng_comment_by_user.keyword = word;
                    if (word in this.ex_comment_user_buffer) {
                        const obj = this.ex_comment_user_buffer[word];
                        ng_comment_by_user.b_regexp = obj.b_regexp;
                        ng_comment_by_user.b_perfect_match = obj.b_perfect_match;
                        ng_comment_by_user.b_normalize = obj.b_normalize;
                        ng_comment_by_user.b_auto_ng_id = obj.b_auto_ng_id;
                    } else {
                        ng_comment_by_user.b_regexp = false;
                        ng_comment_by_user.b_perfect_match = false;
                        ng_comment_by_user.b_normalize = false;
                        ng_comment_by_user.b_auto_ng_id = false;
                    }
                    //
                    this.storage.json.ng_comment_by_user.push(ng_comment_by_user);
                }
            }
        }
        {
            var filter
                = text_utility.split_by_new_line(
                    this.textarea_filter_comment_by_id().val());
            for (const word of filter) {
                if (word != "") {
                    this.storage.json.ng_comment_by_id.push(word);
                }
            }
        }
        {
            var filter
                = text_utility.split_by_new_line(
                    this.textarea_filter_comment_by_word().val());
            for (const word of filter) {
                if (word != "") {
                    this.storage.json.ng_comment_by_word.push(word);
                }
            }
        }
        //
        this.storage.json.active = this.checkbox_sw_filter().prop("checked");
        this.storage.json.stop_autoplay
            = this.checkbox_sw_stop_autoplay().prop("checked");
        this.storage.json.disable_annotation
            = this.checkbox_sw_disable_annotation().prop("checked");
        this.storage.json.disable_border_radius
            = this.checkbox_sw_disable_border_radius().prop("checked");
        this.storage.save();
        this.send_message_to_relative_tab(
            {command:MessageUtil.command_update_storage()});
        //
        this.button_save_disable();
        this.badge.update(this.storage);
        this.storage.update_text();
    }

    button_import_click() {
        const importer = new StoragePorter(this.storage.json);
        if (importer.import(this.textarea_import_storage().val())) {
            this.storage.json = importer.json;
            this.storage.save();
            this.storage.update_text();
            this.updateTextarea();
            this.textarea_import_storage().val("[[OK]]");
        } else {
            this.textarea_import_storage().val("[[ERROR]]");
        }
    }

    updateCheckbox() {
        var json = this.storage.json;
        this.checkbox_sw_filter().prop("checked", json.active);
        this.checkbox_sw_stop_autoplay().prop("checked",
            json.stop_autoplay == null ?false
                                       :json.stop_autoplay);
        this.checkbox_sw_disable_annotation().prop("checked",
            json.disable_annotation == null ?false
                                            :json.disable_annotation);
        this.checkbox_sw_disable_border_radius().prop("checked",
            json.disable_border_radius == null ?false
                                               :json.disable_border_radius);
    }

    updateTextarea() {
        this.textarea_filter_channel().val(this.storage.ng_channel_text);
        this.textarea_filter_channel_id().val(this.storage.ng_channel_id_text);
        this.textarea_filter_title().val(this.storage.ng_title_text);
        this.textarea_filter_comment_by_user().val(this.storage.ng_comment_by_user_text);
        this.textarea_filter_comment_by_id().val(this.storage.ng_comment_by_id_text);
        this.textarea_filter_comment_by_word().val(this.storage.ng_comment_by_word_text);
        {
            const nlc = text_utility.new_line_code_lf();
            {
                this.ex_channel_buffer = [];
                for (const ngc of this.storage.json.ng_channel) {
                    var bt_text = "";
                    for (const bt of ngc.black_titles) {
                        bt_text += bt + nlc;
                    }
                    this.ex_channel_buffer[ngc.keyword]
                        = new ChannelFilterParam(ngc.b_regexp,
                                                 ngc.b_perfect_match,
                                                 ngc.b_normalize,
                                                 bt_text);
                }
            }
            if (this.storage.json.ng_channel_id != null) {
                this.ex_channel_id_buffer = [];
                for (const ngci of this.storage.json.ng_channel_id) {
                    var bt_text = "";
                    for (const bt of ngci.black_titles) {
                        bt_text += bt + nlc;
                    }
                    this.ex_channel_id_buffer[ngci.channel_id]
                        = new ChannelIDFilterParam(ngci.comment, bt_text);
                }
            }
            if (this.storage.json.ng_comment_by_user != null) {
                this.ex_comment_user_buffer = [];
                for (const ngcu of this.storage.json.ng_comment_by_user) {
                    this.ex_comment_user_buffer[ngcu.keyword]
                        = new CommentFilterByUserParam(ngcu.b_regexp,
                                                       ngcu.b_perfect_match,
                                                       ngcu.b_normalize,
                                                       ngcu.b_auto_ng_id);
                }
            }
        }
    }

    /*!
     *  @brief  現状を「非表示チャンネル詳細加設定」バッファへ反映する
     */
    ex_channel_buffer_to_reflect_current(channel) {
        this.ex_channel_buffer[channel]
            = new ChannelFilterParam(this.checkbox_regexp().prop("checked"),
                                     this.checkbox_perfect_match().prop("checked"),
                                     this.checkbox_normalize().prop("checked"),
                                     this.textarea_filter_ex_channel().val());
    }
    /*!
     *  @brief  現状を「非表示チャンネル(ID)詳細加設定」バッファへ反映する
     */
    ex_channel_id_buffer_to_reflect_current(channel) {
        this.ex_channel_id_buffer[channel]
            = new ChannelIDFilterParam(this.textbox_ch_username().val(),
                                       this.textarea_filter_ex_channel_id().val());
    }
    /*!
     *  @brief  現状を「非表示コメント(ユーザ)詳細加設定」バッファへ反映する
     */
    ex_comment_user_buffer_to_reflect_current(user) {
        this.ex_comment_user_buffer[user]
            = new CommentFilterByUserParam(
                                    this.checkbox_com_regexp().prop("checked"),
                                    this.checkbox_com_perfect_match().prop("checked"),
                                    this.checkbox_com_normalize().prop("checked"),
                                    this.checkbox_com_auto_ng_id().prop("checked"));
    }


    send_message_to_relative_tab(message) {
        browser.tabs.query({}, (tabs)=> {
            for (const tab of tabs) {
                const url = new urlWrapper(tab.url);
                if (url.in_youtube() || url.in_google()) {
                    browser.tabs.sendMessage(tab.id, message);
                }
            }
        });
    }

};

var popup = new Popup();
