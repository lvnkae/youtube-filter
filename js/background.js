/*!
 *  @brief  background.js本体
 */
class Background {
    //
    constructor() {
        this.extention_id = '';
        this.video_json_accessor = new BGVideoJsonAccessor();
        this.videos_xml_accessor = new BGVideosXmlAccessor();
        this.channel_html_accessor = new BGChannelHTMLAccessor();
        this.video_searcher = new BGVideoSearcher();
        this.playlist_searcher = new BGPlaylistSearcher();
        this.contextmenu_controller = new BGContextMenuController();
        //
        this.initialize();
    }

    /*!
     *  @brief  登録
     *  @param  extention_id    拡張機能ID
     *  @param  tab_id          タブID
     */
    entry(extention_id, tab_id) {
        this.extention_id = extention_id;
        this.video_json_accessor.entry(tab_id);
        this.videos_xml_accessor.entry(tab_id);
        this.channel_html_accessor.entry(tab_id);
        this.video_searcher.entry(tab_id);
        this.playlist_searcher.entry(tab_id);
        this.contextmenu_controller.entry(tab_id);
        this.contextmenu_controller.create_menu(extention_id);
    }
    
    /*!
     *
     */
    initialize() {
        chrome.runtime.onMessage.addListener(
            (request, sender, sendResponse)=> {
                if (request.command == MessageUtil.command_get_video_json()) {
                    this.video_json_accessor.on_message(request, sender);
                } else
                if (request.command == MessageUtil.command_get_videos_xml()) {
                    this.videos_xml_accessor.on_message(request, sender);
                } else
                if (request.command == MessageUtil.command_get_channel_html()) {
                    this.channel_html_accessor.on_message(request, sender);
                } else
                if (request.command == MessageUtil.command_search_video()) {
                    this.video_searcher.on_message(request, sender);
                } else
                if (request.command == MessageUtil.command_search_playlist()) {
                    this.playlist_searcher.on_message(request, sender);
                } else
                if (request.command == MessageUtil.command_update_contextmenu()) {
                    this.contextmenu_controller.on_message(request);
                } else
                if (request.command == MessageUtil.command_start_content()) {
                    this.entry(sender.id, sender.tab.id);
                }
                return true;
            }
        );
    }
}

var gBackground = new Background();
