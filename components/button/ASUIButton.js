import PropTypes from 'prop-types';

import ASUIClickableBase from "./ASUIClickableBase";

export default class ASUIButton extends ASUIClickableBase {

    /** Default Properties **/
    static defaultProps = {
    };

    /** Property validation **/
    static propTypes = {
        onAction: PropTypes.func.isRequired,
        disabled: PropTypes.bool,
    };

    getClassName() { return 'asui-button'; }


    /** Actions **/

    async doAction(e) {
        if(this.props.disabled) {
            console.warn(this.constructor.name + " is disabled.");
            return;
        }

        if(!this.props.onAction)
            throw new Error("Button does not contain props 'onAction'");
        await this.props.onAction(e, this);
        // const result = if (result !== false)
        //     this.closeAllDropDownMenus();
    }


}

