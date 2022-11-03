/*!
 *  @brief  右クリックメニュー制御(background側)
 *  @note   実務者
 *  @note   itemを複数登録すると階層化されてしまう(余計なお世話すぎる)ので
 *  @note   1itemを使い回す、美しくない構成にせざるを得ない
 */
class BGContextMenuController extends BGMessageSender {

    /*!
     *  @brief  onMessageコールバック
     *  @param  request
     */
    on_message(request) {
        if (this.context_menu_item_id == null) {
            return;
        }
        if (request.title == null) {
            chrome.contextMenus.update(this.context_menu_item_id, { 
                "visible": false
            });
        } else {
            const click_command = request.click_command;
            if (MessageUtil.command_mute_channel_id() ||
                MessageUtil.command_mute_comment_id()) {
                const param = {click_command: click_command,
                               channel_id: request.channel_id,
                               channel: request.channel};
                this.menu_param = param;
            }
            //
            chrome.contextMenus.update(this.context_menu_item_id, {
                "title": request.title,
                "visible": true
            });
        }                                                
    }

    /*!
     *  @brief  固有右クリックメニュー登録
     *  @param  extention_id    拡張機能ID
     */
    create_menu(extention_id) {
        if (this.context_menu_item_id != null) {
            return;
        }
        // 拡張機能IDをitem_idとする(unique保証されてるので)
        this.context_menu_item_id = extention_id;
        chrome.contextMenus.create({
            "title": "<null>",
            "id": this.context_menu_item_id,
            "type": "normal",
            "contexts" : ["all"],
            "visible" : true,
            "onclick" : (info)=> {
                const click_command = this.menu_param.click_command;
                if (click_command == MessageUtil.command_mute_channel_id() ||
                    click_command == MessageUtil.command_mute_comment_id()) {
                    this.send_reply({command: click_command,
                                     channel_id: this.menu_param.channel_id,
                                     channel: this.menu_param.channel});
                }
            }
        });
        chrome.tabs.onActivated.addListener((active_info)=> {
            // tabが切り替わったら追加項目を非表示化する
            // 拡張機能管轄外のtabで追加項目が出しっぱなしになるため
            chrome.contextMenus.update(this.context_menu_item_id, {
                "visible": false
            });
        });
        chrome.tabs.onUpdated.addListener((info)=> {
            // 管轄のtabがupdateされたら追加項目を非表示化する
            // 拡張機能管轄外のURLへ移動した際、出っぱなしになるため
            if (this.is_connected_tab(info)) {
                chrome.contextMenus.update(this.context_menu_item_id, {
                    "visible": false
                });
            }
        });
    }

    /*!
     */
    constructor() {
        super();
        this.menu_param = {};
        this.context_menu_item_id = null;
    }
}
