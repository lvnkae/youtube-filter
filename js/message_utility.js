/*!
 *  @brief  messageユーティリティクラス
 */
class MessageUtil {
    /*!
     *  @brief  extention管轄listenerへのsendMessage
     *  @param  message
     *  @note   extention→extention,background,dashboard
     *  @note   dashboard→background
     *  @note   popup→background,dashboard
     *  @note   環境依存するのでラップしとく
     */
    static send_message(message) {
        chrome.runtime.sendMessage(message);
    }
    /*!
     *  @brief  有効tabへsendMessage
     *  @note   popup→extention、dashboard
     *  @note   dashboard→extention
     */
    static send_message_to_relative_tab(message) {
        chrome.tabs.query({}, (tabs)=> {
            for (const tab of tabs) {
                chrome.tabs.sendMessage(tab.id, message);
            }
        });
    }

    static command_start_content() { return "start_content"; }
    static command_update_storage() { return "update_storage"; }
    static command_add_mute_id() { return "add_mute_id"}
    static command_get_video_json() { return "get_video_json"; }
    static command_get_videos_xml() { return "get_videos_xml"; }
    static command_get_channel_html() { return "get_channel_html"; }
    static command_search_video() { return "search_video"; }
    static command_search_playlist() { return "search_playlist"; }
    static command_update_contextmenu() { return "update_contextmenu"; }
    static command_mute_channel_id() { return "mute_youtube_channel_id"; }
    static command_mute_comment_id() { return "mute_youtube_comment_id"; }
}
