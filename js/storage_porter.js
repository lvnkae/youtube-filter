/*!
 *  @brief  保存データimport/export
 */
class StoragePorter {

    static CSV_TAG_COMMENT = "NG_COMMENT=";
    static CSV_TAG_TITLE = "NG_TITLE=";
    //
    static CSV_TAG_CHANNEL = "NG_CHANNEL=";
    static CSV_TAG_CHANNEL_NG_WORD = "NG_CHANNEL_NG_WORD=";
    static CSV_TAG_CHANNEL_FLAG = "NG_CHANNEL_FLAG=";
    static CSV_TAG_CHANNEL_ID = "NG_CHANNEL_ID=";
    //
    static CSV_TAG_COMMENT_UNAME = "NG_COMMENT_USER_NAME=";
    static CSV_TAG_COMMENT_FLAG = "NG_COMMENT_FLAG=";
    static CSV_TAG_COMMENT_UID = "NG_COMMENT_USER_ID=";
    static CSV_TAG_COMMENT_WORD = "NG_COMMENT_WORD=";

    static MAX_LEN_COMMENT = 32;

    constructor(json) {
        // deep-copy
        this.json = JSON.parse(JSON.stringify(json));        
    }

    /*!
     *  @brief  真偽値を文字列に変換
     */
    static bool_to_string(flag) {
        return (flag) ?"true" :"false";
    }
    /*!
     *  @brief  文字列を真偽値に変換
     *  @retval result  処理の成否
     *  @retval flag    変換した真偽値
     */
    static string_to_bool(str) {
        let ret = { result:false };
        if (str == "true") {
            ret.result = true;
            ret.flag = true;
        } else
        if (str == "false") {
            ret.result = true;
            ret.flag = false;
        }
        return ret;
    }


    /*!
     *  @brief  export用に文字列をencodeする
     *  @note   一部記号をエスケープするだけ
     */
    static encord_for_export(txt) {
        var enc = "";
        [...txt].forEach(c => {
            if (c == "\\") {
                enc += "\\";
            } else if (c== '"') {
                // excelのエスケープにあわせておく
                enc += '"';
            }
            enc += c;
        });
        return enc;
    }
    /*!
     *  @brief  チャンネルフィルタ(ワード)1設定分をcsv形式で出力
     */
    static export_ng_channel_unit(ngc) {
        if (ngc.keyword == "") {
            return "";
        }
        let retcsv = "";
        retcsv += this.CSV_TAG_CHANNEL + ","
               + '"' + this.encord_for_export(ngc.keyword) + '"';
        retcsv += "," + this.CSV_TAG_CHANNEL_FLAG
               + ',"' + this.bool_to_string(ngc.b_regexp) + '"'
               + ',"' + this.bool_to_string(ngc.b_perfect_match) + '"'
               + ',"' + this.bool_to_string(ngc.b_normalize) + '"';
        retcsv += "," + this.CSV_TAG_CHANNEL_NG_WORD;
        for (const ngt of ngc.black_titles) {
            if (ngt != "") {
                retcsv += "," + '"' + this.encord_for_export(ngt) + '"';
            }
        }
        return retcsv;
    }
    /*!
     *  @brief  チャンネルフィルタ(ID)1設定分をcsv形式で出力
     */
    static export_ng_channel_id_unit(ngci) {
        var retcsv = "";
        if (ngci.channel_id == "") {
            return "";
        }
        retcsv += this.CSV_TAG_CHANNEL_ID + ","
               + '"' + this.encord_for_export(ngci.channel_id) + '"';
        retcsv += "," + this.CSV_TAG_COMMENT + ","
               + '"' + this.encord_for_export(ngci.comment) + '"';
        retcsv += "," + this.CSV_TAG_CHANNEL_NG_WORD;
        for (const ngt of ngci.black_titles) {
            if (ngt != "") {
                retcsv += "," + '"' + this.encord_for_export(ngt) + '"';
            }
        }
        return retcsv;
    }
    /*!
     *  @brief  タイトルフィルタ1設定分をcsv形式で出力
     */
    static export_ng_title_unit(title) {
        if (title == "") {
            return "";
        } else {
            return this.CSV_TAG_TITLE + "," + '"' + this.encord_for_export(title) + '"';
        }
    }
    /*!
     *  @brief  コメントフィルタ(ユーザ名)1設定分をcsv形式で出力
     */
    static export_ng_comment_user_unit(ngcu) {
        if (ngcu.keyword == "") {
            return "";
        }
        let retcsv = "";
        retcsv += this.CSV_TAG_COMMENT_UNAME + ","
               + '"' + this.encord_for_export(ngcu.keyword) + '"';
        retcsv += "," + this.CSV_TAG_COMMENT_FLAG
               + ',"' + this.bool_to_string(ngcu.b_regexp) + '"'
               + ',"' + this.bool_to_string(ngcu.b_perfect_match) + '"'
               + ',"' + this.bool_to_string(ngcu.b_normalize) + '"'
               + ',"' + this.bool_to_string(ngcu.b_auto_ng_id) + '"';
        return retcsv;
    }
    /*!
     *  @brief  コメントフィルタ(ID)1設定分をcsv形式で出力
     */
    static export_ng_comment_id_unit(uid) {
        if (uid == "") {
            return "";
        } else {
            return this.CSV_TAG_COMMENT_UID
                   + "," + '"' + this.encord_for_export(uid) + '"';
        }
    }
    /*!
     *  @brief  コメントフィルタ(ワード)1設定分をcsv形式で出力
     */
    static export_ng_comment_word_unit(word) {
        if (word == "") {
            return "";
        } else {
            return this.CSV_TAG_COMMENT_WORD
                   + "," + '"' + this.encord_for_export(word) + '"';
        }
    }    
    /*!
     *  @brief  Storage(json)をcsv形式で出力する
     */
    static export(json) {
        let retcsv = "";
        const NLC = text_utility.new_line_code_lf();
        for (const ngc of json.ng_channel) {
            retcsv += this.export_ng_channel_unit(ngc) + NLC;
        }
        for (const ngci of json.ng_channel_id) {
            retcsv += this.export_ng_channel_id_unit(ngci) + NLC;
        }
        for (const title of json.ng_title) {
            retcsv += this.export_ng_title_unit(title) + NLC;
        }
        for (const ngcu of json.ng_comment_by_user) {
            retcsv += this.export_ng_comment_user_unit(ngcu) + NLC;
        }
        for (const uid of json.ng_comment_by_id) {
            retcsv += this.export_ng_comment_id_unit(uid) + NLC;
        }
        for (const word of json.ng_comment_by_word) {
            retcsv += this.export_ng_comment_word_unit(word) + NLC;
        }
        return retcsv;
    }

    /*!
     *  @brief  1行分のimportデータ(csv)を要素ごとに分割
     */
    static split_import_csv_row(row) {
        var split_row = [];
        var in_db_quote = false;
        var db_quote_push = false;
        var in_escape = false;
        var buffer = "";
        [...row].forEach(c=>{
            if (db_quote_push) {
                // prevがdb_quoteだった場合の例外処理
                db_quote_push = false;
                if (c == '"') {
                    // エスケープされてるので1つだけ採用
                    buffer += c;
                    return; // 打ち切り
                } else {
                    // db_quote括り閉じ
                    if (in_db_quote) {
                        in_db_quote = false;
                    }
                }
            }
            if (c == "\\") {
                if (in_escape) {
                    buffer += c;
                    in_escape = false;
                } else {
                    // エスケープ
                    in_escape = true;
                }
            } else if (c == '"') {
                if (in_db_quote) {
                    // 棚上げ
                    db_quote_push = true;
                } else {
                    // db_quote括り開始
                    in_db_quote = true;
                }
            } else if (c == ",") {
                if (in_db_quote) {
                    buffer += c;
                } else {
                    split_row.push(buffer);
                    buffer = "";
                }
            } else {
                buffer += c;
            }
        });
        if (buffer != "") {
            split_row.push(buffer);
        }
        return split_row;
    }
    /*!
     *  @brief  チャンネルフィルタ(ワード)1つ分をsplit_rowから得る
     *  @param  split_row   importデータ1行分を要素ごとに分割したもの
     */
    static get_channel_filter_object(split_row) {
        const SPR_INDEX_CHANNEL = 1;
        const SPR_INDEX_FLAG_TAG = 2;
        const SPR_INDEX_FLAG_REGEXP = 3;
        const SPR_INDEX_FLAG_PERFECTMATCH = 4;
        const SPR_INDEX_FLAG_NORMALIZE = 5;
        const SPR_INDEX_NG_WORD_TAG = 6
        const SPR_INDEX_NG_WORD_TOP = 7;
        let ch_filter = {};
        ch_filter.keyword = split_row[SPR_INDEX_CHANNEL];
        if (split_row[SPR_INDEX_FLAG_TAG] == this.CSV_TAG_CHANNEL_FLAG) {
            let ret = {};
            ret = this.string_to_bool(split_row[SPR_INDEX_FLAG_REGEXP]);
            if (!ret.result) {
                return null;
            }
            ch_filter.b_regexp = ret.flag;
            ret = this.string_to_bool(split_row[SPR_INDEX_FLAG_PERFECTMATCH]);
            if (!ret.result) {
                return null;
            }
            ch_filter.b_perfect_match = ret.flag;
            ret = this.string_to_bool(split_row[SPR_INDEX_FLAG_NORMALIZE]);
            if (!ret.result) {
                return null;
            }
            ch_filter.b_normalize = ret.flag;
        } else {
            return null;
        }
        if (split_row[SPR_INDEX_NG_WORD_TAG] == this.CSV_TAG_CHANNEL_NG_WORD) {
            ch_filter.black_titles = [];
            for (var inx = SPR_INDEX_NG_WORD_TOP; inx < split_row.length; inx++) {
                if (split_row[inx] != "") {
                    ch_filter.black_titles.push(split_row[inx]);
                }
            }
        } else {
            return null;
        }
        return ch_filter;
    }
    /*!
     *  @brief  チャンネルフィルタ(ID)1つ分をsplit_rowから得る
     *  @param  split_row   importデータ1行分を要素ごとに分割したもの
     */
    static get_channel_id_filter_object(split_row) {
        const SPR_INDEX_CHANNEL_ID = 1;
        const SPR_INDEX_COMMENT_TAG = 2;
        const SPR_INDEX_COMMENT = 3;
        const SPR_INDEX_NG_WORD_TAG = 4;
        const SPR_INDEX_NG_WORD_TOP = 5;
        let ch_id_filter = {};
        ch_id_filter.channel_id = split_row[SPR_INDEX_CHANNEL_ID];
        if (split_row[SPR_INDEX_COMMENT_TAG] == this.CSV_TAG_COMMENT) {
            if (split_row[SPR_INDEX_COMMENT].length > this.MAX_LEN_COMMENT) {
                return null;
            }
            ch_id_filter.comment = split_row[SPR_INDEX_COMMENT];
        } else {
            return null;
        }
        if (split_row[SPR_INDEX_NG_WORD_TAG] == this.CSV_TAG_CHANNEL_NG_WORD) {
            ch_id_filter.black_titles = [];
            for (var inx = SPR_INDEX_NG_WORD_TOP; inx < split_row.length; inx++) {
                if (split_row[inx] != "") {
                    ch_id_filter.black_titles.push(split_row[inx]);
                }
            }
        } else {
            return null;
        }
        return ch_id_filter;
    }
    /*!
     *  @brief  コメントフィルタ(ユーザ)1つ分をsplit_rowから得る
     *  @param  split_row   importデータ1行分を要素ごとに分割したもの
     */
    static get_comment_user_filter_object(split_row) {
        const SPR_INDEX_COMMENT_USER = 1;
        const SPR_INDEX_FLAG_TAG = 2;
        const SPR_INDEX_FLAG_REGEXP = 3;
        const SPR_INDEX_FLAG_PERFECTMATCH = 4;
        const SPR_INDEX_FLAG_NORMALIZE = 5;
        const SPR_INDEX_FLAG_AUTO_NG_ID = 6;
        let comment_user_filter = {};
        comment_user_filter.keyword = split_row[SPR_INDEX_COMMENT_USER];
        if (split_row[SPR_INDEX_FLAG_TAG] == this.CSV_TAG_COMMENT_FLAG) {
            let ret = {};
            ret = this.string_to_bool(split_row[SPR_INDEX_FLAG_REGEXP]);
            if (!ret.result) {
                return null;
            }
            comment_user_filter.b_regexp = ret.flag;
            ret = this.string_to_bool(split_row[SPR_INDEX_FLAG_PERFECTMATCH]);
            if (!ret.result) {
                return null;
            }
            comment_user_filter.b_perfect_match = ret.flag;
            ret = this.string_to_bool(split_row[SPR_INDEX_FLAG_NORMALIZE]);
            if (!ret.result) {
                return null;
            }
            comment_user_filter.b_normalize = ret.flag;
            ret = this.string_to_bool(split_row[SPR_INDEX_FLAG_AUTO_NG_ID]);
            if (!ret.result) {
                return null;
            }
            comment_user_filter.b_auto_ng_id = ret.flag;
        } else {
            return null;
        }
        return comment_user_filter;
    }

    /*!
     *  @brief  1行分のimportデータをstorageへ書き込む
     */
    import_row(split_row) {
        if (split_row.length <= 0) {
            return true;
        }
        const SPR_INDEX_TYPE_TAG = 0;
        if (split_row[SPR_INDEX_TYPE_TAG] == StoragePorter.CSV_TAG_CHANNEL) {
            const ch_filter = StoragePorter.get_channel_filter_object(split_row);
            if (ch_filter == null) {
                return false;
            }
            for (var obj of this.json.ng_channel) {
                if (obj.keyword == ch_filter.keyword) {
                    obj.comment = ch_filter.comment;
                    obj.black_titles = ch_filter.black_titles;
                    return true;
                }
            }
            this.json.ng_channel.push(ch_filter);
        } else if (split_row[SPR_INDEX_TYPE_TAG] == StoragePorter.CSV_TAG_CHANNEL_ID) {
            const ch_id_filter = StoragePorter.get_channel_id_filter_object(split_row);
            if (ch_id_filter == null) {
                return false;
            }
            for (var obj of this.json.ng_channel_id) {
                if (obj.channel_id == ch_id_filter.channel_id) {
                    obj.comment = ch_id_filter.comment;
                    obj.black_titles = ch_id_filter.black_titles;
                    return true;
                }
            }
            this.json.ng_channel_id.push(ch_id_filter);
        } else if (split_row[SPR_INDEX_TYPE_TAG] == StoragePorter.CSV_TAG_COMMENT_UNAME) {
            const comment_user_filter
                = StoragePorter.get_comment_user_filter_object(split_row);
            if (comment_user_filter == null) {
                return false;
            }
            for (var obj of this.json.ng_comment_by_user) {
                if (obj.keyword == comment_user_filter.keyword) {
                    obj = comment_user_filter;
                    return true;
                }
            }
            this.json.ng_comment_by_user.push(comment_user_filter);
        } else if (split_row[SPR_INDEX_TYPE_TAG] == StoragePorter.CSV_TAG_TITLE) {
            const SPR_INDEX_WORD = 1;
            for (const word of this.json.ng_title) {
                if (word == split_row[SPR_INDEX_WORD]) {
                    return true;
                }
            }
            this.json.ng_title.push(split_row[SPR_INDEX_WORD]);
         } else if (split_row[SPR_INDEX_TYPE_TAG] == StoragePorter.CSV_TAG_COMMENT_UID) {
            const SPR_INDEX_ID = 1;
            for (const uid of this.json.ng_comment_by_id) {
                if (uid == split_row[SPR_INDEX_ID]) {
                    return true;
                }
            }
            this.json.ng_comment_by_id.push(split_row[SPR_INDEX_ID]);
         } else
         if (split_row[SPR_INDEX_TYPE_TAG] == StoragePorter.CSV_TAG_COMMENT_WORD) {
            const SPR_INDEX_WORD = 1;
            for (const word of this.json.ng_comment_by_word) {
                if (word == split_row[SPR_INDEX_WORD]) {
                    return true;
                }
            }
            this.json.ng_comment_by_word.push(split_row[SPR_INDEX_WORD]);
        } else {
            return false;
        }
        return true;
    }
    import(csv) {
        var csv_array = text_utility.split_by_new_line(csv);
        for (const csv_row of csv_array) {
            if (!this.import_row(StoragePorter.split_import_csv_row(csv_row))) {
                return false;
            }
        }
        return true;
    }
}
