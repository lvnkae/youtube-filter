/*!
 *  @brief  background.js本体
 */
class Background {
    //
    constructor() {
        this.video_json_accessor = new BGVideoJsonAccessor();
        this.videos_xml_accessor = new BGVideosXmlAccessor();
        this.channel_html_accessor = new BGChannelHTMLAccessor();
        this.video_searcher = new BGVideoSearcher();
        this.playlist_searcher = new BGPlaylistSearcher();
        //
        this.initialize();
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
                    BGContextMenuController.on_message(request);
                } else
                if (request.command == MessageUtil.command_health_check()) {
                    //console.log("health check:" + performance.now());
                }
                this.request_health_check();
                return true;
            }
        );
        BGContextMenuController.add_listener();
    }

    request_health_check() {
        if (!this.video_json_accessor.is_empty_of_all_queue() ||
            !this.videos_xml_accessor.is_empty_of_all_queue() ||
            !this.channel_html_accessor.is_empty_of_all_queue() ||
            !this.video_searcher.is_empty_of_all_queue() ||
            !this.playlist_searcher.is_empty_of_all_queue()) {
            BGMessageSender.send_reply(
                {command:MessageUtil.command_request_health_check()}
            );
        }
    }
}

var gBackground = new Background();
chrome.runtime.onInstalled.addListener(()=> {
    BGContextMenuController.create_menu();
});
chrome.runtime.onStartup.addListener(()=> {
    BGContextMenuController.create_menu();
});
