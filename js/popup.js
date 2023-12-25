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
 *  @brief  popup.js本体
 */
class Popup extends SettingBase {

    constructor() {
        super();
    }

    initialize() {
        super.initialize();
        this.badge = new Badge();
        this.storage.load().then(()=> {
            this.updateCheckbox();
            this.updateTextarea();
            this.badge.update(this.storage);
        });
        //
        this.checkbox_sw_filter().change(()=> {
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
        //
        this.button_save().click(()=> {
            this.button_save_click();
        });
        this.button_detail().click(()=> {
            this.button_detail_click();
        });
        //
    }

    checkbox_sw_filter() {
        return $("input[name=sw_filter]");
    }
    get_flag_enable_filter() {
        return this.checkbox_sw_filter().prop("checked");
    }
    get_flag_stop_autoplay() {
        return this.flag_stop_autoplay;
    }
    get_flag_disable_annotation() {
        return this.flag_disable_annotation;
    }
    get_flag_disable_border_radius() {
        return this.flag_disable_border_radius;
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

    button_detail() {
        return $("button[name=detail");
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

    selectbox_filter_change() {
        this.hide_textarea_all();
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
        } else {
            this.show_ex_comment_by_user();
        }
    }

    button_save_click() {
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
        this.save();
        //
        this.badge.update(this.storage);
    }

    button_detail_click() {
        chrome.tabs.create({url: './html/dashboard.html'}, tab => {});
    }

    updateCheckbox() {
        var json = this.storage.json;
        this.checkbox_sw_filter().prop("checked", json.active);
        this.flag_stop_autoplay = json.stop_autoplay;
        this.flag_disable_annotation = json.disable_annotation;
        this.flag_disable_border_radius = json.disable_border_radius;
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
};

var popup = new Popup();
