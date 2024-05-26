/*!
 *  @brief  click時にfrontへ送り返すミュート対象情報
 *  @note   v3対応でinstance化できなくなったのでstorageに入れる
 *  @note   (global-workも併用)
 */
class MuteParam {
    constructor(click_command = '', channel_id = '', channel = '') {
        this.click_command = click_command;
        this.channel_id = channel_id;
        this.channel = channel;
    }
}

/*!
 *  @brief  右クリックメニュー制御(background側)
 *  @note   実務者
 *  @note   itemを複数登録すると階層化されてしまう(余計なお世話すぎる)ので
 *  @note   1itemを使い回す、美しくない構成にせざるを得ない
 */
class BGContextMenuController {

    /*!
     *  @brief  メニューID
     *  @note   拡張機能IDを使用する(unique保証されてるので)
     */
    static menu_id() {
        return MessageUtil.extention_id();
    }
    static STORAGE_KEY = "MuteParam";

    /*!
     *  @brief  onMessageコールバック
     *  @param  request
     */
    static on_message(request) {
        const menusid = BGContextMenuController.menu_id();
        if (request.title == null) {
            chrome.contextMenus.update(menusid, { 
                "visible": false
            });
        } else {
            const param = new MuteParam(request.click_command,
                                        request.channel_id,
                                        request.channel);
            if (param.click_command != gMuteParam.click_command ||
                param.channel_id != gMuteParam.channel_id ||
                param.channel != gMuteParam.channel)
            {
                gMuteParam = param;
                let mute_obj = {};
                mute_obj[BGContextMenuController.STORAGE_KEY] = gMuteParam;
                chrome.storage.local.set(mute_obj);
            }
            //
            chrome.contextMenus.update(menusid, {
                "title": request.title,
                "visible": true
            });
        }                                                
    }

    /*!
     *  @brief  固有右クリックメニュー登録
     */
    static create_menu() {
        chrome.contextMenus.create({
            "title": "<null>",
            "id": BGContextMenuController.menu_id(),
            "type": "normal",
            "contexts" : ["all"],
            "visible" : true,
        }, ()=>{ /*chrome.untime.lastError;*/ });
    }

    static add_listener() {
        chrome.contextMenus.onClicked.addListener((info)=> {
            if (info.menuItemId != BGContextMenuController.menu_id()) {
                return;
            }
            BGMessageSender.send_reply({command: gMuteParam.click_command,
                                        channel_id: gMuteParam.channel_id,
                                        channel: gMuteParam.channel});
        });
        chrome.tabs.onActivated.addListener((active_info)=> {
            // tabが切り替わったら追加項目を非表示化する
            // 拡張機能管轄外のtabで追加項目が出しっぱなしになるため
            const menusid = BGContextMenuController.menu_id();
            chrome.contextMenus.update(menusid, {
                "visible": false
            });
            BGMessageSender.send_reply(
                {command: MessageUtil.command_reset_contextmenu()}, null, true);
        });        
        chrome.tabs.onUpdated.addListener((info)=> {
            // 管轄のtabがupdateされたら追加項目を非表示化する
            // 拡張機能管轄外のURLへ移動した際、出っぱなしになるため
            const menusid = BGContextMenuController.menu_id();
            chrome.contextMenus.update(menusid, {
                "visible": false
            });
            BGMessageSender.send_reply(
                {command: MessageUtil.command_reset_contextmenu()}, null, true);
        });
    }
}

var gMuteParam = new MuteParam();
{
    const stkey = BGContextMenuController.STORAGE_KEY;
    chrome.storage.local.get(stkey, (item)=>{
        if (item != null) {
            if (gMuteParam.channel_id == '' && gMuteParam.channel == '') {
                const param = item[stkey];
                if (param != null) {
                    gMuteParam = param;
                }
            }
        }
    });
}
