/*!
 *  @brief  右クリックメニュー制御(ベース)
 */
class ContextMenuController {

    static TYPE_IGNORE = -1;
    static TYPE_NONE = 0;

    /*!
     *  @brief  各種バッファのクリア
     */
    clear() {
        this.monitoring_target = null;
        this.monitoring_target_base = null;
        this.context_menu = { channel_id:null };
    }

    /*!
     *  @brief  右クリックメニューの「${channel}をミュート」を有効化
     *  @param  element
     */
    on_usermute(element) {
        const channel = this.get_channel(element);
        if (channel == null) {
            return false;
        }
        const channel_id = YoutubeUtil.get_renderer_node_channel_id(element);
        if (channel_id == null) {
            return false;
        }
        if (channel_id == this.context_menu.channel_id) {
            return true; // 前回と同じなので不要
        }
        const max_disp_channel = 32;
        const channel_st = channel.slice(0, max_disp_channel-1);
        this.context_menu.channel_id = channel_id;
        const title = `${channel_st}をミュート`;
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
    off_original_menu() {
        if (null == this.context_menu.channel_id) {
            return true; // 前回と同じなので不要
        }
        this.context_menu.channel_id = null;
        MessageUtil.send_message({
            command: MessageUtil.command_update_contextmenu(),
        });
    }

    update_context_menu(ret) {
        if (this.filter_active) {
            if (this.monitoring_target_base != null &&
                this.on_mute_menu(ret.type, this.monitoring_target_base)) {
                return;
            }
        }
        this.off_original_menu();
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
        // ※service_workerでは'mousedown'でも間に合わないタイミングがある
        // ※cf.破棄→再生成直後(確定で間に合わない)
        // ※'mousemove'で監視対象が変化したら即updateするようにしてみる
        doc.addEventListener('mousemove', (e) => {
            if (e.target == this.monitoring_target) {
                return;
            }
            let ret = { type: ContextMenuController.TYPE_NONE, base_node:null};
            if (this.filter_active) {
                ret = this.get_base_node(new urlWrapper(location.href), e.target);
                if (ret.type == ContextMenuController.TYPE_IGNORE) {
                    return;
                }
            }
            if (ret.base_node == this.monitoring_target_base) {
                return;
            }
            this.monitoring_target = e.target;
            this.monitoring_target_base = ret.base_node;
            this.update_context_menu(ret);
        });
    }



    constructor(active) {
        this.filter_active = active;
        this.clear();
        this.enable_original_menu(document);
    }
}
