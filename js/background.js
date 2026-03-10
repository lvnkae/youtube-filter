/*!
 *  @brief  background.js本体
 */
class Background {
    //
    constructor() {
        this.extention_id = '';
        this.session_accessor = new BGSessionAccessor();
        //
        this.video_json_accessor
            = new BGVideoJsonAccessor(this.tell_get_json.bind(this));
        this.channel_html_accessor
            = new BGChannelHTMLAccessor(this.tell_get_channel_html.bind(this));
        this.video_searcher
            = new BGVideoSearcher(this.tell_video_searched.bind(this));
        this.playlist_searcher
            = new BGPlaylistSearcher(this.tell_playlist_searched.bind(this));
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
        this.video_json_accessor.entry_tab(tab_id);
        this.channel_html_accessor.entry_tab(tab_id);
        this.video_searcher.entry_tab(tab_id);
        this.playlist_searcher.entry_tab(tab_id);
        this.contextmenu_controller.entry_tab(tab_id);
        this.contextmenu_controller.create_menu(extention_id);
    }
    
    /*!
     *
     */
    initialize() {
        chrome.runtime.onMessage.addListener(
            (request, sender, sendResponse)=> {
                sendResponse();
                if (request.command === MessageUtil.command_video_id_to_channel_info()) {
                    this.video_id_to_channel_info(sender.tab.id, request.video_id);
                } else
                if (request.command === MessageUtil.command_author_to_channel_info()) {
                    const tab_ids = BGMessageSender.create_tab_ids(sender.tab.id);
                    this.author_to_channel_info(tab_ids, request.unique_name);
                } else
                if (request.command === MessageUtil.command_search_playlist()) {
                    this.playlist_searcher.entry(sender.tab.id, request.list_id);
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

    /*!
     *  @brief  動画idからチャンネル情報を得る
     *  @param  tab_id  要求者(tab)のID
     */
    video_id_to_channel_info(tab_id, video_id) {
        const author = this.session_accessor.video_id_to_author(video_id);
        if (author != null) {
            const tab_ids = BGMessageSender.create_tab_ids(tab_id);
            const channel_info
                = this.session_accessor.author_to_channel_info(author);
            if (channel_info != null) {
                const command = MessageUtil.command_video_id_to_channel_info();
                BGMessageSender.send_reply({command: command,
                                            result: "success",
                                            video_id: video_id,
                                            channel_info: channel_info},
                                            tab_ids);
            } else {
                this.author_to_channel_info(tab_ids, author, video_id);
            }
        } else {
            // Youtubeからjsonを得る
            this.video_json_accessor.entry(tab_id, video_id);
        }
    }

    tell_get_json(result) {
        const command = MessageUtil.command_video_id_to_channel_info();
        const tab_ids = result.tab_ids;
        const video_id = result.video_id;
        if (result.result === "unauthorized") {
            // Youtubeで動画ID検索
            this.video_searcher.entry(tab_ids, video_id);
        } else
        if (result.result === "success") {
            const ret = BGParser.parse_json(result.json);
            if (!ret.result) {
                BGMessageSender.send_reply({command: command,
                                            result: "error",
                                            video_id: video_id}, tab_ids);
            }
            const author = ret.author;
            this.session_accessor.set_channel_author(video_id, author);
            if (author.startsWith("channel/")) {
                const channel_info = { author: author,
                                        name: ret.name,
                                        id:ret.id};
                this.session_accessor.set_channel_info(author, channel_info);
                BGMessageSender.send_reply({command: command,
                                            result: "success",
                                            video_id: video_id,
                                            channel_info: channel_info}, tab_ids);
            } else {
                this.author_to_channel_info(tab_ids, author, video_id);
            }
        } else {
            BGMessageSender.send_reply({command: command,
                                        result: result.result,
                                        video_id: video_id}, tab_ids);

        }
    }

    /*!
     *  @brief  authorからチャンネル情報を得る
     *  @param  tab_ids     要求者(tab)のID群
     *  @param  author      c/custum_channel or handle
     *  @param  video_id    動画ID(json経由時以外はnull)
     */
    author_to_channel_info(tab_ids, author, video_id) {
        const channel_info = this.session_accessor.author_to_channel_info(author);
        if (channel_info != null) {
            const command = MessageUtil.command_author_to_channel_info();
            const video_ids
                = BGMessageSender.conv_video_ids(
                        BGMessageSender.create_video_ids(video_id));
            BGMessageSender.send_reply({command: command,
                                        result: "success",
                                        channel_info: channel_info,
                                        video_ids: video_ids}, tab_ids);
        } else {
            // Youtubeからchannelページhtmlを得る
            this.channel_html_accessor.entry(tab_ids, author, video_id);
        }
    }

    tell_get_channel_html(result) {
        const command = MessageUtil.command_author_to_channel_info();
        const tab_ids = result.tab_ids;
        const video_ids = BGMessageSender.conv_video_ids(result.video_ids);
        const author = result.author;
        if (result.result === "success") {
            const ret = BGParser.parse_channel_html(result.html);
            const channel_info = { author:author, name:ret.name, id:ret.id};
            this.session_accessor.set_channel_info(author, channel_info);
            BGMessageSender.send_reply({command: command,
                                        result: "success",
                                        channel_info: channel_info,
                                        video_ids: video_ids}, tab_ids);
        } else {
            BGMessageSender.send_reply({command: command,
                                        result: result.result,
                                        author: author}, tab_ids);
        }
    }

    tell_video_searched(result) {
        const command = MessageUtil.command_video_id_to_channel_info();
        const tab_ids = result.tab_ids;
        const video_id = result.video_id;
        if (result.result === "success") {
            const ret = BGParser.parse_searched_video_html(video_id, result.html);
            if (ret.success) {
                const author = ret.author;
                const channel_info = { author:author, name:ret.name, id:ret.id };
                this.session_accessor.set_channel_author(video_id, author);
                this.session_accessor.set_channel_info(author, channel_info);
                BGMessageSender.send_reply({command: command,
                                            result: "success",
                                            video_id: video_id,
                                            channel_info: channel_info}, tab_ids);
            } else {
                // 動画検索も無理なら諦める
                BGMessageSender.send_reply({command: command,
                                            result: "not_found",
                                            video_id: video_id}, tab_ids);
            }
        } else {
            BGMessageSender.send_reply({command: command,
                                        result: result.result,
                                        video_id: video_id}, tab_ids);
        }
    }

    tell_playlist_searched(result) {
        const command = MessageUtil.command_search_playlist();
        const tab_ids = result.tab_ids;
        const list_id = result.list_id;
        if (result.result === "success") {
            const ret = BGParser.parse_searched_playlist_html(list_id, result.html);
            if (ret.success) {
                const channel_info = { author:ret.author, name:ret.name, id:ret.id };
                BGMessageSender.send_reply({command: command,
                                            result: "success",
                                            list_id: list_id,
                                            channel_info: channel_info}, tab_ids);
            }
        } else {
            BGMessageSender.send_reply({command: command,
                                        result: result.result,
                                        list_id: list_id}, tab_ids);
        }
    }
}

var gBackground = new Background();
