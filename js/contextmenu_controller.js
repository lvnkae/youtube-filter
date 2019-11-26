/*!
 *  @brief  右クリックメニュー制御(ベース)
 */
class ContextMenuController {

    /*!
     *  @brief  マウスの右ボタンか
     *  @param  button  ボタン情報
     */
    static is_button_right(button) {
        return button == 2;
    }

    /*!
     *  @brief  右クリックメニューの「$(channel)をミュート」を有効化
     *  @param  element
     */
    on_usermute(element) {
        const channel = this.get_channel(element);
        if (channel == null) {
            return false;
        }
        const max_disp_channel = 32;
        const channel_st = channel.slice(0, max_disp_channel-1);
        const channel_id = $(element).attr("channel_id");
        if (channel_id == null) {
            return false;
        }
        const title = channel_st + "をミュート";
        MessageUtil.send_message({
            command: MessageUtil.command_update_contextmenu(),
            click_command: MessageUtil.command_mute_channel_id(),
            title: title,
            channel_id: channel_id,
            channel: channel_st
        });
        return true;
    }
    /*!
     *  @brief  右クリックメニューの拡張機能固有項目を無効化
     */
    static off_original_menu() {
        MessageUtil.send_message({
            command: MessageUtil.command_update_contextmenu(),
        });
    }

    /*!
     *  @brief  固有メニュー無効化
     *  @param  doc     無効化対象DOM
     *  @note   document外document用(子iframeとか)
     */
    disable_original_menu(doc) {
        doc.addEventListener('mousedown', (e)=> {
            if (!ContextMenuController.is_button_right(e.button)) {
                return;
            }
            ContextMenuController.off_original_menu();
            this.monitoring_target = null;
        });
        doc.addEventListener('mousemove', (e)=> {
            if (!ContextMenuController.is_button_right(e.buttons)) {
                return;
            }
            if (null == this.monitoring_target) {
                return;
            }
            ContextMenuController.off_original_menu();
            this.monitoring_target = null;
        });
    }

    enable_original_menu(doc) {
        // 右クリックListener
        // 'contextmenu'では間に合わない
        // 'mouseup'でも間に合わないことがある(togetterのみ確認)
        // しかもMacOSでは右mouseupが発火しない(宗教が違う)らしい
        // よって
        //   'mousedown' 右ボタン押下時にcontextmenuをupdate
        //   'mousemove' 右ボタン押下+移動してたらtargetの変化を監視し再update
        // の2段Listener体制でねじ込む
        doc.addEventListener('mousedown', (e)=> {
            if (!ContextMenuController.is_button_right(e.button)) {
                return;
            }
            this.event_mouse_right_click(new urlWrapper(location.href), e.target);
            this.monitoring_target = e.target;
        });
        doc.addEventListener('mousemove', (e)=> {
            // note
            // 移動中のマウスボタン押下は"buttons"で見る
            if (!ContextMenuController.is_button_right(e.buttons)) {
                return;
            }
            if (e.target == this.monitoring_target) {
                return;
            }
            this.event_mouse_right_click(new urlWrapper(location.href), e.target);
            this.monitoring_target = e.target;
        });
    }


    constructor() {
        this.prevent = false;
        this.monitoring_target = null;
        this.enable_original_menu(document);
    }
}
