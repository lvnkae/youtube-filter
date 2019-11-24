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
     *  @brief  tweetユーザノードを得る
     *  @param  element 起点ノード
     */
    static get_channel(nd_renderer) {
        const tag = "yt-formatted-string#text.style-scope.ytd-channel-name";
        const e = YoutubeUtil.find_first_appearing_element(nd_renderer, tag);
        if (e != null) {
            const channel = $(e).text();
            if (channel.length > 0) {
                return channel;
            }
        }
        // personal_channel_video
        return YoutubeUtil.get_page_channel_name();
    }

    /*!
     *  @brief  右クリックメニューの「$(channel)をミュート」を有効化
     *  @param  nd_renderer renderノード
     */
    static on_usermute(nd_renderer) {
        if (nd_renderer.length == 0) {
            return;
        }
        const channel = ContextMenuController.get_channel(nd_renderer);
        if (channel == null) {
            return;
        }
        const max_disp_channel = 32;
        const channel_st = channel.slice(0, max_disp_channel-1);
        const channel_id = $(nd_renderer).attr("channel_id");
        const title = channel_st + "をミュート";
        MessageUtil.send_message({
            command: MessageUtil.command_update_contextmenu(),
            click_command: MessageUtil.command_mute_channel_id(),
            title: title,
            channel_id: channel_id,
            channel: channel_st
        });
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


    constructor() {
        this.prevent = false;
        this.monitoring_target = null;
        // 右クリックListener
        // 'contextmenu'では間に合わない
        // 'mouseup'でも間に合わないことがある(togetterのみ確認)
        // しかもMacOSでは右mouseupが発火しない(宗教が違う)らしい
        // よって
        //   'mousedown' 右ボタン押下時にcontextmenuをupdate
        //   'mousemove' 右ボタン押下+移動してたらtargetの変化を監視し再update
        // の2段Listener体制でねじ込む
        document.addEventListener('mousedown', (e)=> {
            if (!ContextMenuController.is_button_right(e.button)) {
                return;
            }
            this.event_mouse_right_click(new urlWrapper(location.href), e.target);
            this.monitoring_target = e.target;
        });
        document.addEventListener('mousemove', (e)=> {
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
}
