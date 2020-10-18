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
    in_google_searched_youtube()
    {
        return this.in_youtube() ||
                    this.domain.indexOf("m.youtube.com") >= 0 ||
                    this.domain.indexOf("gaming.youtube.com") >= 0;
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
    in_youtube_custom_channel_page()
    {
        return (this.subdir.length >=1 && this.subdir[0] == 'c');
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
    in_youtube_gaming()
    {
        return (this.subdir.length >=1 && this.subdir[0] == 'gaming');
    }
}
