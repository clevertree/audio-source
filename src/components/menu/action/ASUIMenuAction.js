import ASUIClickable from "../../clickable/ASUIClickable";

import "../item/ASUIMenuItem.css"
import "./ASUIMenuAction.css"

class ASUIMenuAction extends ASUIClickable {

    getClassName() { return super.getClassName() + ' asui-menu-item action'; }


}

export default ASUIMenuAction;

