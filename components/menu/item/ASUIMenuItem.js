import ASUIClickable from "../../clickable/ASUIClickable";

import './style/ASUIMenuItem.css';

export default class ASUIMenuItem extends ASUIClickable {
    getClassName() { return 'asui-menu-item'; }

    /** Actions **/

    async doAction(e) {
        console.info(this.constructor.name + " has no action.");
    }
}
