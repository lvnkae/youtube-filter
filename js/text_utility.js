/*!
 *  @brief  テキストユーティリティクラス
 */
class TextUtil {

    new_line_code() {
        return "\r\n";
    }
    new_line_code_lf() {
        return "\n";
    }

    split_by_new_line(string) {
        var result = string.split(/\r\n|\r|\n/);
        var ret = [];
        for (const word of result) {
            if (word.length > 0 &&
                word != "\r\n" &&
                word != "\r" &&
                word != "\n") {
                ret.push(word);
            }
        }
        return ret;
    }

    /*!
     *  @brief  空行削除
     *  @note   空(0文字、または空白のみ)の行を削除し、残りを連結して返す
     */
    remove_blank_line(string) {
        const div_nl = this.split_by_new_line(string);
        var ret_string = '';
        for (const dv of div_nl) {
            if (this.remove_line_head_space(dv) != '') {
                ret_string += dv;
            }
        }
        return ret_string;
    }
    /*!
     *  @brief  行頭スペースを削除
     */
    remove_line_head_space(string) {
        return string.replace(/^\s+/g, "");
    }
    /*!
     *  @brief  改行とスペースを削除
     */
    remove_new_line_and_space(string) {
        return string.replace(/[\s|\r\n|\r|\n]+/g, "");
    }

    /*!
     *  @brief  改行で連結された文字列から座標でワード検索する
     *  @param  pos     文字位置
     *  @param  text    改行で連結された文字列
     */
    search_text_connected_by_new_line(pos, text) {
        if (text.length > 0) {
            var t_len = 0;
            var split_text = text_utility.split_by_new_line(text);
            for (const word of split_text) {
                t_len += word.length + 1; // 1はsplit前改行
                if (pos < t_len) {
                    return word;
                }
            }
        }
        return null;
    }


    /*!
     *  @brief  srcがdstに含まれているか調べる(部分一致)
     *  @param  srcの頭2文字が<>だったら正規表現として扱う
     */
    regexp_indexOf(src, dst) {
        if (src.length > 2) {
            if (src.substr(0, 2) == "<>") {            
                return this.regexp(src.slice(2), dst, false);
            }
        }
        return dst.indexOf(src) >= 0;
    }

    /*!
     *  @brief  srcとdstの部分一致を調べる
     *  @param  src         キー文字列(正規表現)
     *  @param  dst         調べる文字列
     *  @param  normalize   正規化(大/小文字区別なし)の有無
     */
    regexp(src, dst, normalize) {
        const flag = (normalize) ?"i" :"";
        var ret = dst.search(RegExp(src, flag));
        return ret >= 0;
    }
}

var text_utility = new TextUtil();
