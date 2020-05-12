import ASUIClickableBase from "../../button/ASUIClickableBase";

import '../style/ASUIMenu.css';

export default class ASUIMenuItem extends ASUIClickableBase {
    getClassName() { return 'asui-menu-item'; }

    /** Actions **/

    async doAction(e) {
        console.info(this.constructor.name + " has no action.");
    }
}
