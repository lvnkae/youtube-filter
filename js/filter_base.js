/*!
 *  @brief  フィルタベース
 *  @note   個別フィルタクラスの親
 */
class FilterBase {

    initialize() {
        const active = this.storage.json.active;
        const loc = this.current_location;
        if (loc.in_youtube()) {
            this.contextmenu_controller
                = new ContextMenuController_Youtube(active, this.channel_info_accessor);
        } else if (loc.in_google()) {
            this.contextmenu_controller = new ContextMenuController_Google(active);
        }
    }

    /*!
     *  @param storage  ストレージインスタンス(shared_ptr的なイメージ)
     */
    constructor(storage) {
        this.storage = storage;
        this.author_info_accessor = new AuthorInfoAccessor();
        this.video_info_accessor = new VideoInfoAccessor();
        this.channel_info_accessor = new ChannelInfoAccessor();
        this.video_searcher = new VideoSearcher();
        this.playlist_searcher = new PlaylistSearcher();
        //
        this.current_location = new urlWrapper(location.href);
        this.after_domloaded_observer = null;
        this.observer_timer = null;
        this.filtering_timer = null;
        //
        this.initialize();
    }

    /*!
     *  @brief  子iframeに右クリック監視を追加
     */
    add_iframe_onmouse_monitoring() {}
    /*!
     *  @brief  キー要素observer準備完了callback
     */
    callback_ready_element_observer() {}
    /*!
     *  @brief  DOM要素追加callback
     *  @note   DOM要素追加タイミングで行いたい処理
     *  @note   フィルタON/OFF関係なく呼ばれる
     */
    callback_domelement_adition() {}
    /*!
     *  @brief  キーDOM要素変更callback
     *  @note   有効な要素追加/削除があった場合の処理
     *  @note   フィルタがOFFなら呼ばれない
     */
    callback_observing_element_change() {}
    /*!
     *  @brief  高速化用マーカーをクリアする
     */
    clear_marker() {}

    /*!
     *  @brief  element追加observer生成
     *  @param  func_is_invalid_records DOMアイテムチェック関数
     *  @param  func_filtering          フィルタリング関数
     */
    create_after_domloaded_observer(func_is_invalid_records) {
        this.after_domloaded_observer = new MutationObserver((records)=> {
            const loc = this.current_location;
            const b_change_url = loc.url != location.href;
            //
            this.callback_domelement_adition();
            //
            if (!this.storage.json.active) {
                return;
            }
            if (records.length == 0) {
                return; // なぜか空
            }
            if (func_is_invalid_records(records)) {
                return; // 無効
            }
            this.callback_observing_element_change(records, b_change_url);
            //
            if (b_change_url) {
                // URLが変わった(=下位フレーム再構成)らタイマー捨てて即処理
                if (this.filtering_timer != null) {
                    clearTimeout(this.filtering_timer);
                    this.filtering_timer = null;
                }
                this.current_location = new urlWrapper(location.href);
                this.filtering();
                this.add_iframe_onmouse_monitoring();
            } else {
                // 短時間の連続追加はまとめて処理したい気持ち
                if (this.filtering_timer == null) {
                    this.filtering_timer = setTimeout(()=> {
                        this.current_location = new urlWrapper(location.href);
                        this.filtering();
                        clearTimeout(this.filtering_timer);
                        this.filtering_timer = null;
                        this.add_iframe_onmouse_monitoring();
                    }, 200); /* 1/5sec */
                }
            }
        });
    }

    /*!
     *  @brief  element追加observer準備
     *  @note   DOM構築完了後に追加される遅延elementもフィルタにかけたい
     *  @note   → observerでelement追加をhookしfiltering実行
     */
    ready_element_observer() {
        var elem = [];
        this.get_observing_node(elem);
        for (var e of elem) {
            this.after_domloaded_observer.observe(e, {
                childList: true,
                subtree: true,
            });
        }
        return elem.length > 0;
    }

    callback_domloaded() {
        if (!this.ready_element_observer()) {
            // DOM構築完了時点でキーelementが見つからない場合は
            // intervalTimerで生成を待ってobserver登録する
            this.observer_timer = setInterval(()=> {
                if (this.ready_element_observer()) {
                    this.add_iframe_onmouse_monitoring();
                    this.callback_ready_element_observer();
                    clearInterval(this.observer_timer);
                    this.observer_timer = null;
                }
            }, 33); /* 1/30sec */
        } else {
            this.add_iframe_onmouse_monitoring();
            this.callback_ready_element_observer();
        }
    }


    /*!
     *  @brief  フィルタリング
     */
    filtering() {
        if (!this.storage.json.active) {
            return;
        }
        this.filtering();
    }

    /*!
     *  @brief  コメントフィルタ
     */
    filtering_comments() {}
}
