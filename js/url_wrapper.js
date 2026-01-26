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
                if (url.substring(0, headar.length) == headar) {
                    return url.substring(headar.length).split('/');
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
    in_google_searched_youtube()
    {
        return this.in_youtube() ||
                    this.domain.indexOf("m.youtube.com") >= 0 ||
                    this.domain.indexOf("gaming.youtube.com") >= 0;
    }
    /*!
     *  @brief  Home亜種
     *  @note   普段は空の"blg-yoodle"に「Youtube 注目」バナーが表示されるタイプ
     *  @note   サイト左上のYoutubeアイコンからのリンク先が書き換えられてしまう
     */
    in_youtube_top_yoodle()
    {
        return this.subdir.length >= 1 &&
               this.subdir[0].slice(0,4) == '?bp=';
    }
    in_top_page()
    {
        return this.subdir.length == 0 ||
               this.subdir[0].length == 0 ||
               this.in_youtube_top_yoodle();
    }
    in_youtube_movie_page()
    {
        return this.subdir.length >=1 &&
               (this.subdir[0].indexOf('watch?') >= 0 ||
                this.subdir[0] == 'live');
    }
    in_youtube_playlist_page()
    {
        return this.subdir.length >=1 &&
               this.subdir[0].indexOf('playlist?') >= 0;
    }
    in_youtube_channel_page()
    {
        // sports(Egdi0XIXXZ-qJOFPf4JSKw)だけ構造が違うので除外
        return this.subdir.length >=2 &&
               this.subdir[0] == 'channel' &&
               this.subdir[1] != 'UCEgdi0XIXXZ-qJOFPf4JSKw';
    }
    in_youtube_user_page()
    {
        return (this.subdir.length >=1 && this.subdir[0] == 'user');
    }
    in_youtube_custom_channel_page()
    {
        return (this.subdir.length >=1 && this.subdir[0] == 'c');
    }
    in_youtube_channel_playlists() {
        // in_youtube_(channel|user|custom_channel)_pageの後に使う(単体NG)
        return (this.subdir.length == 3 && this.subdir[2] == 'playlists');
    }    
    in_youtube_handle_page()
    {
        return (this.subdir.length >=1 && this.subdir[0].startsWith('@'));
    }
    in_youtube_handle_playlists() {
        // in_youtube_handle_pageの後に使う(単体NG)
        return (this.subdir.length == 2 && this.subdir[1] == 'playlists');
    }
    /*!
     *  @brief  チャンネル>投稿>コメント
     */
    in_youtube_channel_post()
    {
        return this.subdir.length >=1 &&
               this.subdir[0] == 'post';
    }
    in_youtube_sp_channel_page()
    {
        if (this.subdir.length >=1 && this.subdir[0] == 'gaming') {
            return true; /* ゲーム */
        }
        if (this.subdir.length >=2 &&
            this.subdir[0] == 'feed' &&
            this.subdir[1] == 'news_destination') {
            return true; /* ニュース */
        }
        return false;
    }
    in_youtube_search_page()
    {
        return this.subdir.length >= 1 &&
               this.subdir[0].indexOf('results?') >= 0 &
               this.subdir[0].indexOf('search_query=') >= 0;
    }
    in_youtube_sports()
    {
        // 専用URLにしてほしい…
        return this.subdir.length >=2 &&
               this.subdir[0] == 'channel' &&
               this.subdir[1] == 'UCEgdi0XIXXZ-qJOFPf4JSKw';
    }
    in_youtube_hashtag()
    {
        return (this.subdir.length >=1 && this.subdir[0] == 'hashtag');
    }
    in_youtube_short_page()
    {
        return (this.subdir.length >=1 && this.subdir[0] == 'shorts');
    }
    in_youtube_feeds() 
    {
        return this.subdir.length >=2 &&
               this.subdir[0] == 'feed' &&
               this.subdir[1].indexOf('subscriptions') >= 0;

    }
}
