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
            chrome.action.setIcon({ path : "../img/badge_on.png"});
        } else {
            chrome.action.setIcon({ path : "../img/badge_off.png"});
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
        this.checkbox_sw_filter().addEventListener('change', ()=> {
            this.button_save_enable();
        });
        this.checkbox_regexp().addEventListener('change', ()=> {
            this.button_save_enable();
        });
        this.checkbox_perfect_match().addEventListener('change',()=> {
            this.button_save_enable();
        });
        this.checkbox_normalize().addEventListener('change', ()=> {
            this.button_save_enable();
        });
        this.checkbox_com_regexp().addEventListener('change', ()=> {
            this.button_save_enable();
        });
        this.checkbox_com_perfect_match().addEventListener('change', ()=> {
            this.button_save_enable();
        });
        this.checkbox_com_normalize().addEventListener('change', ()=> {
            this.button_save_enable();
        });
        this.checkbox_com_auto_ng_id().addEventListener('change', ()=> {
            this.button_save_enable();
        });
        //
        this.selectbox_filter().addEventListener('change', ()=> {
            this.selectbox_filter_change();
        });
        //
        this.textarea_filter_channel().addEventListener('keyup', ()=> {
            this.textarea_filter_channel_keyup();
        });
        this.textarea_filter_channel().addEventListener('dblclick', ()=> {
            this.textarea_filter_channel_dblclick();
        });
        this.textarea_filter_channel_id().addEventListener('keyup', ()=> {
            this.textarea_filter_channel_id_keyup();
        });
        this.textarea_filter_channel_id().addEventListener('dblclick', ()=> {
            this.textarea_filter_channel_id_dblclick();
        });
        this.textarea_filter_title().addEventListener('keyup', ()=> {
            this.textarea_filter_title_keyup();
        });
        this.textarea_filter_ex_channel().addEventListener('keyup', ()=> {
            this.textarea_filter_ex_channel_keyup();
        });
        this.textarea_filter_ex_channel_id().addEventListener('keyup', ()=> {
            this.textarea_filter_ex_channel_id_keyup();
        });
        this.textbox_ch_username().addEventListener('keyup', ()=> {
            this.textbox_ch_username_keyup();
        });
        this.textarea_filter_comment_by_user().addEventListener('keyup', ()=> {
            this.textarea_filter_comment_by_user_keyup();
        });
        this.textarea_filter_comment_by_user().addEventListener('dblclick', ()=> {
            this.textarea_filter_comment_by_user_dblclick();
        });
        this.textarea_filter_comment_by_id().addEventListener('keyup', ()=> {
            this.textarea_filter_comment_by_id_keyup();
        });
        this.textarea_filter_comment_by_word().addEventListener('keyup', ()=> {
            this.textarea_filter_comment_by_word_keyup();
        });
        //
        this.button_save().addEventListener('click', ()=> {
            this.button_save_click();
        });
        this.button_detail().addEventListener('click', ()=> {
            this.button_detail_click();
        });
        //
    }

    checkbox_sw_filter() {
        return document.body.querySelector("input[name=sw_filter]");
    }
    get_flag_enable_filter() {
        return this.checkbox_sw_filter().checked;
    }
    get_flag_stop_autoplay() {
        return this.flag_stop_autoplay;
    }
    get_flag_disable_annotation() {
        return this.flag_disable_annotation;
    }
    get_flag_remove_sleeptimer() {
        return this.flag_remove_sleeptimer;
    }
    get_flag_disable_border_radius() {
        return this.flag_disable_border_radius;
    }
    get_flag_mute_shorts() {
        return this.flag_mute_shorts;
    }
    get_flag_remove_suggestion() {
        return this.flag_remove_suggestion;
    }
    get_flag_hidden_start() {
        return this.flag_hidden_start;
    }

    checkbox_regexp() {
        return document.body.querySelector("input#regexp");
    }
    checkbox_perfect_match() {
        return document.body.querySelector("input#perfectmatch");
    }
    checkbox_normalize() {
        return document.body.querySelector("input#normalize");
    }
    checkbox_com_regexp() {
        return document.body.querySelector("input#com_regexp");
    }
    checkbox_com_perfect_match() {
        return document.body.querySelector("input#com_perfectmatch");
    }
    checkbox_com_normalize() {
        return document.body.querySelector("input#com_normalize");
    }
    checkbox_com_auto_ng_id() {
        return document.body.querySelector("input#com_autongid");
    }
    checkbox_label_regexp() {
        return document.body.querySelector("label#regexp");
    }
    checkbox_label_perfect_match() {
        return document.body.querySelector("label#perfectmatch");
    }
    checkbox_label_normalize() {
        return document.body.querySelector("label#normalize");
    }
    checkbox_label_com_regexp() {
        return document.body.querySelector("label#com_regexp");
    }
    checkbox_label_com_perfect_match() {
        return document.body.querySelector("label#com_perfectmatch");
    }
    checkbox_label_com_normalize() {
        return document.body.querySelector("label#com_normalize");
    }
    checkbox_label_com_auto_ng_id() {
        return document.body.querySelector("label#com_autongid");
    }
    textbox_ch_username() {
        return document.body.querySelector("input#ch_username");
    }
    textbox_label_ch_username() {
        return document.body.querySelector("label#ch_username");
    }
    textbox_label_ch_username_br() {
        return document.body.querySelector("label#ch_username_br");
    }

    button_detail() {
        return document.body.querySelector("button[name=detail");
    }

    hide_textarea_all() {
        HTMLUtil.hide_element(this.textarea_filter_channel());
        HTMLUtil.hide_element(this.textarea_filter_channel_id());
        HTMLUtil.hide_element(this.textarea_filter_title());
        this.hide_ex_channel();
        this.hide_ex_channel_id();
        HTMLUtil.hide_element(this.textarea_filter_comment_by_user());
        HTMLUtil.hide_element(this.textarea_filter_comment_by_id());
        HTMLUtil.hide_element(this.textarea_filter_comment_by_word());
        this.hide_ex_comment_by_user();
    }
    hide_ex_channel() {
        HTMLUtil.hide_element(this.textarea_filter_ex_channel());
        HTMLUtil.hide_element(this.checkbox_regexp());
        HTMLUtil.hide_element(this.checkbox_perfect_match());
        HTMLUtil.hide_element(this.checkbox_normalize());
        HTMLUtil.hide_element(this.checkbox_label_regexp());
        HTMLUtil.hide_element(this.checkbox_label_perfect_match());
        HTMLUtil.hide_element(this.checkbox_label_normalize());
    }
    hide_ex_channel_id() {
        HTMLUtil.hide_element(this.textarea_filter_ex_channel_id());
        HTMLUtil.hide_element(this.textbox_ch_username());
        HTMLUtil.hide_element(this.textbox_label_ch_username());
        HTMLUtil.hide_element(this.textbox_label_ch_username_br());
    }
    hide_ex_comment_by_user() {
        HTMLUtil.hide_element(this.checkbox_com_regexp());
        HTMLUtil.hide_element(this.checkbox_com_perfect_match());
        HTMLUtil.hide_element(this.checkbox_com_normalize());
        HTMLUtil.hide_element(this.checkbox_com_auto_ng_id());
        HTMLUtil.hide_element(this.checkbox_label_com_regexp());
        HTMLUtil.hide_element(this.checkbox_label_com_perfect_match());
        HTMLUtil.hide_element(this.checkbox_label_com_normalize());
        HTMLUtil.hide_element(this.checkbox_label_com_auto_ng_id());
    }
    show_ex_channel() {
        HTMLUtil.show_element(this.textarea_filter_ex_channel());
        HTMLUtil.show_element(this.checkbox_regexp());
        HTMLUtil.show_element(this.checkbox_perfect_match());
        HTMLUtil.show_element(this.checkbox_normalize());
        HTMLUtil.show_element(this.checkbox_label_regexp());
        HTMLUtil.show_element(this.checkbox_label_perfect_match());
        HTMLUtil.show_element(this.checkbox_label_normalize());
    }
    show_ex_channel_id() {
        HTMLUtil.show_element(this.textarea_filter_ex_channel_id());
        HTMLUtil.show_element(this.textbox_ch_username());
        HTMLUtil.show_element(this.textbox_label_ch_username());
        HTMLUtil.show_element(this.textbox_label_ch_username_br());
    }
    show_ex_comment_by_user() {
        HTMLUtil.show_element(this.checkbox_com_regexp());
        HTMLUtil.show_element(this.checkbox_com_perfect_match());
        HTMLUtil.show_element(this.checkbox_com_normalize());
        HTMLUtil.show_element(this.checkbox_com_auto_ng_id());
        HTMLUtil.show_element(this.checkbox_label_com_regexp());
        HTMLUtil.show_element(this.checkbox_label_com_perfect_match());
        HTMLUtil.show_element(this.checkbox_label_com_normalize());
        HTMLUtil.show_element(this.checkbox_label_com_auto_ng_id());
    }

    textarea_filter_channel_keyup() {
        if (this.textarea_filter_channel().value !== this.storage.ng_channel_text) {
            this.button_save_enable();
        }
    }
    textarea_filter_channel_id_keyup() {
        if (this.textarea_filter_channel_id().value
            !== this.storage.ng_channel_id_text) {
            this.button_save_enable();
        }
    }
    textarea_filter_title_keyup() {
        if (this.textarea_filter_title().value !== this.storage.ng_title_text) {
            this.button_save_enable();
        }
    };
    textarea_filter_ex_channel_keyup() {
        if (this.textarea_filter_ex_channel().value
            !== this.ex_channel_buffer[this.ex_channel_last].black_titles) {
            this.button_save_enable();
        }
    }
    textarea_filter_ex_channel_id_keyup() {
        if (this.textarea_filter_ex_channel_id().value
            !== this.ex_channel_id_buffer[this.ex_channel_id_last].black_titles) {
            this.button_save_enable();
        }
    }
    textbox_ch_username_keyup() {
        if (this.textbox_ch_username().value
            !== this.ex_channel_id_buffer[this.ex_channel_id_last].commment) {
            this.button_save_enable();
        }
    }
    textarea_filter_comment_by_user_keyup() {
        if (this.textarea_filter_comment_by_user().value
            !== this.storage.ng_comment_by_user_text) {
            this.button_save_enable();
        }
    }
    textarea_filter_comment_by_id_keyup() {
        if (this.textarea_filter_comment_by_id().value
            !== this.storage.ng_comment_by_id_text) {
            this.button_save_enable();
        }
    };
    textarea_filter_comment_by_word_keyup() {
        if (this.textarea_filter_comment_by_word().value
            !== this.storage.ng_comment_by_word_text) {
            this.button_save_enable();
        }
    }

    /*!
     *  @brief  前回「非表示チャンネル詳細設定」の後始末
     */
    cleanup_ex_channel() {
        if (this.ex_channel_last !== '') {
            this.ex_channel_buffer_to_reflect_current(this.ex_channel_last);
            let key = this.selectbox_filter_key()
                    + " option[value=" + this.selectbox_value_ex_channel() + "]";
            document.body.querySelector(key).remove();
        }
    }
    //
    textarea_filter_channel_dblclick() {
        var t = this.textarea_filter_channel();
        const channel
            = text_utility.search_text_connected_by_new_line(
                t.selectionStart,
                t.value);
        if (channel == null) {
            return;
        }
        this.cleanup_ex_channel();
        this.cleanup_ex_channel_id();
        this.cleanup_ex_comment_by_user();
        this.ex_channel_last = channel;
        // selectboxに「${channel}の非表示タイトル」を追加
        {
            const val = this.selectbox_value_ex_channel();
            const max_disp_channel = 32;
            const text = `${channel.slice(0, max_disp_channel)}の非表示タイトル`;
            const option = document.createElement('option');
            option.value = val;
            option.textContent = text;
            this.selectbox_filter().append(option);
        }
        // ex_channel用textareaの準備
        {
            if (channel in this.ex_channel_buffer) {
                const obj = this.ex_channel_buffer[channel];
                this.textarea_filter_ex_channel().value = obj.black_titles;
                this.checkbox_regexp().checked = obj.b_regexp;
                this.checkbox_perfect_match().checked = obj.b_perfect_match;
                this.checkbox_normalize().checked = obj.b_normalize;
            } else {
                this.textarea_filter_ex_channel().value = '';
                this.checkbox_regexp().checked = false;
                this.checkbox_perfect_match().checked = false;
                this.checkbox_normalize().checked = false;
                this.ex_channel_buffer[channel]
                    = new ChannelFilterParam(false, false, false, '');
            }
        }
        this.selectbox_filter().value = this.selectbox_value_ex_channel();
        this.selectbox_filter_change();
    }

    /*!
     *  @brief  前回「非表示チャンネル(ID)詳細設定」の後始末
     */
    cleanup_ex_channel_id() {
        if (this.ex_channel_id_last !== '') {
            this.ex_channel_id_buffer_to_reflect_current(this.ex_channel_id_last);
            var key = this.selectbox_filter_key()
                    + " option[value=" + this.selectbox_value_ex_channel_id() + "]";
            document.body.querySelector(key).remove();
        }
    }
    //
    textarea_filter_channel_id_dblclick() {
        var t = this.textarea_filter_channel_id();
        const channel_id
            = text_utility.search_text_connected_by_new_line(
                t.selectionStart,
                t.value);
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
            const text = `${channel_id.slice(0, max_disp_channel_id)}の非表示タイトル`;
            const option = document.createElement('option');
            option.value = val;
            option.textContent = text;
            this.selectbox_filter().append(option);
        }
        // ex_channel用textareaの準備
        {
            if (channel_id in this.ex_channel_id_buffer) {
                const obj = this.ex_channel_id_buffer[channel_id];
                this.textarea_filter_ex_channel_id().value = obj.black_titles;
                this.textbox_ch_username().value = obj.comment;
            } else {
                this.textarea_filter_ex_channel_id().value = '';
                this.textbox_ch_username().value = '';
                this.ex_channel_id_buffer[channel_id]
                    = new ChannelIDFilterParam('', '');
            }
        }
        this.selectbox_filter().value = this.selectbox_value_ex_channel_id();
        this.selectbox_filter_change();
    }

    /*!
     *  @brief  前回「非表示コメント(ユーザ)詳細設定」の後始末
     */
    cleanup_ex_comment_by_user() {
        if (this.ex_comment_user_last !== '') {
            this.ex_comment_user_buffer_to_reflect_current(this.ex_comment_user_last);
            var key = this.selectbox_filter_key()
                    + " option[value=" + this.selectbox_value_ex_comment_user() + "]";
            document.body.querySelector(key).remove();
        }
    }
    //
    textarea_filter_comment_by_user_dblclick() {
        var t = this.textarea_filter_comment_by_user();
        const user
            = text_utility.search_text_connected_by_new_line(
                t.selectionStart,
                t.value);
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
            const text = `${user.slice(0, max_disp_user)}の詳細設定`;
            const option = document.createElement('option');
            option.value = val;
            option.textContent = text;
            this.selectbox_filter().append(option);
        }
        // checkbox準備
        {
            if (user in this.ex_comment_user_buffer) {
                const obj = this.ex_comment_user_buffer[user];
                this.checkbox_com_regexp().checked = obj.b_regexp;
                this.checkbox_com_perfect_match().checked = obj.b_perfect_match;
                this.checkbox_com_normalize().checked = obj.b_normalize;
                this.checkbox_com_auto_ng_id().checked = obj.b_auto_ng_id;
            } else {
                this.checkbox_com_regexp().checked = false;
                this.checkbox_com_perfect_match().checked = false;
                this.checkbox_com_normalize().checked = false;
                this.checkbox_com_auto_ng_id().checked = false;
                this.ex_comment_user_buffer[user]
                    = new CommentFilterByUserParam(false, false, false, false);
            }
        }
        this.selectbox_filter().value = this.selectbox_value_ex_comment_user();
        this.selectbox_filter_change();
    }

    selectbox_filter_key() {
        return "select[name=select_filter]";
    }
    selectbox_filter() {
        return document.body.querySelector(this.selectbox_filter_key());
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
        return this.selectbox_filter().value === "ng_channel_word";
    }
    is_selected_ng_channel_id() {
        return this.selectbox_filter().value === "ng_channel_id";
    }
    is_selected_ng_title() {
        return this.selectbox_filter().value === "ng_title";
    }
    is_selected_ng_ex_channel() {
        return this.selectbox_filter().value ===
                this.selectbox_value_ex_channel();
    }
    is_selected_ng_ex_channel_id() {
        return this.selectbox_filter().value ===
                this.selectbox_value_ex_channel_id();
    }
    is_selected_ng_comment_by_user() {
        return this.selectbox_filter().value === "ng_comment_user";
    }
    is_selected_ng_comment_by_id() {
        return this.selectbox_filter().value === "ng_comment_id";
    }
    is_selected_ng_comment_by_word() {
        return this.selectbox_filter().value === "ng_comment_word";
    }

    selectbox_filter_change() {
        this.hide_textarea_all();
        if (this.is_selected_ng_channel()) {
            HTMLUtil.show_element(this.textarea_filter_channel());
        } else if (this.is_selected_ng_channel_id()) {
            HTMLUtil.show_element(this.textarea_filter_channel_id());
        } else if (this.is_selected_ng_title()) {
            HTMLUtil.show_element(this.textarea_filter_title());
        } else if (this.is_selected_ng_ex_channel()) {
            this.show_ex_channel();
        } else if (this.is_selected_ng_ex_channel_id()) {
            this.show_ex_channel_id();
        } else if (this.is_selected_ng_comment_by_user()) {
            HTMLUtil.show_element(this.textarea_filter_comment_by_user());
        } else if (this.is_selected_ng_comment_by_id()) {
            HTMLUtil.show_element(this.textarea_filter_comment_by_id());
        } else if (this.is_selected_ng_comment_by_word()) {
            HTMLUtil.show_element(this.textarea_filter_comment_by_word());
        } else {
            this.show_ex_comment_by_user();
        }
    }

    button_save_click() {
        if (this.ex_channel_last !== '') {
            this.ex_channel_buffer_to_reflect_current(this.ex_channel_last);
        }
        if (this.ex_channel_id_last !== '') {
            this.ex_channel_id_buffer_to_reflect_current(this.ex_channel_id_last);
        }
        if (this.ex_comment_user_last !== '') {
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
        this.checkbox_sw_filter().checked = json.active;
        this.flag_stop_autoplay = json.stop_autoplay;
        this.flag_disable_annotation = json.disable_annotation;
        this.flag_remove_sleeptimer = this.storage.is_remove_sleeptimer();
        this.flag_disable_border_radius = this.storage.is_disable_border_radius();
        this.flag_mute_shorts = this.storage.is_mute_shorts();
        this.flag_remove_suggestion = this.storage.is_remove_suggestion();
        this.flag_hidden_start = this.storage.is_hidden_start();
    }

    /*!
     *  @brief  現状を「非表示チャンネル詳細加設定」バッファへ反映する
     */
    ex_channel_buffer_to_reflect_current(channel) {
        this.ex_channel_buffer[channel]
            = new ChannelFilterParam(this.checkbox_regexp().checked,
                                     this.checkbox_perfect_match().checked,
                                     this.checkbox_normalize().checked,
                                     this.textarea_filter_ex_channel().value);
    }
    /*!
     *  @brief  現状を「非表示チャンネル(ID)詳細加設定」バッファへ反映する
     */
    ex_channel_id_buffer_to_reflect_current(channel) {
        this.ex_channel_id_buffer[channel]
            = new ChannelIDFilterParam(this.textbox_ch_username().value,
                                       this.textarea_filter_ex_channel_id().value);
    }
    /*!
     *  @brief  現状を「非表示コメント(ユーザ)詳細加設定」バッファへ反映する
     */
    ex_comment_user_buffer_to_reflect_current(user) {
        this.ex_comment_user_buffer[user]
            = new CommentFilterByUserParam(
                                    this.checkbox_com_regexp().checked,
                                    this.checkbox_com_perfect_match().checked,
                                    this.checkbox_com_normalize().checked,
                                    this.checkbox_com_auto_ng_id().checked);
    }
};

var popup = new Popup();
