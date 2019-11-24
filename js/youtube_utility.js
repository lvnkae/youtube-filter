/*!
 *  @brief  Youtube関連Utility
 */
class YoutubeUtil {

    static is_channel_url(author_url) {
        return author_url.indexOf("/channel/") >= 0;
    }
    static is_userpage_url(author_url) {
        return author_url.indexOf("/user/") >= 0;
    }

    /*!
     *  @brief  トピック表記を含む文字列からチャンネル名を切り出す
     */
    static get_channel_from_topic(text) {
        const text_div = text.split(" -");
        const len = text_div.length;
        if (len.length <= 0) {
            return "";
        } else { 
            var channel = "";
            const num = (text_div[len-1] == " トピック" ||
                         text_div[len-1] == " Topic")
                         ?len-1 :len;
            for (var inx = 0; inx < num; inx++) {
                channel += text_div[inx];
            }
            return channel;
        }
    }

    /*!
     *  @brief  YoutubeチャンネルリンクからIDを切り出す
     */
    static cut_channel_id(channel_href) {
        const sp_href = channel_href.split("/");
        for (var inx = 0; inx < sp_href.length-1; inx++) {
            if (sp_href[inx] == 'user' ||
                sp_href[inx] == 'channel') {
                return sp_href[inx+1];
            }
        }
        return null;
    }
    /*!
     *  @brief  Youtube動画リンクからハッシュを切り出す
     */
    static cut_movie_hash(movie_href) {
        const sp_href = movie_href.split("?v=");
        return sp_href[sp_href.length-1];
    }
    /*!
     *  @brief  Youtube動画ノードからハッシュを得る
     *  @param  elem    動画ベースノード
     *  @param  tag     ハッシュ取得タグ
     */
    static get_video_hash(elem, tag) {
        const nd_hash = $(elem).find(tag);
        if (nd_hash.length > 0) {
            return YoutubeUtil.cut_movie_hash($(nd_hash).attr("href"));
        } else {
            return "";
        }
    }

    /*!
     *  @brief  ページチャンネルURLを得る
     */
    static get_page_author_url() {
        return location.href;
    }
    /*!
     *  @brief  ページチャンネル名を得る
     */
    static get_page_channel_name() {
        const tag = "yt-formatted-string#text.style-scope.ytd-channel-name";
        const text_tag = $(tag);
        if (text_tag.length > 0) {
            return $(text_tag[0]).text();
        } else {
            return null;
        }
    }


    /*!
     *  @brief  要素が非表示であるか
     *  @param  e   調べる要素
     */
    static in_disappearing(e) {
        if ($(e).attr("hidden") != null) {
            return true;
        }
        const attr_style = $(e).attr("style");
        if (attr_style != null && attr_style.indexOf("display: none;") >= 0) {
            return true;
        }
        return false;
    }
    /*!
     *  @brief  key要素を探す
     *  @param  start_elem  探索起点
     *  @param  key         探索キー
     *  @note   first-hit
     *  @note   非表示(hidden, display none)は除外する
     */
    static find_first_appearing_element(start_elem, key) {
        const elements = $(start_elem).find(key)
        for (var e of elements) {
            if (!this.in_disappearing(e)) {
                return e;
            }
        }
        return null
    }


    static search_renderer_root(elem) {
        const is_root = function(e) {
            return e.localName == 'ytd-video-renderer' ||
                   e.localName == 'ytd-channel-renderer' ||
                   e.localName == 'ytd-playlist-renderer' ||
                   e.localName == 'ytd-grid-video-renderer' ||
                   e.localName == 'ytd-compact-video-renderer' ||
                   e.localName == 'ytd-rich-grid-video-renderer' ||
                   e.localName == 'ytd-compact-playlist-renderer';
        }
        while(elem.length > 0) {
            if (is_root(elem[0])) {
                return elem;
            }
            elem = elem.parent();
        }
        return {length:0};
    }

    static detach_upper_node(elem, tag) {
        while(elem.length > 0) {
            if (elem[0].localName == tag) {
                $(elem).detach();
                return;
            }
            elem = elem.parent();
        }
    }
}
