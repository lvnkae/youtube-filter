/*!
 *  @brief  右クリックメニュー制御(google用)
 */
class ContextMenuController_Google extends ContextMenuController {

    /*!
     *  @brief  event:右クリック
     *  @param  loc     現在location(urlWrapper)
     *  @param  target  右クリックされたelement
     */
    event_mouse_right_click(loc, element) {
        if (!loc.in_google()) {
            return;
        }
        if (this.filter_active) {
            //const nd_user = this.get_tweet_user_node(element);
            if (1) {//nd_user.length == 0) {
                ContextMenuController.off_original_menu();
            } else {
                ContextMenuController.on_usermute(nd_user);
            }
        } else {
            ContextMenuController.off_original_menu();
        }
    }

    /*!
     */
    constructor(active) {
        super();
        this.filter_active = true;
    }
}
