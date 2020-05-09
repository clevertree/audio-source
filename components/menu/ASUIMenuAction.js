import ASUIClickableBase from "../button/ASUIClickableBase";

import './assets/ASUIMenu.css';
import PropTypes from "prop-types";

class ASUIMenuAction extends ASUIClickableBase {
    /** Property validation **/
    static propTypes = {
        onAction: PropTypes.func.isRequired,
        disabled: PropTypes.bool,
    };

    getClassName() { return 'asui-menu-item'; }

    /** Actions **/

    async doAction(e) {
        if(this.props.disabled) {
            console.warn(this.constructor.name + " is disabled.", this);
            return;
        }

        if(!this.props.onAction)
            throw new Error("Button does not contain props 'onAction'");
        const result = await this.props.onAction(e, this);
        if (result !== false)
            this.closeAllDropDownMenus();
    }
}

export default ASUIMenuAction;

