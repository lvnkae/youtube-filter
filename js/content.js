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
 *  @brief  urlWrapper
 *  @note   urlを扱いやすくしたもの
 */
class urlWrapper {

    constructor(url) {
        var href_div = (function() {
            const href_header = [
                'http://',
                'https://'
            ];
            for (const headar of href_header) {
                if (url.substr(0, headar.length) == headar) {
                    return url.substr(headar.length).split('/');
                }
            }
            return [];
        })();
        this.url = url;
        if (href_div.length > 0) {
            this.domain = href_div[0];
        } else {
            this.domain = '';
        }
        this.subdir = [];
        if (href_div.length > 1) {
            for (var i = 1; i < href_div.length; i++) {
                this.subdir.push(href_div[i]);
            }
        }
    }

    in_youtube()
    {
        return this.domain.indexOf("www.youtube.com") >= 0;
    }
    in_google()
    {
        return this.domain == 'www.google.com' ||
               this.domain == 'www.google.co.jp';
    }
    in_top_page()
    {
        return this.subdir.length == 0 ||
               this.subdir[0].length == 0;
    }
    in_youtube_movie_page()
    {
        return this.subdir.length >=1 &&
               this.subdir[0].indexOf('watch?') >= 0;
    }
    in_youtube_playlist_page()
    {
        return this.subdir.length >=1 &&
               this.subdir[0].indexOf('playlist?') >= 0;
    }
    in_youtube_channel_page()
    {
        return (this.subdir.length >=1 && this.subdir[0] == 'channel');
    }
    in_youtube_user_page()
    {
        return (this.subdir.length >=1 && this.subdir[0] == 'user');
    }
    in_youtube_search_page()
    {
        return this.subdir.length >= 1 &&
               this.subdir[0].indexOf('results?') >= 0 &
               this.subdir[0].indexOf('search_query=') >= 0;
    }
    in_youtube_trending()
    {
        return this.subdir.length >= 2 &&
               this.subdir[0] == 'feed' &&
               this.subdir[1] == 'trending';
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
                });
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
            if ($(elem).attr("filtered") != null) {
                return;
            }
            const elem_title
                = $(elem).find(".yt-simple-endpoint.style-scope.ytd-video-renderer");
            const elem_channel
                = $(elem).find(".yt-simple-endpoint.style-scope.yt-formatted-string");
            if (elem_title.length != 1 || elem_channel.length != 1) {
                return;
            }
            const title = $(elem_title[0]).text();
            const channel = $(elem_channel[0]).text();
            if (this.storage.channel_and_title_filter(channel, title)) {
                $(elem).parent().parent().detach();
                return;
            }
            $(elem).attr("filtered", "");
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
        //  小区分(個別チャンネル)ページ用
        $("span.title.style-scope.ytd-mini-channel-renderer").each((inx, elem)=> {
            const channel = $(elem).text();
            if (this.storage.channel_filter(channel)) {
                $(elem).parent().parent().detach();
            }
        });
        //  大区分(ゲーム、スポーツ等)ページ用
        $("span#title.style-scope.ytd-grid-channel-renderer").each((inx, elem)=> {
            const channel = this.get_channel_from_topic($(elem).text());
            if (this.storage.channel_filter(channel)) {
                $(elem).parent().parent().parent().detach();
            }
        });
    }
    
    /*!
     *  @brief  動画(動画再生ページ)にフィルタを掛ける
     */
    filtering_youtube_watch_movie(change_url)
    {
        $("a.yt-simple-endpoint.style-scope.ytd-compact-video-renderer").each((inx, elem)=> {
            const elem_title
                = $(elem).find("span#video-title.style-scope.ytd-compact-video-renderer");
            const elem_channel
                = $(elem).find("yt-formatted-string#byline.style-scope.ytd-video-meta-block");
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
     *  @brief  カテゴリ(ホームページ)にフィルタを掛ける
     */
    filtering_youtube_home_category()
    {
        $("h2.style-scope.ytd-shelf-renderer").each((inx, elem)=> {
            const elem_ano
                = $(elem).find("yt-formatted-string#title-annotation.style-scope.ytd-shelf-renderer");
            if (elem_ano.length != 1) {
                return;
            }
            const ano_text = $(elem_ano[0]).text();
            if (ano_text != "おすすめのチャンネル" &&
                ano_text != "あなたにおすすめのチャンネル") {
                return;
            }
            const elem_name
                = $(elem).find("span#title.style-scope.ytd-shelf-renderer");
            if (elem_name.length != 1) {
                return;
            }
            const channel = this.get_channel_from_topic($(elem_name[0]).text());
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
            if ($(elem).attr("filtered") != null) {
                return;
            }
            const elem_title
                = $(elem).find(".yt-simple-endpoint.style-scope.ytd-grid-video-renderer");
            const elem_channel
                = $(elem).find(".yt-simple-endpoint.style-scope.yt-formatted-string");
            if (elem_title.length != 1 || elem_channel.length != 1) {
                return;
            }
            const title = $(elem_title[0]).text();
            const channel = $(elem_channel[0]).text();
            if (this.storage.channel_and_title_filter(channel, title)) {
                $(elem).parent().detach();
                return;
            }
            $(elem).attr("filtered", "");
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
     *  @brief  動画(google検索)にフィルタをかける
     */
    filtering_google_movie()
    {
        $("div.g").each((inx, elem)=> {
            const elem_title = $(elem).find("h3.r");
            if (elem_title.length != 1) {
                return;
            }
            const a_tag = $(elem_title).find("a");
            const url = new urlWrapper($(a_tag[0]).attr("href"));
            if (!url.in_youtube()) {
                return; // tubeじゃない
            }
            if (url.in_youtube_movie_page()) {
                const title = $(a_tag[0]).text();
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
                const channel_div = $(a_tag[0]).text().split(' -');
                if (channel_div.length == 0) {
                    return;
                }
                var channel = '';
                for (var inx = 0; inx < channel_div.length-1; inx++) {
                    channel += channel_div[inx];
                }
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

        {
            var scr = $("g-scrolling-carousel");
            if (scr.length != 1) {
                return;
            }
            var c0_div = $(scr[0]).children("div");
            if (c0_div.length != 1) {
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
                if (!url.in_youtube()) {
                    continue;
                }
                const title = $($($(a_tag[0]).children()[1]).children()[0]).text();
                const channel = $($(a_tag[0]).next().children()[0]).text();
                if (this.storage.channel_and_title_filter(channel, title)) {
                    $(mov).detach();
                }
            }
        }
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
            const num = (text_div[len-1] == " トピック") ?len-1 :len;
            for (var inx = 0; inx < num; inx++) {
                channel += text_div[inx];
            }
            return channel;
        }
    }

    /*
     */
    initialize() {
        this.after_domloaded_observer = new MutationObserver((records)=> {
            // 自動再生をオフにする
            {
                var button = $("paper-toggle-button#improved-toggle.style-scope.ytd-compact-autoplay-renderer");
                if (button.length > 0) {
                    if ($(button[0]).prop("aria-pressed")) {
                        button.click();
                    }
                }
            }
            // マウスオーバによるアイテム追加は弾きたい
            if (records[0].target.id.indexOf('-overlay') >= 0) {
                return; 
            }
            // 短時間の連続追加はまとめて処理したい気持ち
            if (null == this.filtering_timer) {
                this.filtering_timer = setTimeout(()=> {
                    const prev_url = gContent.current_location.url;
                    gContent.current_location = new urlWrapper(location.href);
                    const b_change_url = prev_url != gContent.current_location.url;
                    if (b_change_url) {
                        this.storage.load().then(()=> {
                            this.filtering();
                        });
                    } else {
                        this.filtering();
                    }
                    //
                    clearTimeout(this.filtering_timer);
                    this.filtering_timer = null;
                }, 200);
            }
        });
    }
}

var gContent = new Content();
