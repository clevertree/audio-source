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


    /** Actions **/

    async doAction(e) {
        if(this.props.disabled) {
            console.warn(this.constructor.name + " is disabled.");
            return;
        }

        if(!this.props.onAction)
            throw new Error("Button does not contain props 'onAction'");
        const result = await this.props.onAction(e, this);
        if (result !== false)
            this.closeAllOpenMenus();
    }

}

export default ASUIMenuAction;

