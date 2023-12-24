/*!
 *  @brief  拡張機能固有タブ
 */
class Dashboard {

    constructor() {
        this.initialize();
    }

    static textarea_keydown(event, f_keyup) {
        if (event.key == "ArrowDown" || event.key == "ArrowUp") {
            f_keyup();
        }
    }

    initialize() {
        this.storage = new StorageData();
        this.storage.load().then(()=> {
            this.update_option_checkbox();
            this.updateTextarea();
            this.presetTextarea();
        });
        this.ex_channel_buffer = [];        // 非表示チャンネル詳細設定バッファ(各種フラグ/個別非表示タイトル)
        this.ex_channel_last = '';          // 最後に「非表示チャンネル詳細設定」画面を開いたチャンネル名
        this.ex_channel_id_buffer = [];     // 非表示チャンネル詳細設定バッファ(各種フラグ/個別非表示タイトル)
        this.ex_channel_id_last = '';       // 最後に「非表示チャンネル詳細設定」画面を開いたチャンネル名
        this.ex_comment_user_buffer = [];   // 非表示コメント(ユーザ)詳細設定バッファ(各種フラグ)
        this.ex_comment_user_last = '';     // 最後に「非表示コメント(ユーザ)詳細設定」画面を開いたユーザ名
        //
        this.tab_buttons().each((inx, btn)=> {
            $(btn).click(()=> {
                this.tab_selected(btn);
            });
        });
        this.selectbox_channel_filter().change(()=> {
            this.selectbox_channel_filter_change();
        });
        this.selectbox_comment_filter().change(()=> {
            this.selectbox_comment_filter_change();
        });
        this.selectbox_imexport().change(()=> {
            this.selectbox_imexport_change();
        });
        //
        this.textarea_filter_channel().keyup(()=> {
            this.textarea_filter_channel_keyup();
        });
        this.textarea_filter_channel().keydown((event)=> {
            Dashboard.textarea_keydown(
                event, this.textarea_filter_channel_keyup.bind(this));
        });
        this.textarea_filter_channel().scroll(()=> {
            this.textarea_filter_channel_scroll();
        });
        this.textarea_filter_channel().click(()=> {
            this.textarea_filter_channel_click();
        });
        this.textarea_filter_channel_id().keyup(()=> {
            this.textarea_filter_channel_id_keyup();
        });
        this.textarea_filter_channel_id().keydown((event)=> {
            Dashboard.textarea_keydown(
                event, this.textarea_filter_channel_id_keyup.bind(this));
        });
        this.textarea_filter_channel_id().scroll(()=> {
            this.textarea_filter_channel_id_scroll();
        });
        this.textarea_filter_channel_id().click(()=> {
            this.textarea_filter_channel_id_click();
        });
        this.textarea_filter_ex_channel().keyup(()=> {
            this.textarea_filter_ex_channel_keyup();
        });
        this.textarea_filter_ex_channel_id().keyup(()=> {
            this.textarea_filter_ex_channel_id_keyup();
        });
        this.textbox_channelname().keyup(()=> {
            this.textbox_channelname_keyup();
        });
        //
        this.textarea_filter_title().keyup(()=> {
            this.textarea_filter_title_keyup();
        });
        //
        this.textarea_filter_comment_by_user().keyup(()=> {
            this.textarea_filter_comment_by_user_keyup();
        });
        this.textarea_filter_comment_by_user().keydown((event)=> {
            Dashboard.textarea_keydown(
                event, this.textarea_filter_comment_by_user_keyup.bind(this));
        });
        this.textarea_filter_comment_by_user().scroll(()=> {
            this.textarea_filter_comment_by_user_scroll();
        });        
        this.textarea_filter_comment_by_user().click(()=> {
            this.textarea_filter_comment_by_user_click();
        });
        this.textarea_filter_comment_by_id().keyup(()=> {
            this.textarea_filter_comment_by_id_keyup();
        });
        this.textarea_filter_comment_by_word().keyup(()=> {
            this.textarea_filter_comment_by_word_keyup();
        });
        //
        this.textarea_import_storage().on('paste',(e)=> {
            this.button_import_enable();
        });
        //
        this.checkbox_filter_ex_channel_regexp().change(()=> {
            this.button_save_enable();
        });
        this.checkbox_filter_ex_channel_perfectmatch().change(()=> {
            this.button_save_enable();
        });
        this.checkbox_filter_ex_channel_normalize().change(()=> {
            this.button_save_enable();
        });
        this.checkbox_filter_ex_comment_by_user_regexp().change(()=> {
            this.button_save_enable();
        });
        this.checkbox_filter_ex_comment_by_user_perfectmatch().change(()=> {
            this.button_save_enable();
        });
        this.checkbox_filter_ex_comment_by_user_normalize().change(()=> {
            this.button_save_enable();
        });
        this.checkbox_filter_ex_comment_by_user_auto_ng_id().change(()=> {
            this.button_save_enable();
        });
        this.checkbox_stop_autoplay().change(()=> {
            this.button_save_enable();
        });
        this.checkbox_disable_annotation().change(()=> {
            this.button_save_enable();
        });
        this.checkbox_disable_border_radius().change(()=> {
            this.button_save_enable();
        });
        //
        this.button_save().click(()=> {
            this.button_save_click();
        });
        this.button_import().click(()=> {
            this.button_import_click();
        });
    }

    checkbox_filter_ex_channel_regexp() {
        return $("input#filter_ex_channel_regexp");
    }
    checkbox_filter_ex_channel_perfectmatch() {
        return $("input#filter_ex_channel_perfectmatch");
    }
    checkbox_filter_ex_channel_normalize() {
        return $("input#filter_ex_channel_normalize");
    }
    checkbox_label_filter_ex_channel_regexp() {
        return $("label#filter_ex_channel_regexp");
    }
    checkbox_label_filter_ex_channel_perfectmatch() {
        return $("label#filter_ex_channel_perfectmatch");
    }
    checkbox_label_filter_ex_channel_normalize() {
        return $("label#filter_ex_channel_normalize");
    }
    textbox_channelname() {
        return $("input#channelname");
    }
    textbox_label_channelname() {
        return $("label#channelname");
    }
    //
    checkbox_filter_ex_comment_by_user_regexp() {
        return $("input#com_regexp");
    }
    checkbox_filter_ex_comment_by_user_perfectmatch() {
        return $("input#com_perfectmatch");
    }
    checkbox_filter_ex_comment_by_user_normalize() {
        return $("input#com_normalize");
    }
    checkbox_filter_ex_comment_by_user_auto_ng_id() {
        return $("input#com_autongid");
    }
    checkbox_label_filter_ex_comment_by_user_regexp() {
        return $("label#com_regexp");
    }
    checkbox_label_filter_ex_comment_by_user_perfectmatch() {
        return $("label#com_perfectmatch");
    }
    checkbox_label_filter_ex_comment_by_user_normalize() {
        return $("label#com_normalize");
    }
    checkbox_label_filter_ex_comment_by_user_auto_ng_id() {
        return $("label#com_autongid");
    }
    //
    checkbox_stop_autoplay() {
        return $("input#stop_autoplay");
    }
    checkbox_disable_annotation() {
        return $("input#disable_annotation");
    }
    checkbox_disable_border_radius() {
        return $("input#disable_border_radius");
    }
    checkbox_label_stop_autoplay() {
        return $("label#stop_autoplay");
    }
    checkbox_label_disable_annotation() {
        return $("label#disable_annotation");
    }
    checkbox_label_disable_border_radius() {
        return $("label#disable_border_radius");
    }
    //
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
    //
    tab_buttons() {
        return $("div.tabButtons").find("button");
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

    cursor_filter_channel() {
        return $("div.cursor#filter_channel");
    }
    cursor_filter_channel_id() {
        return $("div.cursor#filter_channel_id");
    }
    cursor_filter_comment_by_user() {
        return $("div.cursor#filter_comment_by_user");
    }
    subheading_filter_ex_channel() {
        return $("div.subheading#filter_ex_channel");
    }
    subheading_filter_ex_channel_id() {
        return $("div.subheading#filter_ex_channel_id");
    }

    pagetop_filter_channel() {
        return $("div.pagetop#filter_channel");
    }
    pagetop_filter_title() {
        return $("div.pagetop#filter_title");
    }
    pagetop_filter_comment() {
        return $("div.pagetop#filter_comment");
    }
    pagetop_imexport() {
        return $("div.pagetop#imexport");
    }
    pagetop_option() {
        return $("div.pagetop#option");
    }


    //
    hide_channel_filter_textarea_all() {
        this.textarea_filter_channel().hide();
        this.textarea_filter_channel_id().hide();
        this.textarea_filter_ex_channel().hide();
        this.textarea_filter_ex_channel_id().hide();
    }
    hide_channel_filter_cursor_all() {
        this.cursor_filter_channel().hide();
        this.cursor_filter_channel_id().hide();
    }
    hide_channel_filter_checkbox_all() {
        this.checkbox_filter_ex_channel_regexp().hide();
        this.checkbox_filter_ex_channel_perfectmatch().hide();
        this.checkbox_filter_ex_channel_normalize().hide();
        this.checkbox_label_filter_ex_channel_regexp().hide();
        this.checkbox_label_filter_ex_channel_perfectmatch().hide();
        this.checkbox_label_filter_ex_channel_normalize().hide();
    }
    show_channel_filter_checkbox_all() {
        this.checkbox_filter_ex_channel_regexp().show();
        this.checkbox_filter_ex_channel_perfectmatch().show();
        this.checkbox_filter_ex_channel_normalize().show();
        this.checkbox_label_filter_ex_channel_regexp().show();
        this.checkbox_label_filter_ex_channel_perfectmatch().show();
        this.checkbox_label_filter_ex_channel_normalize().show();
    }
    hide_filter_ex_channel() {
        this.subheading_filter_ex_channel().hide();
        this.textarea_filter_ex_channel().hide();
        this.hide_channel_filter_checkbox_all();
    }
    hide_filter_ex_channel_id() {
        this.subheading_filter_ex_channel_id().hide();
        this.textarea_filter_ex_channel_id().hide();
        this.textbox_channelname().hide();
        this.textbox_label_channelname().hide();
    }
    hide_channel_filter_all() {
        this.hide_channel_filter_textarea_all();
        this.hide_channel_filter_cursor_all();
        this.hide_filter_ex_channel();
        this.hide_filter_ex_channel_id();
    }
    //
    hide_title_filter_all() {
        this.textarea_filter_title().hide();
    }
    //
    hide_comment_filter_textarea_all() {
        this.textarea_filter_comment_by_user().hide();
        this.textarea_filter_comment_by_id().hide();
        this.textarea_filter_comment_by_word().hide();
    }
    hide_comment_filter_cursor_all() {
        this.cursor_filter_comment_by_user().hide();
    }
    hide_comment_filter_by_user_checkbox_all() {
        this.checkbox_filter_ex_comment_by_user_regexp().hide();
        this.checkbox_filter_ex_comment_by_user_perfectmatch().hide();
        this.checkbox_filter_ex_comment_by_user_normalize().hide();
        this.checkbox_filter_ex_comment_by_user_auto_ng_id().hide();
        this.checkbox_label_filter_ex_comment_by_user_regexp().hide();
        this.checkbox_label_filter_ex_comment_by_user_perfectmatch().hide();
        this.checkbox_label_filter_ex_comment_by_user_normalize().hide();
        this.checkbox_label_filter_ex_comment_by_user_auto_ng_id().hide();
    }
    show_comment_filter_by_user_checkbox_all() {
        this.checkbox_filter_ex_comment_by_user_regexp().show();
        this.checkbox_filter_ex_comment_by_user_perfectmatch().show();
        this.checkbox_filter_ex_comment_by_user_normalize().show();
        this.checkbox_filter_ex_comment_by_user_auto_ng_id().show();
        this.checkbox_label_filter_ex_comment_by_user_regexp().show();
        this.checkbox_label_filter_ex_comment_by_user_perfectmatch().show();
        this.checkbox_label_filter_ex_comment_by_user_normalize().show();
        this.checkbox_label_filter_ex_comment_by_user_auto_ng_id().show();
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
        this.textarea_export_storage().hide();
        this.textarea_import_storage().hide();
        this.textarea_import_storage().val("");
    }
    hide_imexport_all() {
        this.hide_imexport_textarea_all();        
    }
    //
    hide_option_checkbox_all() {
        this.checkbox_stop_autoplay().hide();
        this.checkbox_disable_annotation().hide();
        this.checkbox_disable_border_radius().hide();
        this.checkbox_label_stop_autoplay().hide();
        this.checkbox_label_disable_annotation().hide();
        this.checkbox_label_disable_border_radius().hide();
    }
    show_option_checkbox_all() {
        this.checkbox_stop_autoplay().show();
        this.checkbox_disable_annotation().show();
        this.checkbox_disable_border_radius().show();
        this.checkbox_label_stop_autoplay().show();
        this.checkbox_label_disable_annotation().show();
        this.checkbox_label_disable_border_radius().show();
    }
    hide_option_all() {
        this.hide_option_checkbox_all();
    }
    //
    hide_main_all() {
        this.selectbox_channel_filter().hide();
        this.selectbox_comment_filter().hide();
        this.selectbox_imexport().hide();
        this.pagetop_filter_channel().hide();
        this.pagetop_filter_title().hide();
        this.pagetop_filter_comment().hide();
        this.pagetop_imexport().hide();
        this.pagetop_option().hide();
        this.hide_channel_filter_all();
        this.hide_title_filter_all();
        this.hide_comment_filter_all();
        this.hide_imexport_all();
        this.hide_option_all();
    }
    //
    show_export_storage() {
        this.textarea_export_storage().val(StoragePorter.export(this.storage.json));
        this.textarea_export_storage().show();
        this.button_save().hide();
        this.button_import().hide();
    }
    show_import_storage() {
        this.textarea_import_storage().show();
        this.button_save().hide();
        this.button_import().show();
    }

    //
    textarea_filter_channel_keyup() {
        if (this.textarea_filter_channel().val() != this.storage.ng_channel_text) {
            this.button_save_enable();
        }
        this.update_cursor_filter_channel();
        this.update_filter_ex_channel_item();
    }
    textarea_filter_channel_id_keyup() {
        if (this.textarea_filter_channel_id().val() != this.storage.ng_channel_id_text) {
            this.button_save_enable();
        }
        this.update_cursor_filter_channel_id();
        this.update_filter_ex_channel_id_item();
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
    textbox_channelname_keyup() {
        if (this.textbox_channelname().val()
            != this.ex_channel_id_buffer[this.ex_channel_id_last].commment) {
            this.button_save_enable();
        }
    }
    textarea_filter_comment_by_user_keyup() {
        if (this.textarea_filter_comment_by_user().val()
            != this.storage.ng_comment_by_user_text) {
            this.button_save_enable();
        }
        this.update_cursor_filter_comment_by_user();
        this.update_filter_ex_comment_by_user_item();
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
     *  @brief  textarea用疑似カーソル更新
     *  @param  t       textarea
     *  @param  cursor  カーソル(取得関数)
     */
    update_cursor(t, cursor) {
        if (t.length <= 0) {
            cursor().hide();
            return;
        }
        const t_elem = t[0];
        const word
            = text_utility.search_text_connected_by_new_line(
                t_elem.selectionStart,
                t.val());
        if (word == null) {
            cursor().hide();
            return;
        }                            
        const font_size = parseInt(HTMLUtil.get_font_size(t));
        const caret_row = HTMLUtil.get_caret_row(t);
        const scroll = t_elem.scrollTop;
        const t_width = t_elem.clientWidth;
        const t_height = t_elem.clientHeight;
        let margin = (caret_row)*font_size-scroll+1;
        let height = font_size+2;
        // スクロール対応
        // - 上下にはみ出た分縮める
        // - 完全に出たらhide
        if (margin < 0) {
            height += margin;
            if (height <= 0) {
                cursor().hide();
                return;
            }
            margin = 0;
        } else if (margin > (t_height-height)) {
            height = t_height-margin;
            if (height <= 0) {
                cursor().hide();
                return;
            }
        }
        //
        const width = t_width;
        const sty = "top:" + margin + "px;"
                  + "width:" + width + "px;"
                  + "height:" + height +"px";
        cursor().attr("style", sty);
    }
    update_cursor_filter_channel() {
        this.update_cursor(this.textarea_filter_channel(), 
                           this.cursor_filter_channel.bind(this));
    }
    update_cursor_filter_channel_id() {
        this.update_cursor(this.textarea_filter_channel_id(), 
                           this.cursor_filter_channel_id.bind(this));
    }
    update_cursor_filter_comment_by_user() {
        this.update_cursor(this.textarea_filter_comment_by_user(), 
                           this.cursor_filter_comment_by_user.bind(this));
    }

    update_filter_ex_channel_item() {
        let t = this.textarea_filter_channel();
        let t_ex = this.textarea_filter_ex_channel();
        const f_dispoff = ()=> {
            this.ex_channel_last = null;
            this.hide_filter_ex_channel();
        };
        if (t.length <= 0 || t_ex.length <= 0) {
            f_dispoff();
            return;
        }
        const word
            = text_utility.search_text_connected_by_new_line(
                t[0].selectionStart,
                t.val());
        if (word == null) {
            f_dispoff();
            return;
        }
        this.cleanup_ex_channel();
        this.ex_channel_last = word;
        //
        const subheading_offset_x = t[0].clientWidth + 32;
        let subheading = $("div.subheading#filter_ex_channel");
        $(subheading).text(word + 'の非表示タイトル');
        $(subheading).attr("style", "left:" + subheading_offset_x + "px");
        //
        const t_ex_offset_x = t[0].clientWidth + 32;
        const t_ex_offset_y = 32;
        const t_ex_style = "position:absolute;" 
                         + "top:" + t_ex_offset_y + "px;"
                         + "left:" + t_ex_offset_x + "px";
        $(t_ex).attr("style", t_ex_style);
        let ckbox_regexp = this.checkbox_filter_ex_channel_regexp();
        let ckbox_perfectmatch = this.checkbox_filter_ex_channel_perfectmatch();
        let ckbox_normalize = this.checkbox_filter_ex_channel_normalize();
        if (word in this.ex_channel_buffer) {
            const obj = this.ex_channel_buffer[word];
            $(t_ex).val(obj.black_titles);
            ckbox_regexp.prop("checked", obj.b_regexp);
            ckbox_perfectmatch.prop("checked", obj.b_perfect_match);
            ckbox_normalize.prop("checked", obj.b_normalize);
        } else {
            $(t_ex).val('');
            ckbox_regexp.prop("checked", false);
            ckbox_perfectmatch.prop("checked", false);
            ckbox_normalize.prop("checked", false);
            this.ex_channel_buffer[word]
                = new ChannelFilterParam(false, false, false, '');
        }
        const ckbox_offset_y = t_ex_offset_y + t_ex[0].clientHeight + 16;
        const ckbox_offset_x = t[0].clientWidth + 32;
        const ckbox_style = "top:" + ckbox_offset_y + "px;"
                          + "left:" + ckbox_offset_x + "px";
        $("div.checkbox#filter_ex_channel").attr("style", ckbox_style);
        this.show_channel_filter_checkbox_all();
    }
    update_filter_ex_channel_id_item() {
        let t = this.textarea_filter_channel_id();
        let t_ex = this.textarea_filter_ex_channel_id();
        const f_dispoff = ()=> {
            this.ex_channel_id_last = null;
            this.hide_filter_ex_channel_id();
        };
        if (t.length <= 0 || t_ex.length <= 0) {
            f_dispoff();
            return;
        }
        const channel_id
            = text_utility.search_text_connected_by_new_line(
                t[0].selectionStart,
                t.val());
        if (channel_id == null) {
            f_dispoff();
            return;
        }
        this.cleanup_ex_channel_id();
        this.ex_channel_id_last = channel_id;
        //
        const subheading_offset_x = t[0].clientWidth + 32;
        let subheading = $("div.subheading#filter_ex_channel_id");
        $(subheading).text(channel_id + 'の非表示タイトル');
        $(subheading).attr("style", "left:" + subheading_offset_x + "px");
        //
        const t_ex_offset_x = t[0].clientWidth + 32;
        const t_ex_offset_y = 32;
        const t_ex_style = "position:absolute;" 
                         + "top:" + t_ex_offset_y + "px;"
                         + "left:" + t_ex_offset_x + "px";
        $(t_ex).attr("style", t_ex_style);
        {
            if (channel_id in this.ex_channel_id_buffer) {
                const obj = this.ex_channel_id_buffer[channel_id];
                this.textarea_filter_ex_channel_id().val(obj.black_titles);
                this.textbox_channelname().val(obj.comment);
            } else {
                this.textarea_filter_ex_channel_id().val('');
                this.textbox_channelname().val('');
                this.ex_channel_id_buffer[channel_id]
                    = new ChannelIDFilterParam('', '');
            }
        }
        const chname_offset_y = t_ex_offset_y + t_ex[0].clientHeight + 16;
        const chname_offset_x = t[0].clientWidth + 32;
        const chname_style = "top:" + chname_offset_y + "px;"
                           + "left:" + chname_offset_x + "px";
        $("div.channelname#filter_ex_channel_id").attr("style", chname_style);        
        this.textbox_channelname().show();
        this.textbox_label_channelname().show();
    }
    update_filter_ex_comment_by_user_item() {
        let t = this.textarea_filter_comment_by_user();
        const f_dispoff = ()=> {
            this.ex_comment_user_last = null;
            this.hide_filter_ex_comment_by_user();
        };
        if (t.length <= 0) {
            f_dispoff();
            return;
        }
        const word
            = text_utility.search_text_connected_by_new_line(
                t[0].selectionStart,
                t.val());
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
            ckbox_regexp.prop("checked", obj.b_regexp);
            ckbox_perfectmatch.prop("checked", obj.b_perfect_match);
            ckbox_normalize.prop("checked", obj.b_normalize);
            ckbox_auto_ng_id.prop("checked", obj.b_auto_ng_id);
        } else {
            ckbox_regexp.prop("checked", false);
            ckbox_perfectmatch.prop("checked", false);
            ckbox_normalize.prop("checked", false);
            ckbox_auto_ng_id.prop("checked", false);
            this.ex_comment_user_buffer[word]
                = new CommentFilterByUserParam(false, false, false, false);
        }
        const ckbox_offset_y = 16;
        const ckbox_offset_x = t[0].clientWidth + 32;
        const ckbox_style = "top:" + ckbox_offset_y + "px;"
                          + "left:" + ckbox_offset_x + "px";
        $("div.checkbox#filter_ex_comment_by_user").attr("style", ckbox_style);
        this.show_comment_filter_by_user_checkbox_all();
    }
    //
    update_option_checkbox() {
        var json = this.storage.json;
        this.checkbox_stop_autoplay().prop("checked",
            json.stop_autoplay == null ?false
                                       :json.stop_autoplay);
        this.checkbox_disable_annotation().prop("checked",
            json.disable_annotation == null ?false
                                            :json.disable_annotation);
        this.checkbox_disable_border_radius().prop("checked",
            json.disable_border_radius == null ?false
                                               :json.disable_border_radius);
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
        if (this.ex_channel_last != '') {
            this.ex_channel_buffer_to_reflect_current(this.ex_channel_last);
        }
    }
    /*!
     *  @brief  前回「非表示チャンネル(ID)詳細設定」の後始末
     */
    cleanup_ex_channel_id() {
        if (this.ex_channel_id_last != '') {
            this.ex_channel_id_buffer_to_reflect_current(this.ex_channel_id_last);
        }
    }
    /*!
     *  @brief  前回「非表示コメント(ユーザ)詳細設定」の後始末
     */
    cleanup_ex_comment_by_user() {
        if (this.ex_comment_user_last != '') {
            this.ex_comment_user_buffer_to_reflect_current(this.ex_comment_user_last);
        }
    }

    selectbox_channel_filter_key() {
        return "select[name=select_channel_filter]";
    }
    selectbox_channel_filter() {
        return $(this.selectbox_channel_filter_key());
    }
    selectbox_comment_filter_key() {
        return "select[name=select_comment_filter]";
    }
    selectbox_comment_filter() {
        return $(this.selectbox_comment_filter_key());
    }
    selectbox_imexport_key() {
        return "select[name=select_imexport]";
    }
    selectbox_imexport() {
        return $(this.selectbox_imexport_key());
    }

    is_selected_ng_channel() {
        return this.selectbox_channel_filter().val() == "ng_channel_word";
    }
    is_selected_ng_channel_id() {
        return this.selectbox_channel_filter().val() == "ng_channel_id";
    }
    is_selected_ng_comment_by_user() {
        return this.selectbox_comment_filter().val() == "ng_comment_user";
    }
    is_selected_ng_comment_by_id() {
        return this.selectbox_comment_filter().val() == "ng_comment_id";
    }
    is_selected_ng_comment_by_word() {
        return this.selectbox_comment_filter().val() == "ng_comment_word";
    }
    is_selected_export_storage() {
        return this.selectbox_imexport().val() == "export";
    }
    is_selected_import_storage() {
        return this.selectbox_imexport().val() == "import";
    }

    static kick_textarea(t) {
        t().show();
        t().focus();
        t().click();
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
            this.textarea_filter_comment_by_id().show();
        } else
        if (this.is_selected_ng_comment_by_word()) {
            Dashboard.kick_textarea(this.textarea_filter_comment_by_word.bind(this));
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
        this.storage.json.stop_autoplay
            = this.checkbox_stop_autoplay().prop("checked");
        this.storage.json.disable_annotation
            = this.checkbox_disable_annotation().prop("checked");
        this.storage.json.disable_border_radius
            = this.checkbox_disable_border_radius().prop("checked");
        this.storage.save();
        MessageUtil.send_message_to_relative_tab(
            {command:MessageUtil.command_update_storage()});
        //
        this.button_save_disable();
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

    static button_is_selected(btn) {
        return btn.className.indexOf('selected') > 0;
    }

    tab_selected(clicked_btn) {
        if (Dashboard.button_is_selected(clicked_btn)) {
            return;
        }
        this.tab_buttons().each((inx, btn)=>{
            if (btn == clicked_btn) {
                $(btn).attr('class', 'tabButton selected');
            } else 
            if (Dashboard.button_is_selected(btn)) {
                $(btn).attr('class', 'tabButton');
            }
        });
        this.hide_main_all();
        this.button_import().hide();
        this.button_save().hide();
        switch($(clicked_btn).attr('name')) {
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
        this.pagetop_filter_channel().show();
        this.selectbox_channel_filter().show();
        this.selectbox_channel_filter_change();
        this.button_save().show();
    }
    display_elem_title_filter() {
        this.pagetop_filter_title().show();
        this.textarea_filter_title().show();
        this.button_save().show();
    }
    display_elem_comment_filter() {
        this.pagetop_filter_comment().show();
        this.selectbox_comment_filter().show();
        this.selectbox_comment_filter_change();
        this.button_save().show();
    }
    display_elem_imexport() {
        this.pagetop_imexport().show();
        this.selectbox_imexport().show();
        this.selectbox_imexport_change();
    }
    display_elem_option() {
        this.pagetop_option().show();
        this.update_option_checkbox();
        this.button_save().show();
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

    static reset_textarea_caret(t) {
        if (t.length <= 0) {
            return;
        }
        t[0].setSelectionRange(0,0);
    }

    presetTextarea() {
        Dashboard.reset_textarea_caret(this.textarea_filter_channel());
        this.textarea_filter_channel().focus();
        this.textarea_filter_channel_click();
        Dashboard.reset_textarea_caret(this.textarea_filter_channel_id());
        Dashboard.reset_textarea_caret(this.textarea_filter_comment_by_user());
        Dashboard.reset_textarea_caret(this.textarea_filter_comment_by_id());
        Dashboard.reset_textarea_caret(this.textarea_filter_comment_by_word());
    }

    /*!
     *  @brief  現状を「非表示チャンネル詳細加設定」バッファへ反映する
     */
    ex_channel_buffer_to_reflect_current(channel) {
        this.ex_channel_buffer[channel] = new ChannelFilterParam(
            this.checkbox_filter_ex_channel_regexp().prop("checked"),
            this.checkbox_filter_ex_channel_perfectmatch().prop("checked"),
            this.checkbox_filter_ex_channel_normalize().prop("checked"),
            this.textarea_filter_ex_channel().val());
    }
    /*!
     *  @brief  現状を「非表示チャンネル(ID)詳細加設定」バッファへ反映する
     */
    ex_channel_id_buffer_to_reflect_current(channel) {
        this.ex_channel_id_buffer[channel]
            = new ChannelIDFilterParam(this.textbox_channelname().val(),
                                       this.textarea_filter_ex_channel_id().val());
    }
    /*!
     *  @brief  現状を「非表示コメント(ユーザ)詳細加設定」バッファへ反映する
     */
    ex_comment_user_buffer_to_reflect_current(user) {
        this.ex_comment_user_buffer[user] = new CommentFilterByUserParam(
            this.checkbox_filter_ex_comment_by_user_regexp().prop("checked"),
            this.checkbox_filter_ex_comment_by_user_perfectmatch().prop("checked"),
            this.checkbox_filter_ex_comment_by_user_normalize().prop("checked"),
            this.checkbox_filter_ex_comment_by_user_auto_ng_id().prop("checked"));
    }
};

var popup = new Dashboard();
