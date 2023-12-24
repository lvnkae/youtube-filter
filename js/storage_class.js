/*!
 *  @brief  保存データクラス
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
