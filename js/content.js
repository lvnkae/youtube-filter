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
                if (request.command == MessageUtil.command_mute_channel_id()) {
                    const update
                        = this.storage.add_channel_id_mute_with_check(request.channel_id,
                                                                      request.channel);
                    if (update && request.tab_active) {
                        this.storage.save();
                        if (this.storage.json.active) {
                            this.filter_instance.clear_marker();
                            this.filter_instance.filtering();
                        }
                    }
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
            document.addEventListener("DOMContentLoaded", ()=> {
                this.callback_domloaded();
            });
        });
    }

    kick() {
        MessageUtil.send_message({command:MessageUtil.command_start_content()});
        this.load();
    }

    constructor() {
        this.filter_instance = null;
        this.initialize();
        this.kick();
    }
}


var gContent = new Content();
