import PropTypes from "prop-types";
import ASUIClickable from "../../clickable/ASUIClickable";

import "../item/ASUIMenuItem.css"
import "./ASUIMenuAction.css"

class ASUIMenuAction extends ASUIClickable {
    /** Property validation **/
    static propTypes = {
        onAction: PropTypes.func.isRequired,
        disabled: PropTypes.bool,
    };

    getClassName() { return super.getClassName() + ' asui-menu-item action'; }


}

export default ASUIMenuAction;

