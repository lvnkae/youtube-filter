/*!
 *  @brief  content.js本体
 */
class Content {

    constructor() {
        this.filter = new YoutubeFilter();
        this.current_location = new urlWrapper(location.href);
        this.kick();
    }

    kick() {
        this.filter.load();
    }
}

/*!
 *  @brief  Youtubeフィルタ
 */
class YoutubeFilter {

    constructor() {
        this.after_domloaded_observer = null;
        this.filtering_timer = null;
        //
        this.initialize();
    }

    load() {
        this.storage = new StorageData();
        this.storage.load().then(() => {
            document.addEventListener("DOMContentLoaded", ()=> {
                this.callback_domloaded();
            });
        });
    }

    callback_domloaded() {
        this.filtering();
        //
        if (!this.ready_element_observer()) {
            // DOM構築完了時点でキーelementが見つからない場合は
            // intervalTimerで生成を待ってobserver登録する
            if (gContent.current_location.in_youtube()) {
                this.observer_timer = setInterval(()=> {
                    if (this.ready_element_observer()) {
                        clearInterval(this.observer_timer);
                        this.observer_timer = null;
                    }
                }, 33); /* 1/30sec */
            }
        }
    }

    /*!
     *  @brief  element追加observer準備
     *  @note   DOM構築完了後に追加される遅延elementもフィルタにかけたい
     *  @note   → observerでelement追加をhookしfiltering実行
     */
    ready_element_observer() {
        const loc = gContent.current_location;
        var elem = [];
        if (loc.in_youtube()) {
            elem = $("ytd-page-manager#page-manager.style-scope.ytd-app");
        } else if(loc.in_google()) {
            elem = $("div#center_col");
        }
        for (var e of elem) {
            this.after_domloaded_observer.observe(e, {
                childList: true,
                subtree: true,
            });
        }
        return elem.length > 0;
    }

    /*!
     *  @brief  フィルタリング
     *  @note   DOM構築完了タイミング（またはelement追加時）に実行
     */
    filtering() {
        if (this.storage.json.active) {
            const loc = gContent.current_location;
            if (loc.in_youtube()) {
                if (loc.in_youtube_search_page() || loc.in_youtube_trending()) {
                    this.filtering_youtube_search_movie();
                    this.filtering_youtube_search_channel();
                    this.filtering_youtube_search_playlist();
                } else if (loc.in_youtube_channel_page() || loc.in_youtube_user_page()) {
                    this.filtering_youtube_channel_movie();
                    this.filtering_youtube_channel_channel();
                } else if (loc.in_youtube_gaming()) {
                    this.filtering_youtube_gaming();
                    this.filtering_youtube_channel_movie();
                    this.filtering_youtube_channel_channel();
                } else if (loc.in_youtube_movie_page()) {
                    this.filtering_youtube_watch_movie();
                } else if (loc.in_top_page()) {
                    this.filtering_youtube_home_category();
                    this.filtering_youtube_home_movie();
                    this.fitlering_youtube_home_channel();
                }
            } else if (loc.in_google()) {
                this.filtering_google_movie();
            }
        }
    }

    /*!
     *  @brief  動画(Youtube検索)にフィルタを掛ける
     */
    filtering_youtube_search_movie()
    {
        $(".text-wrapper.style-scope.ytd-video-renderer").each((inx, elem)=> {
            const elem_title
                = $(elem).find(".yt-simple-endpoint.style-scope.ytd-video-renderer");
            if (elem_title.length != 1) {
                return;
            }
            const marker = this.get_filtered_marker(elem);
            // ytd-video-rendererノードは使い回されることがあり(フィルタ条件変更時など)
            // ただマークするだけだと動画が差し替えられた時にフィルタされない
            // → 動画ハッシュをマーカーとし、前回と一致した場合のみ弾く
            const hash = this.cut_movie_hash($(elem_title[0]).attr("href"));
            if (marker != null && hash == marker) {
                return;
            }
            this.remove_filtered_marker(elem);
            const elem_channel
                = this.find_first_element_without_hidden(elem, ".yt-simple-endpoint.style-scope.yt-formatted-string");
            if (elem_channel == null) {
                return;
            }
            const title = $(elem_title[0]).text();
            const channel = $(elem_channel).text();
            if (this.storage.channel_and_title_filter(channel, title)) {
                $(elem).parent().parent().detach();
                return;
            }
            //
            this.set_filtered_marker(elem, hash);
        });
    }
    /*!
     *  @brief  チャンネル(Youtube検索)にフィルタを掛ける
     *  @note   動画検索(フィルタなし)時に差し込まれるチャンネルタイルの除去
     */
    filtering_youtube_search_channel()
    {
        $("h3#channel-title.style-scope.ytd-channel-renderer").each((inx, elem)=> {
            const elem_channel
              = $(elem).find("span.style-scope.ytd-channel-renderer");
            if (elem_channel.length != 1) {
                return;
            }
            const channel = $(elem_channel[0]).text();
            if (this.storage.channel_filter(channel)) {
                $(elem).parent().parent().parent().detach();
            }
        });
    }
    /*!
     *  @brief  プレイリスト(Youtube検索)にフィルタを掛ける
     */
    filtering_youtube_search_playlist()
    {
        $("a.yt-simple-endpoint.style-scope.ytd-playlist-renderer").each((inx, elem)=> {
            const elem_title
                = $(elem).find("span#video-title.style-scope.ytd-playlist-renderer");
            const elem_channel
                = $(elem).find("a.yt-simple-endpoint.style-scope.yt-formatted-string");
            if (elem_title.length != 1 || elem_channel.length != 1) {
                return;
            }
            const title = $(elem_title[0]).text();
            const channel = $(elem_channel[0]).text();
            if (this.storage.channel_and_title_filter(channel, title)) {
                $(elem).parent().parent().detach();
            }
        });
    }

    /*!
     *  @brief  動画(チャンネルページ)にフィルタを掛ける
     *  @note   大区分(ゲーム、スポーツなど)用
     */
    filtering_youtube_channel_movie()
    {
        $("div#meta.style-scope.ytd-grid-video-renderer").each((inx, elem)=> {
            const elem_title
                = $(elem).find("a#video-title.yt-simple-endpoint.style-scope.ytd-grid-video-renderer");
            const elem_channel
                = $(elem).find("a.yt-simple-endpoint.style-scope.yt-formatted-string");
            if (elem_title.length != 1 || elem_channel.length != 1) {
                return;
            }
            const title = $(elem_title[0]).text();
            const channel = $(elem_channel[0]).text();
            if (this.storage.channel_and_title_filter(channel, title)) {
                $(elem).parent().parent().parent().detach();
            }
        });
    }
    /*!
     *  @brief  チャンネル(チャンネルページ)にフィルタを掛ける
     */
    filtering_youtube_channel_channel()
    {
        //  小区分(個別チャンネル)ページ用 - 水平リスト
        $("span.title.style-scope.ytd-mini-channel-renderer").each((inx, elem)=> {
            const channel = $(elem).text();
            if (this.storage.channel_filter(channel)) {
                $(elem).parent().parent().detach();
            }
        });
        //  大区分(ゲーム、スポーツ等)ページ用 - 水平リスト
        $("span#title.style-scope.ytd-grid-channel-renderer").each((inx, elem)=> {
            const channel = this.get_channel_from_topic($(elem).text());
            if (this.storage.channel_filter(channel)) {
                $(elem).parent().parent().parent().detach();
            }
        });
        // 大区分(ゲーム,スポーツ等)ページ用2 - 単独表示
        $("h3#channel-title.style-scope.ytd-channel-renderer").each((inx, elem)=> {
            const ch_str = $($(elem).find("span")[0]).text();
            const channel = this.get_channel_from_topic(ch_str);
            if (this.storage.channel_filter(channel)) {
                $(elem).parent().parent().parent().parent().parent().detach();
            }
        });
    }
    
    /*!
     *  @brief  動画(動画再生ページ)にフィルタを掛ける
     */
    filtering_youtube_watch_movie(change_url)
    {
        // おすすめ動画フィルタ
        $("a.yt-simple-endpoint.style-scope.ytd-compact-video-renderer").each((inx, elem)=> {
            const elem_title
                = $(elem).find("span#video-title.style-scope.ytd-compact-video-renderer");
            const elem_channel
                = $(elem).find("yt-formatted-string#text.style-scope.ytd-channel-name");
            if (elem_title.length != 1 || elem_channel.length != 1) {
                return;
            }
            const title = $(elem_title[0]).text();
            const channel = $(elem_channel[0]).text();
            if (this.storage.channel_and_title_filter(channel, title)) {
                $(elem).parent().parent().detach();
            }
        });
        // コメントフィルタ
        if (this.storage.have_ng_comment_data()) {
            var candidate_of_additional_ng_id = [];
            $("div#main.style-scope.ytd-comment-renderer").each((inx, elem)=> {
                const elem_author
                    = $(elem).find("a#author-text.yt-simple-endpoint.style-scope.ytd-comment-renderer");
                if (elem_author.length != 1) {
                    return;
                }
                const elem_user = $(elem_author).find("span");
                if (elem_user.length != 1) {
                    return;
                }
                const elem_comment = $(elem).find("yt-formatted-string#content-text.style-scope.ytd-comment-renderer")
                if (elem_comment.length != 1) {
                    return;
                }
                const username
                    = text_utility.remove_line_head_space(
                        text_utility.remove_blank_line($(elem_user).text()));
                const userid = this.cut_channel_id($(elem_author).attr("href"));
                const comment = $(elem_comment).text();
                const ret = this.storage.comment_filter(username, userid, comment);
                if (ret.result) {
                    const comment_root = $(elem).parent().parent();
                    if ($(comment_root).attr("is-reply") != null) {
                        // リプライのみ削除
                        $(comment_root).detach();
                    } else {
                        // コメントスレッドごと削除
                        $(comment_root).parent().detach();
                    }
                    if (ret.add_ng_id) {
                        candidate_of_additional_ng_id.push(userid);
                    }
                }
            });
            {
                var additional_ng_id = [];
                for (const ng_id of candidate_of_additional_ng_id) {
                    if (!this.storage.json.ng_comment_by_id.includes(ng_id)) {
                        additional_ng_id.push(ng_id);
                    }
                }
                if (additional_ng_id.length > 0) {
                    for (const ng_id of additional_ng_id) {
                        this.storage.json.ng_comment_by_id.push(ng_id);
                    }
                    this.storage.save();
                }
            }
        }
    }

    /*!
     *  @brief  カテゴリ(ホームページ)にフィルタを掛ける
     */
    filtering_youtube_home_category()
    {
        var ano_text_rcch = null;
        {
            const elem_edp = $("a#endpoint.yt-simple-endpoint.style-scope.ytd-guide-entry-renderer");
            const word_home = text_utility.remove_new_line_and_space($(elem_edp[0]).text());
            if (word_home == "ホーム") {
                // JP
                ano_text_rcch = "おすすめのチャンネル";
            } else if (word_home == "Home") {
                // ENG(US/UK)
                ano_text_rcch = "Recommended channel";
            } else {
                return;
            }
        }

        $("h2.style-scope.ytd-shelf-renderer").each((inx, elem)=> {
            const elem_ano
                = this.find_first_element_without_hidden(elem, "yt-formatted-string#title-annotation.style-scope.ytd-shelf-renderer");
            if (elem_ano == null) {
                return;
            }
            const ano_text = $(elem_ano).text();
            if (ano_text.indexOf(ano_text_rcch) < 0) {
                return;
            }
            const elem_name
                = this.find_first_element_without_hidden(elem, "span#title.style-scope.ytd-shelf-renderer");
            if (elem_name == null) {
                return;
            }
            const channel = this.get_channel_from_topic($(elem_name).text());
            if (channel.length > 0) {
                if (this.storage.channel_filter(channel)) {
                    $(elem).parent().parent().parent().parent().detach();
                }
            }
        });
    }
    /*!
     *  @brief  動画(ホームページ)にフィルタを掛ける
     */
    filtering_youtube_home_movie()
    {
        $("div#dismissable.style-scope.ytd-grid-video-renderer").each((inx, elem)=> {
            const elem_title
                = $(elem).find(".yt-simple-endpoint.style-scope.ytd-grid-video-renderer");
            if (elem_title.length != 1) {
                return;
            }
            //
            const marker = this.get_filtered_marker(elem);
            const hash = this.cut_movie_hash($(elem_title[0]).attr("href"));
            if (marker != null && hash == marker) {
                return;
            }
            this.remove_filtered_marker(elem);
            //
            const elem_channel
                = $(elem).find(".yt-simple-endpoint.style-scope.yt-formatted-string");
            if (elem_channel.length != 1) {
                return;
            }
            const title = $(elem_title[0]).text();
            const channel = $(elem_channel[0]).text();
            if (this.storage.channel_and_title_filter(channel, title)) {
                $(elem).parent().detach();
                return;
            }
            //
            this.set_filtered_marker(elem, hash);
        });
    }
    /*!
     *  @brief  チャンネル(ホームページ)にフィルタを掛ける
     *  @note   動画の代わりにチャンネルが表示され「チャンネル登録」ボタンの出るやつ
     */
    fitlering_youtube_home_channel()
    {
        $("span#title.style-scope.ytd-grid-channel-renderer").each((inx, elem)=> {
            const channel = this.get_channel_from_topic($(elem).text());
            if (this.storage.channel_filter(channel)) {
                $(elem).parent().parent().parent().detach();
            }
        });
    }

    /*!
     *  @brief  「ゲーム」にフィルタリングを掛ける
     *  @note   BEST OF YOUTUBE > ゲーム
     *  @note   channelから専用ページ化された(19年春頃？)
     */
    filtering_youtube_gaming()
    {
        // 背景画面に動画出すやつ(選択式+自動切り替え)をまるごと消す
        // ※フィルタ対象動画が含まれていても、部分的には消せないため
        var elem = $("div#carousel.style-scope.ytd-carousel-header-renderer");
        if (elem != null) {
            $(elem).detach();
        }
    }

    /*!
     *  @brief  動画(google検索)にフィルタをかける
     */
    filtering_google_movie()
    {
        $("div.g").each((inx, elem)=> {
            if (elem.className != "g") {
                return; // 検索要素じゃない
            }
            const elem_title = $(elem).find("h3");
            if (elem_title.length != 1) {
                return;
            }
            const a_tag = $(elem_title).parent();
            const href = $(a_tag[0]).attr("href");
            if (href == null) {
                return;
            }
            const url = new urlWrapper(href);
            if (!url.in_google_searched_youtube()) {
                return; // tubeじゃない
            }
            if (url.in_youtube_movie_page()) {
                const ttext = $(elem_title[0]).text();
                const title = this.cut_googled_youtube_title(ttext);
                const elem_channel = $(elem).find("div.slp.f");
                if (elem_channel.length == 1) {
                    const channel_div = $(elem_channel[0]).text().split(': ');
                    if (channel_div.length == 0) {
                        return;
                    }
                    var channel = '';
                    for (var inx = 1; inx < channel_div.length; inx++) {
                        channel += channel_div[inx];
                    }
                    if (this.storage.channel_and_title_filter(channel, title)) {
                        $(elem).detach();
                    }
                } else {
                    if (this.storage.title_filter(title)) {
                        $(elem).detach();
                    }
                }
            } else if (url.in_youtube_channel_page() ||
                       url.in_youtube_user_page()) {
                const ctext = $(elem_title[0]).text();
                const channel = this.cut_googled_youtube_title(ctext);
                if (this.storage.channel_filter(channel)) {
                    $(elem).detach();
                }
            } else if (url.in_youtube_playlist_page()) {
                const title = $(a_tag[0]).text();
                if (this.storage.title_filter(title)) {
                    $(elem).detach();
                }
            }
        });

        $("g-scrolling-carousel").each((inx, scr)=> {
            var c0_div = $(scr).children("div");
            if (c0_div.length <= 0) {
                return;
            }
            var c1_div = $(c0_div[0]).children("div");
            if (c1_div.length != 1) {
                return;
            }
            var c2_div = $(c1_div[0]).children("div");
            if (c2_div.length != 1) {
                return;
            }
            var movies = $(c2_div[0]).children("div");
            for (const mov of movies) {
                const a_tag = $(mov).find("a");
                if (a_tag.length != 1) {
                    continue;
                }
                const url = new urlWrapper($(a_tag[0]).attr("href"));
                if (!url.in_google_searched_youtube()) {
                    continue;
                }
                const title = $($($(a_tag[0]).children()[1]).children()[0]).text();
                const channel = $($(a_tag[0]).next().children()[0]).text();
                if (this.storage.channel_and_title_filter(channel, title)) {
                    $(mov).detach();
                }
            }
        });
    }



    /*!
     *  @brief  トピック表記を含む文字列からチャンネル名を切り出す
     */
    get_channel_from_topic(text) {
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
    cut_channel_id(channel_href) {
        const sp_href = channel_href.split("/");
        return sp_href[sp_href.length-1]
    }
    /*!
     *  @brief  Youtube動画リンクからハッシュを切り出す
     */
    cut_movie_hash(movie_href) {
        const sp_href = movie_href.split("?v=");
        return sp_href[sp_href.length-1];
    }
    /*!
     *  @brief  google検索結果のyoutube文字列切り出し
     *  @param  src 元文字列
     *  @note   検索結果においてyoutubeページ(動画,チャンネル等)は末尾に" - YouTube"が付加される
     *  @note   これをカットした本来の文字列を得る
     *  @note   ※" - Youtube"を含めて表示文字列上限を超えない場合に限る
     */
    cut_googled_youtube_title(src) {
        if (src.search(RegExp(" \- YouTube$", ""))) {
            return src.slice(0, src.length - " - Youtube".length);
        }
    }



    get_filtered_marker(element) {
        return $(element).attr("marker");
    }
    remove_filtered_marker(element) {
        $(element).removeAttr("marker");
    }
    set_filtered_marker(element, marker) {
        return $(element).attr("marker", marker);
    }



    /*!
     *  @brief  key要素を探す
     *  @param  start_elem  探索起点
     *  @param  key         探索キー
     *  @note   first-hit
     *  @note   非表示(hidden, display none)は除外する
     */
    find_first_element_without_hidden(start_elem, key) {
        const elements = $(start_elem).find(key)
        for (var e of elements) {
            if (!this.in_disappearing(e)) {
                return e;
            }
        }
        return null
    }

    /*!
     *  @brief  要素が非表示であるか
     *  @param  e   調べる要素
     */
    in_disappearing(e) {
        if ($(e).attr("hidden") != null) {
            return true;
        }
        const attr_style = $(e).attr("style");
        if (attr_style != null && attr_style.indexOf("display: none;") >= 0) {
            return true;
        }
        return false;
    }

    /*
     */
    initialize() {
        // ポップアップメニューからのメッセージを監視
        browser.runtime.onMessage.addListener((request, sender, sendResponse)=> {
            if (request == "update") {
                // 設定が更新されたらリロード
                this.storage.load().then();
            }
            return true;
        });

        // DOM構築完了後のノード追加observer
        this.after_domloaded_observer = new MutationObserver((records)=> {
            // 自動再生をオフにする
            if (this.storage.json.stop_autoplay) {
                $("paper-toggle-button#toggle.style-scope.ytd-compact-autoplay-renderer").each((inx, btn)=> {
                    const press = $(btn).attr("aria-pressed");
                    if (press != null && press == "true") {
                        btn.click();
                    }
                });
                $("paper-toggle-button#improved-toggle.style-scope.ytd-compact-autoplay-renderer").each((inx, btn)=> {
                    const press = $(btn).attr("aria-pressed");
                    if (press != null && press == "true") {
                        btn.click();
                    }
                });
            }
            if (this.storage.json.active) {
                // マウスオーバによるアイテム追加は弾きたい
                if (records[0].target.id.indexOf('-overlay') >= 0) {
                    return; 
                }
                // 短時間の連続追加はまとめて処理したい気持ち
                if (null == this.filtering_timer) {
                    this.filtering_timer = setTimeout(()=> {
                        gContent.current_location = new urlWrapper(location.href);
                        this.filtering();
                        clearTimeout(this.filtering_timer);
                        this.filtering_timer = null;
                    }, 200);
                }
            }
        });
    }
}

var gContent = new Content();
