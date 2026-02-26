/*!
 *  @brief  設定関連ベースクラス
 */
class SettingBase {

    constructor() {
        this.initialize();
    }
    initialize() {
        this.storage = new StorageData();
        this.ex_channel_buffer = [];        // 非表示チャンネル詳細設定バッファ(各種フラグ/個別非表示タイトル)
        this.ex_channel_last = '';          // 最後に「非表示チャンネル詳細設定」画面を開いたチャンネル名
        this.ex_channel_id_buffer = [];     // 非表示チャンネル詳細設定バッファ(各種フラグ/個別非表示タイトル)
        this.ex_channel_id_last = '';       // 最後に「非表示チャンネル詳細設定」画面を開いたチャンネル名
        this.ex_comment_user_buffer = [];   // 非表示コメント(ユーザ)詳細設定バッファ(各種フラグ)
        this.ex_comment_user_last = '';     // 最後に「非表示コメント(ユーザ)詳細設定」画面を開いたユーザ名
        //
        this.prev_textarea_name = null;     // 最後に疑似(div)カーソルを表示したtextareaの名前
        this.prev_textarea_caret_row = -1;  // 最後に取得した擬似(div)カーソルの位置(row)
    }

    get_flag_enable_filter() { return true; }
    get_flag_stop_autoplay() { return false; }
    get_flag_disable_annotation() { return false; }
    get_flag_remove_sleeptimer() { return false; }
    get_flag_disable_border_radius() { return false; }
    get_flag_mute_shorts() { return false; }
    get_flag_remove_suggestion() { return false; }
    get_flag_hidden_start() { return false;}

    textarea_filter_channel() {
        return document.body.querySelector("textarea[name=filter_channel]");
    }
    textarea_filter_channel_id() {
        return document.body.querySelector("textarea[name=filter_channel_id]");
    }
    textarea_filter_title() {
        return document.body.querySelector("textarea[name=filter_title]");
    }
    textarea_filter_ex_channel() {
        return document.body.querySelector("textarea[name=filter_ex_channel]");
    }
    textarea_filter_ex_channel_id() {
        return document.body.querySelector("textarea[name=filter_ex_channel_id]");
    }
    textarea_filter_comment_by_user() {
        return document.body.querySelector("textarea[name=filter_comment_by_user]");
    }
    textarea_filter_comment_by_id() {
        return document.body.querySelector("textarea[name=filter_comment_by_id]");
    }
    textarea_filter_comment_by_word() {
        return document.body.querySelector("textarea[name=filter_comment_by_word]");
    }
    textarea_filter_comment_by_handle() {
        return document.body.querySelector("textarea[name=filter_comment_by_handle]");
    }

    button_save() {
        return document.body.querySelector("button[name=req_save]");
    }
    button_save_enable() {
        this.button_save().disabled = false;
    }
    button_save_disable() {
        this.button_save().disabled = true;
    }
    button_import() {
        return document.body.querySelector("button[name=req_import]");
    }
    button_import_enable() {
        this.button_import().disabled = false;
    }
    button_import_disable() {
        this.button_import().disabled = true;
    }

    static reset_textarea_caret(t) {
        if (t.length == null) {
            return;
        }
        t.setSelectionRange(0,0);
    }

    /*!
     *  @brief  textarea用疑似カーソル更新
     *  @param  t       textarea
     *  @param  cursor  カーソル(取得関数)
     */
    static update_cursor(t, cursor) {
        const cur = cursor();
        if (t == null) {
            HTMLUtil.hide_element(cur);
            return;
        }
        const word
            = text_utility.search_text_connected_by_new_line(
                t.selectionStart,
                t.value);
        if (word == null) {
            HTMLUtil.hide_element(cur);
            return;
        }
        // textareaと同じstyleのdivを用意し、実際にtextを流し込み
        // ブラウザにrenderingさせることで正確なY座標を得る
        // ※line-height*rowではズレる(丸め誤差)
        let mirror_div = document.body.querySelector("div#tbox_mirror");
        if (mirror_div == null) {
            HTMLUtil.hide_element(cur);
            return;
        } else
        if (this.prev_textarea_name !== t.name) {
            this.prev_textarea_name = t.name
            const style = window.getComputedStyle(t);
            mirror_div.style.fontFamily = style.fontFamily;
            mirror_div.style.fontSize = style.fontSize;
            mirror_div.style.fontWeight = style.fontWeight;
            mirror_div.style.fontStyle = style.fontStyle;
            mirror_div.style.lineHeight = style.lineHeight;
            mirror_div.style.padding = style.padding;
            mirror_div.style.border = style.border;
            mirror_div.style.boxSizing = style.boxSizing;
            mirror_div.style.whiteSpace = style.whiteSpace;
            mirror_div.style.wordBreak = style.wordBreak;
            mirror_div.style.width = style.width;
            mirror_div.style.position = 'absolute';
            mirror_div.style.visibility = 'hidden';
            mirror_div.style.overflow = 'hidden';
            mirror_div.style.height = 'auto';
            mirror_div.style.pointerEvent = 'none';
            // 画面外に飛ばしておかないとWindow画面サイズに影響してしまう
            mirror_div.style.left = '-9999px';
        }
        let margin = -t.scrollTop;
        {
            const r = HTMLUtil.get_text_before_caret_and_row(t);
            if (r.row != this.prev_textarea_caret_row) {
                this.prev_textarea_caret_row = r.row;
                mirror_div.textContent = r.text;
                const span = document.createElement('span');
                span.textContent = '|';
                mirror_div.append(span);
                margin += span.offsetTop;
            } else {
                margin += mirror_div.querySelector("span").offsetTop;
            }
        }
        //
        const font_size = parseInt(HTMLUtil.get_font_size(t));
        const t_width = t.clientWidth;
        const t_height = t.clientHeight;
        let height = font_size+2;
        // スクロール対応
        // - 上下にはみ出た分縮める
        // - 完全に出たらhide
        if (margin < 0) {
            height += margin;
            if (height <= 0) {
                HTMLUtil.hide_element(cur);
                return;
            }
            margin = 0;
        } else if (margin > (t_height-height)) {
            height = t_height-margin;
            if (height <= 0) {
                HTMLUtil.hide_element(cur);
                return;
            }
        }
        //
        const width = t_width;
        const sty = `top:${margin}px;width:${width}px;height:${height}px`;
        cur.setAttribute("style", sty);
    }
        
    updateTextarea() {
        this.textarea_filter_channel().value = this.storage.ng_channel_text;
        this.textarea_filter_channel().selectionStart = 0;
        this.textarea_filter_channel().selectionEnd = 0;
        this.textarea_filter_channel_id().value = this.storage.ng_channel_id_text;
        this.textarea_filter_channel_id().selectionStart = 0;
        this.textarea_filter_channel_id().selectionEnd = 0;
        this.textarea_filter_title().value = this.storage.ng_title_text;
        this.textarea_filter_comment_by_user().value
            = this.storage.ng_comment_by_user_text;
        this.textarea_filter_comment_by_user().selectionStart = 0;
        this.textarea_filter_comment_by_user().selectionEnd = 0;
        this.textarea_filter_comment_by_id().value = this.storage.ng_comment_by_id_text;
        this.textarea_filter_comment_by_word().value
            = this.storage.ng_comment_by_word_text;
        this.textarea_filter_comment_by_handle().value
            = this.storage.ng_comment_by_handle_text;
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

    save() {
        this.storage.clear();
        {
            var filter
                = text_utility.split_by_new_line(this.textarea_filter_channel().value);
            for (const word of filter) {
                if (word !== '') {
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
                  .split_by_new_line(this.textarea_filter_channel_id().value);
            for (const channel_id of filter) {
                if (channel_id !== '') {
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
                = text_utility.split_by_new_line(this.textarea_filter_title().value);
            for (const word of filter) {
                if (word !== '') {
                    this.storage.json.ng_title.push(word);
                }
            }
        }
        {
            var filter
                = text_utility.split_by_new_line(
                    this.textarea_filter_comment_by_user().value);
            for (const word of filter) {
                if (word !== '') {
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
                    this.textarea_filter_comment_by_id().value);
            for (const word of filter) {
                if (word !== '') {
                    this.storage.json.ng_comment_by_id.push(word);
                }
            }
        }
        {
            var filter
                = text_utility.split_by_new_line(
                    this.textarea_filter_comment_by_word().value);
            for (const word of filter) {
                if (word !== '') {
                    this.storage.json.ng_comment_by_word.push(word);
                }
            }
        }
        {
            var filter
                = text_utility.split_by_new_line(
                    this.textarea_filter_comment_by_handle().value);
            for (const handle of filter) {
                if (handle !== '') {
                    this.storage.json.ng_comment_by_handle.push(handle);
                }
            }
        }
        //
        this.storage.json.active = this.get_flag_enable_filter();
        this.storage.json.stop_autoplay = this.get_flag_stop_autoplay();
        this.storage.json.disable_annotation = this.get_flag_disable_annotation();
        this.storage.json.remove_sleeptimer = this.get_flag_remove_sleeptimer();
        this.storage.json.disable_border_radius = this.get_flag_disable_border_radius();
        this.storage.json.mute_shorts = this.get_flag_mute_shorts();
        this.storage.json.remove_suggestion = this.get_flag_remove_suggestion();
        this.storage.json.hidden_start = this.get_flag_hidden_start();
        this.storage.save();
        MessageUtil.send_message_to_relative_tab(
            {command:MessageUtil.command_update_storage()});
        this.storage.update_text();
        this.button_save_disable();
    }
};
