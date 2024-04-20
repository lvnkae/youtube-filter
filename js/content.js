/*!
 *  @brief  content.js本体
 */
class Content {

    initialize() {
        // background用Listener
        chrome.runtime.onMessage.addListener(
            (request, sender, sendResponce)=> {
                if (request.command == MessageUtil.command_update_storage()) {
                    this.storage.load().then();
                } else
                if (request.command == MessageUtil.command_get_video_json()) {
                    if (this.filter_instance) {
                        this
                        .filter_instance
                        .tell_get_video_json(request.result,
                                             request.video_id,
                                             request.json);
                    }
                } else
                if (request.command == MessageUtil.command_get_videos_xml()) {
                    if (this.filter_instance) {
                        this
                        .filter_instance
                        .tell_get_videos_xml(request.result,
                                             request.username,
                                             request.xml);
                    }
                } else
                if (request.command == MessageUtil.command_get_channel_html()) {
                    if (this.filter_instance) {
                        this
                        .filter_instance
                        .tell_get_channel_html(request.result,
                                               request.unique_name,
                                               request.html);
                    }
                } else
                if (request.command == MessageUtil.command_search_video()) {
                    if (this.filter_instance) {
                        this
                        .filter_instance
                        .tell_search_video_html(request.result,
                                                request.video_id,
                                                request.html);
                    }
                } else
                if (request.command == MessageUtil.command_search_playlist()) {
                    if (this.filter_instance) {
                        this
                        .filter_instance
                        .tell_search_playlist_html(request.result,
                                                   request.list_id,
                                                   request.html);
                    }
                } else
                if (request.command == MessageUtil.command_mute_channel_id()) {
                    const update
                        = this.storage.add_channel_id_mute_with_check(request.channel_id,
                                                                      request.channel);
                    if (update && request.tab_active) {
                        this.storage.save().then(()=>{
                            if (this.storage.json.active) {
                                this.filter_instance.clear_marker();
                                this.filter_instance.filtering();
                            }
                            MessageUtil.send_message(
                                {command:MessageUtil.command_add_mute_id()});
                        });
                    }
                } else
                if (request.command == MessageUtil.command_mute_comment_id()) {
                    const update
                        = this.storage.add_comment_id_mute_with_check(request.channel_id);
                    if (update && request.tab_active) {
                        this.storage.save().then(()=>{
                            this.storage.update_text();
                            if (this.storage.json.active) {
                                this.filter_instance.filtering_comments();
                            }
                            MessageUtil.send_message(
                                {command:MessageUtil.command_add_mute_id()});
                        });
                    }
                } else
                if (request.command == MessageUtil.command_reset_contextmenu()) {
                    this.filter_instance.reset_contextmenu();
                }
                return true;
            }
        );
    }

    callback_domloaded() {
        const loc = new urlWrapper(location.href);
        if (loc.in_youtube()) {
            this.filter_instance = new YoutubeFilter(this.storage);
        } else if (loc.in_google()) {
            this.filter_instance = new GoogleFilter(this.storage);
        } else {
            return;
        }
        //
        this.filter_instance.callback_domloaded();
    }

    load() {
        this.storage = new StorageData();
        this.storage.load().then(() => {
            this.storage_loaded = true;
            if (this.dom_content_loaded) {
                this.callback_domloaded();
            }
        });
    }

    kick() {
        MessageUtil.send_message({command:MessageUtil.command_start_content()});
        this.load();
    }

    constructor() {
        this.filter_instance = null;
        this.storage_loaded = false;
        this.dom_content_loaded = false;
        //
        this.initialize();
        this.kick();
        document.addEventListener("DOMContentLoaded", ()=> {
            this.dom_content_loaded = true;
            if (this.storage_loaded) {
                this.callback_domloaded();
            }
        });
    }
}


var gContent = new Content();
