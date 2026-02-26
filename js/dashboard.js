/*!
 *  @brief  拡張機能固有タブ
 */
class Dashboard extends SettingBase {

    constructor() {
        super();
    }

    static textarea_keydown(event, f_keyup) {
        if (event.key == "ArrowDown" || event.key == "ArrowUp") {
            f_keyup();
        }
    }

    initialize() {
        super.initialize();
        this.add_message_listener();
        this.storage.load().then(()=> {
            this.update_option_checkbox();
            this.updateTextarea();
            this.presetTextarea();
        });
        //
        for (const btn of this.tab_buttons()) {
            btn.addEventListener('click', ()=> {
                this.tab_selected(btn);
            });
        }
        this.selectbox_channel_filter().addEventListener('change', ()=> {
            this.selectbox_channel_filter_change();
        });
        this.selectbox_comment_filter().addEventListener('change', ()=> {
            this.selectbox_comment_filter_change();
        });
        this.selectbox_imexport().addEventListener('change', ()=> {
            this.selectbox_imexport_change();
        });
        //
        const textarea_filter_channel = this.textarea_filter_channel();
        textarea_filter_channel.addEventListener('keyup', ()=> {
            this.textarea_filter_channel_keyup();
        });
        textarea_filter_channel.addEventListener('keydown', (event)=> {
            Dashboard.textarea_keydown(
                event, this.textarea_filter_channel_keyup.bind(this));
        });
        textarea_filter_channel.addEventListener('scroll', ()=> {
            this.textarea_filter_channel_scroll();
        });
        textarea_filter_channel.addEventListener('click', ()=> {
            this.textarea_filter_channel_click();
        });
        const textarea_filter_channel_id = this.textarea_filter_channel_id();
        textarea_filter_channel_id.addEventListener('keyup', ()=> {
            this.textarea_filter_channel_id_keyup();
        });
        textarea_filter_channel_id.addEventListener('keydown', (event)=> {
            Dashboard.textarea_keydown(
                event, this.textarea_filter_channel_id_keyup.bind(this));
        });
        textarea_filter_channel_id.addEventListener('scroll', ()=> {
            this.textarea_filter_channel_id_scroll();
        });
        textarea_filter_channel_id.addEventListener('click', ()=> {
            this.textarea_filter_channel_id_click();
        });
        this.textarea_filter_ex_channel().addEventListener('keyup', ()=> {
            this.textarea_filter_ex_channel_keyup();
        });
        this.textarea_filter_ex_channel_id().addEventListener('keyup', ()=> {
            this.textarea_filter_ex_channel_id_keyup();
        });
        this.textbox_channelname().addEventListener('keyup' ,()=> {
            this.textbox_channelname_keyup();
        });
        //
        this.textarea_filter_title().addEventListener('keyup', ()=> {
            this.textarea_filter_title_keyup();
        });
        //
        const textarea_filter_comment_by_user = this.textarea_filter_comment_by_user();
        textarea_filter_comment_by_user.addEventListener('keyup', ()=> {
            this.textarea_filter_comment_by_user_keyup();
        });
        textarea_filter_comment_by_user.addEventListener('keydown', (event)=> {
            Dashboard.textarea_keydown(
                event, this.textarea_filter_comment_by_user_keyup.bind(this));
        });
        textarea_filter_comment_by_user.addEventListener('scroll', ()=> {
            this.textarea_filter_comment_by_user_scroll();
        });
        textarea_filter_comment_by_user.addEventListener('click', ()=> {
            this.textarea_filter_comment_by_user_click();
        });
        this.textarea_filter_comment_by_id().addEventListener('keyup', ()=> {
            this.textarea_filter_comment_by_id_keyup();
        });
        this.textarea_filter_comment_by_word().addEventListener('keyup', ()=> {
            this.textarea_filter_comment_by_word_keyup();
        });
        this.textarea_filter_comment_by_handle().addEventListener('keyup', ()=> {
            this.textarea_filter_comment_by_handle_keyup();
        });
        //
        this.textarea_import_storage().addEventListener('paste',(e)=> {
            this.button_import_enable();
        });
        //
        this.checkbox_filter_ex_channel_regexp().addEventListener('change', ()=> {
            this.button_save_enable();
        });
        this.checkbox_filter_ex_channel_perfectmatch().addEventListener('change', ()=> {
            this.button_save_enable();
        });
        this.checkbox_filter_ex_channel_normalize().addEventListener('change', ()=> {
            this.button_save_enable();
        });
        this.checkbox_filter_ex_comment_by_user_regexp().addEventListener('change', ()=> {
            this.button_save_enable();
        });
        this.checkbox_filter_ex_comment_by_user_perfectmatch().addEventListener('change', ()=> {
            this.button_save_enable();
        });
        this.checkbox_filter_ex_comment_by_user_normalize().addEventListener('change', ()=> {
            this.button_save_enable();
        });
        this.checkbox_filter_ex_comment_by_user_auto_ng_id().addEventListener('change', ()=> {
            this.button_save_enable();
        });
        this.checkbox_stop_autoplay().addEventListener('change', ()=> {
            this.button_save_enable();
        });
        this.checkbox_disable_annotation().addEventListener('change', ()=> {
            this.button_save_enable();
        });
        this.checkbox_remove_sleeptimer().addEventListener('change', ()=> {
            this.button_save_enable();
        });
        this.checkbox_disable_border_radius().addEventListener('change', ()=> {
            this.button_save_enable();
        });
        this.checkbox_mute_shorts().addEventListener('change', ()=> {
            this.button_save_enable();
        });
        this.checkbox_remove_suggestion().addEventListener('change', ()=> {
            this.button_save_enable();
        });
        this.checkbox_hidden_start().addEventListener('change', ()=> {
            this.button_save_enable();
        });
        //
        this.button_save().addEventListener('click', ()=> {
            this.button_save_click();
        });
        this.button_import().addEventListener('click', ()=> {
            this.button_import_click();
        });
    }

    checkbox_filter_ex_channel_regexp() {
        return document.body.querySelector("input#filter_ex_channel_regexp");
    }
    checkbox_filter_ex_channel_perfectmatch() {
        return document.body.querySelector("input#filter_ex_channel_perfectmatch");
    }
    checkbox_filter_ex_channel_normalize() {
        return document.body.querySelector("input#filter_ex_channel_normalize");
    }
    checkbox_label_filter_ex_channel_regexp() {
        return document.body.querySelector("label#filter_ex_channel_regexp");
    }
    checkbox_label_filter_ex_channel_perfectmatch() {
        return document.body.querySelector("label#filter_ex_channel_perfectmatch");
    }
    checkbox_label_filter_ex_channel_normalize() {
        return document.body.querySelector("label#filter_ex_channel_normalize");
    }
    textbox_channelname() {
        return document.body.querySelector("input#channelname");
    }
    textbox_label_channelname() {
        return document.body.querySelector("label#channelname");
    }
    //
    checkbox_filter_ex_comment_by_user_regexp() {
        return document.body.querySelector("input#com_regexp");
    }
    checkbox_filter_ex_comment_by_user_perfectmatch() {
        return document.body.querySelector("input#com_perfectmatch");
    }
    checkbox_filter_ex_comment_by_user_normalize() {
        return document.body.querySelector("input#com_normalize");
    }
    checkbox_filter_ex_comment_by_user_auto_ng_id() {
        return document.body.querySelector("input#com_autongid");
    }
    checkbox_label_filter_ex_comment_by_user_regexp() {
        return document.body.querySelector("label#com_regexp");
    }
    checkbox_label_filter_ex_comment_by_user_perfectmatch() {
        return document.body.querySelector("label#com_perfectmatch");
    }
    checkbox_label_filter_ex_comment_by_user_normalize() {
        return document.body.querySelector("label#com_normalize");
    }
    checkbox_label_filter_ex_comment_by_user_auto_ng_id() {
        return document.body.querySelector("label#com_autongid");
    }
    //
    checkbox_stop_autoplay() {
        return document.body.querySelector("input#stop_autoplay");
    }
    checkbox_disable_annotation() {
        return document.body.querySelector("input#disable_annotation");
    }
    checkbox_remove_sleeptimer() {
        return document.body.querySelector("input#remove_sleeptimer");
    }
    checkbox_disable_border_radius() {
        return document.body.querySelector("input#disable_border_radius");
    }
    checkbox_mute_shorts() {
        return document.body.querySelector("input#mute_shorts");
    }
    checkbox_remove_suggestion() {
        return document.body.querySelector("input#remove_suggestion");
    }
    checkbox_hidden_start() {
        return document.body.querySelector("input#hidden_start");
    }
    checkbox_label_stop_autoplay() {
        return document.body.querySelector("label#stop_autoplay");
    }
    checkbox_label_disable_annotation() {
        return document.body.querySelector("label#disable_annotation");
    }
    checkbox_label_remove_sleeptimer() {
        return document.body.querySelector("label#remove_sleeptimer");
    }
    checkbox_label_disable_border_radius() {
        return document.body.querySelector("label#disable_border_radius");
    }
    checkbox_label_mute_shorts() {
        return document.body.querySelector("label#mute_shorts");
    }
    checkbox_label_remove_suggestion() {
        return document.body.querySelector("label#remove_suggestion");
    }
    checkbox_label_hidden_start() {
        return document.body.querySelector("label#hidden_start");
    }

    get_flag_enable_filter() {
        return this.flag_enable_filter;
    }
    get_flag_stop_autoplay() {
        return this.checkbox_stop_autoplay().checked;
    }
    get_flag_disable_annotation() {
        return this.checkbox_disable_annotation().checked;
    }
    get_flag_remove_sleeptimer() {
        return this.checkbox_remove_sleeptimer().checked;
    }
    get_flag_disable_border_radius() {
        return this.checkbox_disable_border_radius().checked;
    }
    get_flag_mute_shorts() {
        return this.checkbox_mute_shorts().checked;
    }
    get_flag_remove_suggestion() {
        return this.checkbox_remove_suggestion().checked;
    }
    get_flag_hidden_start() {
        return this.checkbox_hidden_start().checked;
    }
    //
    textarea_export_storage() {
        return document.body.querySelector("textarea[name=export_storage]");
    }
    textarea_import_storage() {
        return document.body.querySelector("textarea[name=import_storage]");
    }
    tab_buttons() {
        return document.body.querySelector("div.tabButtons").getElementsByTagName("button");
    }

    cursor_filter_channel() {
        return document.body.querySelector("div.cursor#filter_channel");
    }
    cursor_filter_channel_id() {
        return document.body.querySelector("div.cursor#filter_channel_id");
    }
    cursor_filter_comment_by_user() {
        return document.body.querySelector("div.cursor#filter_comment_by_user");
    }
    subheading_filter_ex_channel() {
        return document.body.querySelector("div.subheading#filter_ex_channel");
    }
    subheading_filter_ex_channel_id() {
        return document.body.querySelector("div.subheading#filter_ex_channel_id");
    }

    pagetop_filter_channel() {
        return document.body.querySelector("div.pagetop#filter_channel");
    }
    pagetop_filter_title() {
        return document.body.querySelector("div.pagetop#filter_title");
    }
    pagetop_filter_comment() {
        return document.body.querySelector("div.pagetop#filter_comment");
    }
    pagetop_imexport() {
        return document.body.querySelector("div.pagetop#imexport");
    }
    pagetop_option() {
        return document.body.querySelector("div.pagetop#option");
    }


    //
    hide_channel_filter_textarea_all() {
        HTMLUtil.hide_element(this.textarea_filter_channel());
        HTMLUtil.hide_element(this.textarea_filter_channel_id());
        HTMLUtil.hide_element(this.textarea_filter_ex_channel());
        HTMLUtil.hide_element(this.textarea_filter_ex_channel_id());
    }
    hide_channel_filter_cursor_all() {
        HTMLUtil.hide_element(this.cursor_filter_channel());
        HTMLUtil.hide_element(this.cursor_filter_channel_id());
    }
    hide_channel_filter_checkbox_all() {
        HTMLUtil.hide_element(this.checkbox_filter_ex_channel_regexp());
        HTMLUtil.hide_element(this.checkbox_filter_ex_channel_perfectmatch());
        HTMLUtil.hide_element(this.checkbox_filter_ex_channel_normalize());
        HTMLUtil.hide_element(this.checkbox_label_filter_ex_channel_regexp());
        HTMLUtil.hide_element(this.checkbox_label_filter_ex_channel_perfectmatch());
        HTMLUtil.hide_element(this.checkbox_label_filter_ex_channel_normalize());
    }
    show_channel_filter_checkbox_all() {
        HTMLUtil.show_element(this.checkbox_filter_ex_channel_regexp());
        HTMLUtil.show_element(this.checkbox_filter_ex_channel_perfectmatch());
        HTMLUtil.show_element(this.checkbox_filter_ex_channel_normalize());
        HTMLUtil.show_element(this.checkbox_label_filter_ex_channel_regexp());
        HTMLUtil.show_element(this.checkbox_label_filter_ex_channel_perfectmatch());
        HTMLUtil.show_element(this.checkbox_label_filter_ex_channel_normalize());
    }
    hide_filter_ex_channel() {
        HTMLUtil.hide_element(this.subheading_filter_ex_channel());
        HTMLUtil.hide_element(this.textarea_filter_ex_channel());
        this.hide_channel_filter_checkbox_all();
    }
    hide_filter_ex_channel_id() {
        HTMLUtil.hide_element(this.subheading_filter_ex_channel_id());
        HTMLUtil.hide_element(this.textarea_filter_ex_channel_id());
        HTMLUtil.hide_element(this.textbox_channelname());
        HTMLUtil.hide_element(this.textbox_label_channelname());
    }
    hide_channel_filter_all() {
        this.hide_channel_filter_textarea_all();
        this.hide_channel_filter_cursor_all();
        this.hide_filter_ex_channel();
        this.hide_filter_ex_channel_id();
    }
    //
    hide_title_filter_all() {
        HTMLUtil.hide_element(this.textarea_filter_title());
    }
    //
    hide_comment_filter_textarea_all() {
        HTMLUtil.hide_element(this.textarea_filter_comment_by_user());
        HTMLUtil.hide_element(this.textarea_filter_comment_by_id());
        HTMLUtil.hide_element(this.textarea_filter_comment_by_word());
        HTMLUtil.hide_element(this.textarea_filter_comment_by_handle());
    }
    hide_comment_filter_cursor_all() {
        HTMLUtil.hide_element(this.cursor_filter_comment_by_user());
    }
    hide_comment_filter_by_user_checkbox_all() {
        HTMLUtil.hide_element(this.checkbox_filter_ex_comment_by_user_regexp());
        HTMLUtil.hide_element(this.checkbox_filter_ex_comment_by_user_perfectmatch());
        HTMLUtil.hide_element(this.checkbox_filter_ex_comment_by_user_normalize());
        HTMLUtil.hide_element(this.checkbox_filter_ex_comment_by_user_auto_ng_id());
        HTMLUtil.hide_element(this.checkbox_label_filter_ex_comment_by_user_regexp());
        HTMLUtil.hide_element(this.checkbox_label_filter_ex_comment_by_user_perfectmatch());
        HTMLUtil.hide_element(this.checkbox_label_filter_ex_comment_by_user_normalize());
        HTMLUtil.hide_element(this.checkbox_label_filter_ex_comment_by_user_auto_ng_id());
    }
    show_comment_filter_by_user_checkbox_all() {
        HTMLUtil.show_element(this.checkbox_filter_ex_comment_by_user_regexp());
        HTMLUtil.show_element(this.checkbox_filter_ex_comment_by_user_perfectmatch());
        HTMLUtil.show_element(this.checkbox_filter_ex_comment_by_user_normalize());
        HTMLUtil.show_element(this.checkbox_filter_ex_comment_by_user_auto_ng_id());
        HTMLUtil.show_element(this.checkbox_label_filter_ex_comment_by_user_regexp());
        HTMLUtil.show_element(this.checkbox_label_filter_ex_comment_by_user_perfectmatch());
        HTMLUtil.show_element(this.checkbox_label_filter_ex_comment_by_user_normalize());
        HTMLUtil.show_element(this.checkbox_label_filter_ex_comment_by_user_auto_ng_id());
    }
    hide_filter_ex_comment_by_user() {
        this.hide_comment_filter_by_user_checkbox_all();
    }
    hide_comment_filter_all() {
        this.hide_comment_filter_textarea_all();
        this.hide_comment_filter_cursor_all();
        this.hide_filter_ex_comment_by_user();
    }
    //
    hide_imexport_textarea_all() {
        HTMLUtil.hide_element(this.textarea_export_storage());
        HTMLUtil.hide_element(this.textarea_import_storage());
        this.textarea_import_storage().value = '';
    }
    hide_imexport_all() {
        this.hide_imexport_textarea_all();
    }
    //
    hide_option_checkbox_all() {
        HTMLUtil.hide_element(this.checkbox_stop_autoplay());
        HTMLUtil.hide_element(this.checkbox_disable_annotation());
        HTMLUtil.hide_element(this.checkbox_remove_sleeptimer());
        HTMLUtil.hide_element(this.checkbox_disable_border_radius());
        HTMLUtil.hide_element(this.checkbox_mute_shorts());
        HTMLUtil.hide_element(this.checkbox_remove_suggestion());
        HTMLUtil.hide_element(this.checkbox_hidden_start());
        HTMLUtil.hide_element(this.checkbox_label_stop_autoplay());
        HTMLUtil.hide_element(this.checkbox_label_disable_annotation());
        HTMLUtil.hide_element(this.checkbox_label_remove_sleeptimer());
        HTMLUtil.hide_element(this.checkbox_label_disable_border_radius());
        HTMLUtil.hide_element(this.checkbox_label_mute_shorts());
        HTMLUtil.hide_element(this.checkbox_label_remove_suggestion());
        HTMLUtil.hide_element(this.checkbox_label_hidden_start());
    }
    show_option_checkbox_all() {
        HTMLUtil.show_element(this.checkbox_stop_autoplay());
        HTMLUtil.show_element(this.checkbox_disable_annotation());
        HTMLUtil.show_element(this.checkbox_remove_sleeptimer());
        HTMLUtil.show_element(this.checkbox_disable_border_radius());
        HTMLUtil.show_element(this.checkbox_mute_shorts());
        HTMLUtil.show_element(this.checkbox_remove_suggestion());
        HTMLUtil.show_element(this.checkbox_hidden_start());
        HTMLUtil.show_element(this.checkbox_label_stop_autoplay());
        HTMLUtil.show_element(this.checkbox_label_disable_annotation());
        HTMLUtil.show_element(this.checkbox_label_remove_sleeptimer());
        HTMLUtil.show_element(this.checkbox_label_disable_border_radius());
        HTMLUtil.show_element(this.checkbox_label_mute_shorts());
        HTMLUtil.show_element(this.checkbox_label_remove_suggestion());
        HTMLUtil.show_element(this.checkbox_label_hidden_start());
    }
    hide_option_all() {
        this.hide_option_checkbox_all();
    }
    //
    hide_main_all() {
        HTMLUtil.hide_element(this.selectbox_channel_filter());
        HTMLUtil.hide_element(this.selectbox_comment_filter());
        HTMLUtil.hide_element(this.selectbox_imexport());
        HTMLUtil.hide_element(this.pagetop_filter_channel());
        HTMLUtil.hide_element(this.pagetop_filter_title());
        HTMLUtil.hide_element(this.pagetop_filter_comment());
        HTMLUtil.hide_element(this.pagetop_imexport());
        HTMLUtil.hide_element(this.pagetop_option());
        this.hide_channel_filter_all();
        this.hide_title_filter_all();
        this.hide_comment_filter_all();
        this.hide_imexport_all();
        this.hide_option_all();
    }
    //
    show_export_storage() {
        this.textarea_export_storage().value = StoragePorter.export(this.storage.json);
        HTMLUtil.show_element(this.textarea_export_storage());
        HTMLUtil.hide_element(this.button_save());
        HTMLUtil.hide_element(this.button_import());
    }
    show_import_storage() {
        HTMLUtil.show_element(this.textarea_import_storage());
        HTMLUtil.hide_element(this.button_save());
        HTMLUtil.show_element(this.button_import());
    }

    //
    textarea_filter_channel_keyup() {
        if (this.textarea_filter_channel().value !== this.storage.ng_channel_text) {
            this.button_save_enable();
        }
        this.update_cursor_filter_channel();
        this.update_filter_ex_channel_item();
    }
    textarea_filter_channel_id_keyup() {
        if (this.textarea_filter_channel_id().value
            !== this.storage.ng_channel_id_text) {
            this.button_save_enable();
        }
        this.update_cursor_filter_channel_id();
        this.update_filter_ex_channel_id_item();
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
    textbox_channelname_keyup() {
        if (this.textbox_channelname().value
            !== this.ex_channel_id_buffer[this.ex_channel_id_last].commment) {
            this.button_save_enable();
        }
    }
    textarea_filter_comment_by_user_keyup() {
        if (this.textarea_filter_comment_by_user().value
            !== this.storage.ng_comment_by_user_text) {
            this.button_save_enable();
        }
        this.update_cursor_filter_comment_by_user();
        this.update_filter_ex_comment_by_user_item();
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
    textarea_filter_comment_by_handle_keyup() {
        if (this.textarea_filter_comment_by_handle().value
            !== this.storage.ng_comment_by_handle_text) {
            this.button_save_enable();
        }
    }

    update_cursor_filter_channel() {
        SettingBase.update_cursor(this.textarea_filter_channel(), 
                                 this.cursor_filter_channel.bind(this));
    }
    update_cursor_filter_channel_id() {
        SettingBase.update_cursor(this.textarea_filter_channel_id(), 
                                 this.cursor_filter_channel_id.bind(this));
    }
    update_cursor_filter_comment_by_user() {
        SettingBase.update_cursor(this.textarea_filter_comment_by_user(), 
                                 this.cursor_filter_comment_by_user.bind(this));
    }

    update_filter_ex_channel_item() {
        let t = this.textarea_filter_channel();
        let t_ex = this.textarea_filter_ex_channel();
        const f_dispoff = ()=> {
            this.ex_channel_last = null;
            this.hide_filter_ex_channel();
        };
        if (t == null || t_ex == null) {
            f_dispoff();
            return;
        }
        const word
            = text_utility.search_text_connected_by_new_line(
                t.selectionStart,
                t.value);
        if (word == null) {
            f_dispoff();
            return;
        }
        this.cleanup_ex_channel();
        this.ex_channel_last = word;
        //
        const subheading_offset_x = t.clientWidth + 32;
        let subheading = this.subheading_filter_ex_channel();
        subheading.textContent = `${word}の非表示タイトル`
        subheading.setAttribute("style", `left:${subheading_offset_x}px`);
        //
        const t_ex_offset_x = subheading_offset_x;
        const t_ex_offset_y = 32;
        const t_ex_style
            = `position:absolute;top:${t_ex_offset_y}px;left:${t_ex_offset_x}px`;
        t_ex.setAttribute("style", t_ex_style);
        let ckbox_regexp = this.checkbox_filter_ex_channel_regexp();
        let ckbox_perfectmatch = this.checkbox_filter_ex_channel_perfectmatch();
        let ckbox_normalize = this.checkbox_filter_ex_channel_normalize();
        if (word in this.ex_channel_buffer) {
            const obj = this.ex_channel_buffer[word];
            t_ex.value = obj.black_titles;
            ckbox_regexp.checked = obj.b_regexp;
            ckbox_perfectmatch.checked = obj.b_perfect_match;
            ckbox_normalize.checked = obj.b_normalize;
        } else {
            t_ex.value = '';
            ckbox_regexp.checked = false;
            ckbox_perfectmatch.checked = false;
            ckbox_normalize.checked = false;
            this.ex_channel_buffer[word]
                = new ChannelFilterParam(false, false, false, '');
        }
        const ckbox_offset_x = subheading_offset_x;
        const ckbox_offset_y = t_ex_offset_y + t_ex.clientHeight + 16;
        const ckbox_style = `top:${ckbox_offset_y}px;left:${ckbox_offset_x}px`;
        let chbox_ex_channel
            = document.body.querySelector("div.checkbox#filter_ex_channel");
        chbox_ex_channel.setAttribute("style", ckbox_style);
        this.show_channel_filter_checkbox_all();
    }
    update_filter_ex_channel_id_item() {
        let t = this.textarea_filter_channel_id();
        let t_ex = this.textarea_filter_ex_channel_id();
        const f_dispoff = ()=> {
            this.ex_channel_id_last = null;
            this.hide_filter_ex_channel_id();
        };
        if (t == null || t_ex == null) {
            f_dispoff();
            return;
        }
        const channel_id
            = text_utility.search_text_connected_by_new_line(
                t.selectionStart,
                t.value);
        if (channel_id == null) {
            f_dispoff();
            return;
        }
        this.cleanup_ex_channel_id();
        this.ex_channel_id_last = channel_id;
        //
        const subheading_offset_x = t.clientWidth + 32;
        let subheading = this.subheading_filter_ex_channel_id();
        subheading.textContent = `${channel_id}の非表示タイトル`;
        subheading.setAttribute("style", `left:${subheading_offset_x}px`);
        //
        const t_ex_offset_x = subheading_offset_x;
        const t_ex_offset_y = 32;
        const t_ex_style
            = `position:absolute;top:${t_ex_offset_y}px;left:${t_ex_offset_x}px`;
        t_ex.setAttribute("style", t_ex_style);
        {
            if (channel_id in this.ex_channel_id_buffer) {
                const obj = this.ex_channel_id_buffer[channel_id];
                this.textarea_filter_ex_channel_id().value = obj.black_titles;
                this.textbox_channelname().value = obj.comment;
            } else {
                this.textarea_filter_ex_channel_id().value = '';
                this.textbox_channelname().value = ''
                this.ex_channel_id_buffer[channel_id]
                    = new ChannelIDFilterParam('', '');
            }
        }
        const chname_offset_x = subheading_offset_x;
        const chname_offset_y = t_ex_offset_y + t_ex.clientHeight + 16;
        const chname_style = `top:${chname_offset_y}px;left:${chname_offset_x}px`;
        let chname_ex_channel_id
            = document.body.querySelector("div.channelname#filter_ex_channel_id");
        chname_ex_channel_id.setAttribute("style", chname_style);
        HTMLUtil.show_element(this.textbox_channelname());
        HTMLUtil.show_element(this.textbox_label_channelname());
    }
    update_filter_ex_comment_by_user_item() {
        let t = this.textarea_filter_comment_by_user();
        const f_dispoff = ()=> {
            this.ex_comment_user_last = null;
            this.hide_filter_ex_comment_by_user();
        };
        if (t == null) {
            f_dispoff();
            return;
        }
        const word
            = text_utility.search_text_connected_by_new_line(
                t.selectionStart,
                t.value);
        if (word == null) {
            f_dispoff();
            return;
        }
        this.cleanup_ex_comment_by_user();
        this.ex_comment_user_last = word;
        //
        let ckbox_regexp = this.checkbox_filter_ex_comment_by_user_regexp();
        let ckbox_perfectmatch = this.checkbox_filter_ex_comment_by_user_perfectmatch();
        let ckbox_normalize = this.checkbox_filter_ex_comment_by_user_normalize();
        let ckbox_auto_ng_id = this.checkbox_filter_ex_comment_by_user_auto_ng_id();
        if (word in this.ex_comment_user_buffer) {
            const obj = this.ex_comment_user_buffer[word];
            ckbox_regexp.checked = obj.b_regexp;
            ckbox_perfectmatch.checked = obj.b_perfect_match;
            ckbox_normalize.checked = obj.b_normalize;
            ckbox_auto_ng_id.checked = obj.b_auto_ng_id;
        } else {
            ckbox_regexp.checked = false;
            ckbox_perfectmatch.checked = false;
            ckbox_normalize.checked = false;
            ckbox_auto_ng_id.checked = false;
            this.ex_comment_user_buffer[word]
                = new CommentFilterByUserParam(false, false, false, false);
        }
        const ckbox_offset_x = t.clientWidth + 32;
        const ckbox_offset_y = 16;
        const ckbox_style = `top:${ckbox_offset_y}px;left:${ckbox_offset_x}px`;
        const chbox_ex_comment_by_user
            = document.body.querySelector("div.checkbox#filter_ex_comment_by_user");
        chbox_ex_comment_by_user.setAttribute("style", ckbox_style);
        this.show_comment_filter_by_user_checkbox_all();
    }
    //
    update_option_checkbox() {
        const json = this.storage.json;
        this.flag_enable_filter = json.active;
        this.checkbox_stop_autoplay().checked
            = json.stop_autoplay == null ?false
                                         :json.stop_autoplay;
        this.checkbox_disable_annotation().checked
            = json.disable_annotation == null ?false
                                              :json.disable_annotation;
        this.checkbox_remove_sleeptimer().checked
            = json.remove_sleeptimer == null ?false
                                             :json.remove_sleeptimer;
        this.checkbox_disable_border_radius().checked
            = this.storage.is_disable_border_radius();
        this.checkbox_mute_shorts().checked = this.storage.is_mute_shorts();
        this.checkbox_remove_suggestion().checked
            = this.storage.is_remove_suggestion();
        this.checkbox_hidden_start().checked = this.storage.is_hidden_start();
        this.show_option_checkbox_all();
    }
    //
    textarea_filter_channel_scroll() {
        this.update_cursor_filter_channel();
    }
    textarea_filter_channel_click() {
        this.update_cursor_filter_channel();
        this.update_filter_ex_channel_item();
    }
    textarea_filter_channel_id_scroll() {
        this.update_cursor_filter_channel_id();
    }
    textarea_filter_channel_id_click() {
        this.update_cursor_filter_channel_id();
        this.update_filter_ex_channel_id_item();
    }
    textarea_filter_comment_by_user_scroll() {
        this.update_cursor_filter_comment_by_user();
    }
    textarea_filter_comment_by_user_click() {
        this.update_cursor_filter_comment_by_user();
        this.update_filter_ex_comment_by_user_item();
    }

    /*!
     *  @brief  前回「非表示チャンネル詳細設定」の後始末
     */
    cleanup_ex_channel() {
        if (this.ex_channel_last !== '') {
            this.ex_channel_buffer_to_reflect_current(this.ex_channel_last);
        }
    }
    /*!
     *  @brief  前回「非表示チャンネル(ID)詳細設定」の後始末
     */
    cleanup_ex_channel_id() {
        if (this.ex_channel_id_last !== '') {
            this.ex_channel_id_buffer_to_reflect_current(this.ex_channel_id_last);
        }
    }
    /*!
     *  @brief  前回「非表示コメント(ユーザ)詳細設定」の後始末
     */
    cleanup_ex_comment_by_user() {
        if (this.ex_comment_user_last !== '') {
            this.ex_comment_user_buffer_to_reflect_current(this.ex_comment_user_last);
        }
    }

    selectbox_channel_filter() {
        return document.body.querySelector("select[name=select_channel_filter]");
    }
    selectbox_comment_filter() {
        return document.body.querySelector("select[name=select_comment_filter]");
    }
    selectbox_imexport() {
        return document.body.querySelector("select[name=select_imexport]");
    }

    is_selected_ng_channel() {
        return this.selectbox_channel_filter().value === "ng_channel_word";
    }
    is_selected_ng_channel_id() {
        return this.selectbox_channel_filter().value === "ng_channel_id";
    }
    is_selected_ng_comment_by_user() {
        return this.selectbox_comment_filter().value === "ng_comment_user";
    }
    is_selected_ng_comment_by_id() {
        return this.selectbox_comment_filter().value === "ng_comment_id";
    }
    is_selected_ng_comment_by_word() {
        return this.selectbox_comment_filter().value === "ng_comment_word";
    }
    is_selected_ng_comment_by_handle() {
        return this.selectbox_comment_filter().value === "ng_comment_handle";
    }
    is_selected_export_storage() {
        return this.selectbox_imexport().value === "export";
    }
    is_selected_import_storage() {
        return this.selectbox_imexport().value === "import";
    }

    static kick_textarea(t) {
        const tx = t();
        HTMLUtil.show_element(tx);
        tx.focus();
        tx.click();
    }
    selectbox_channel_filter_change() {
        this.hide_channel_filter_all();
        if (this.is_selected_ng_channel()) {
            Dashboard.kick_textarea(this.textarea_filter_channel.bind(this));
        } else
        if (this.is_selected_ng_channel_id()) {
            Dashboard.kick_textarea(this.textarea_filter_channel_id.bind(this));
        } else {
            return;
        }
    }
    selectbox_comment_filter_change() {
        this.hide_comment_filter_all();
        if (this.is_selected_ng_comment_by_user()) {
            Dashboard.kick_textarea(this.textarea_filter_comment_by_user.bind(this));
        } else
        if (this.is_selected_ng_comment_by_id()) {
            Dashboard.kick_textarea(this.textarea_filter_comment_by_id.bind(this));
            HTMLUtil.show_element(this.textarea_filter_comment_by_id());
        } else
        if (this.is_selected_ng_comment_by_word()) {
            Dashboard.kick_textarea(this.textarea_filter_comment_by_word.bind(this));
        } else
        if (this.is_selected_ng_comment_by_handle()) {
            Dashboard.kick_textarea(this.textarea_filter_comment_by_handle.bind(this));
        } else {
            return;
        }
    }
    selectbox_imexport_change() {
        this.hide_imexport_all();
        if (this.is_selected_export_storage()) {
            this.show_export_storage();
        } else
        if (this.is_selected_import_storage()) {
            this.show_import_storage();
        } else {
            return;
        }
    }

    button_save_click() {
        this.cleanup_ex_channel();
        this.cleanup_ex_channel_id();
        this.cleanup_ex_comment_by_user();
        //
        super.save();
    }

    button_import_click() {
        const importer = new StoragePorter(this.storage.json);
        if (importer.import(this.textarea_import_storage().value)) {
            this.storage.json = importer.json;
            this.storage.save();
            this.storage.update_text();
            this.updateTextarea();
            this.textarea_import_storage().value = "[[OK]]";
        } else {
            this.textarea_import_storage().value = "[[ERROR]]";
        }
    }

    static button_is_selected(btn) {
        return btn.className.indexOf('selected') > 0;
    }

    tab_selected(clicked_btn) {
        if (Dashboard.button_is_selected(clicked_btn)) {
            return;
        }
        for (const btn of this.tab_buttons()) {
            if (btn == clicked_btn) {
                btn.setAttribute('class', 'tabButton selected');
            } else
            if (Dashboard.button_is_selected(btn)) {
                btn.setAttribute('class', 'tabButton');
            }
        }
        this.hide_main_all();
        HTMLUtil.hide_element(this.button_import());
        HTMLUtil.hide_element(this.button_save());
        switch(clicked_btn.getAttribute('name')) {
        case 'tab_channel_filter':
            this.display_elem_channel_filter();
            break;
        case 'tab_title_filter':
            this.display_elem_title_filter();
            break;
        case 'tab_comment_filter':
            this.display_elem_comment_filter();
            break;
        case 'tab_imexport':
            this.display_elem_imexport();
            break;
        case 'tab_option':
            this.display_elem_option();
            break;
        }
    }

    //
    display_elem_channel_filter() {
        HTMLUtil.show_element(this.pagetop_filter_channel());
        HTMLUtil.show_element(this.selectbox_channel_filter());
        this.selectbox_channel_filter_change();
        HTMLUtil.show_element(this.button_save());
    }
    display_elem_title_filter() {
        HTMLUtil.show_element(this.pagetop_filter_title());
        HTMLUtil.show_element(this.textarea_filter_title());
        HTMLUtil.show_element(this.button_save());
    }
    display_elem_comment_filter() {
        HTMLUtil.show_element(this.pagetop_filter_comment());
        HTMLUtil.show_element(this.selectbox_comment_filter());
        this.selectbox_comment_filter_change();
        HTMLUtil.show_element(this.button_save());
    }
    display_elem_imexport() {
        HTMLUtil.show_element(this.pagetop_imexport());
        HTMLUtil.show_element(this.selectbox_imexport());
        this.selectbox_imexport_change();
    }
    display_elem_option() {
        HTMLUtil.show_element(this.pagetop_option());
        this.update_option_checkbox();
        HTMLUtil.show_element(this.button_save());
    }

    presetTextarea() {
        SettingBase.reset_textarea_caret(this.textarea_filter_channel());
        this.textarea_filter_channel().focus();
        this.textarea_filter_channel_click();
        SettingBase.reset_textarea_caret(this.textarea_filter_channel_id());
        SettingBase.reset_textarea_caret(this.textarea_filter_comment_by_user());
        SettingBase.reset_textarea_caret(this.textarea_filter_comment_by_id());
        SettingBase.reset_textarea_caret(this.textarea_filter_comment_by_word());
        SettingBase.reset_textarea_caret(this.textarea_filter_comment_by_handle());
    }

    /*!
     *  @brief  現状を「非表示チャンネル詳細加設定」バッファへ反映する
     */
    ex_channel_buffer_to_reflect_current(channel) {
        this.ex_channel_buffer[channel] = new ChannelFilterParam(
            this.checkbox_filter_ex_channel_regexp().checked,
            this.checkbox_filter_ex_channel_perfectmatch().checked,
            this.checkbox_filter_ex_channel_normalize().checked,
            this.textarea_filter_ex_channel().value);
    }
    /*!
     *  @brief  現状を「非表示チャンネル(ID)詳細加設定」バッファへ反映する
     */
    ex_channel_id_buffer_to_reflect_current(channel) {
        this.ex_channel_id_buffer[channel]
            = new ChannelIDFilterParam(this.textbox_channelname().value,
                                       this.textarea_filter_ex_channel_id().value);
    }
    /*!
     *  @brief  現状を「非表示コメント(ユーザ)詳細加設定」バッファへ反映する
     */
    ex_comment_user_buffer_to_reflect_current(user) {
        this.ex_comment_user_buffer[user] = new CommentFilterByUserParam(
            this.checkbox_filter_ex_comment_by_user_regexp().checked,
            this.checkbox_filter_ex_comment_by_user_perfectmatch().checked,
            this.checkbox_filter_ex_comment_by_user_normalize().checked,
            this.checkbox_filter_ex_comment_by_user_auto_ng_id().checked);
    }

    /*! 
     *  @brief  storageを再取得し反映する
     *  @note   extentionやpopupでのstorage変更通知から呼ばれる
     */
    update_storage() {
        this.storage.load().then(()=> {
            this.update_option_checkbox();
            this.updateTextarea();
            const selected_btn = HTMLUtil.get_selected_element(this.tab_buttons());
            if (selected_btn == null) {
                return;
            }
            switch (selected_btn.getAttribute('name')) {
            case 'tab_channel_filter':
                this.selectbox_channel_filter_change();
                break;
            case 'tab_comment_filter':
                this.selectbox_comment_filter_change();
                break;
            case 'tab_imexport':
                this.selectbox_imexport_change();
                break;
            default:
                break;
            }
        });
    }

    add_message_listener() {
        chrome.runtime.onMessage.addListener(
            (request, sender, sendResponce)=> {
                if (request.command == MessageUtil.command_update_storage() ||
                    request.command == MessageUtil.command_add_mute_id()) {
                    this.update_storage();
                }
                return true;
            }
        );
    }
};

var popup = new Dashboard();
