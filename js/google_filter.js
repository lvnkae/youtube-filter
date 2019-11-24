/*!
 *  @brief  Googleフィルタ
 */
class GoogleFilter extends FilterBase {

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

    /*!
     *  @brief  動画(google検索)にフィルタをかける
     */
    filtering_google_movie() {
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
                const channel = $($($(a_tag[0]).nextAll()[1]).children()[0]).text();
                if (this.storage.channel_and_title_filter(channel, title)) {
                    $(mov).detach();
                } else {
                    const video_id = YoutubeUtil.cut_movie_hash($(a_tag).attr("href"));
                    const channel_id = this.video_info_accessor.get_channel_id(video_id);
                    if (channel_id != null) {
                        if (this.storage.channel_id_filter(channel_id, title)) {
                            $(renderer_root).detach();
                        } else {
                            // ContextMenu用に書き込んでおく
                            //$(renderer_root).attr("channel_id", channel_id);
                        }
                    } else {
                        this.video_info_accessor.entry(video_id);
                    }
                }
            }
        });
        //this.video_info_accessor.kick();
    }

    /*!
     *  @brief  フィルタリング
     */
    filtering() {
        this.filtering_google_movie();
    }



    get_observing_node(elem) {
        const tag = "div#center_col";
        $(tag).each((inx, e)=>{ elem.push(e); });
    }

    callback_domloaded() {
        super.filtering();
        super.callback_domloaded();
    }

    /*!
     *  @brief  無効な追加elementか？
     *  @retun  true    無効
     */
    is_valid_records(records) {
        return false;
    }

    /*!
     *  @param storage  ストレージインスタンス
     */
    constructor(storage) {
        super(storage);
        super.create_after_domloaded_observer(this.is_valid_records.bind(this));
    }
}
