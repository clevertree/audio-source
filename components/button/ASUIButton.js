import PropTypes from 'prop-types';

import ASUIClickable from "./ASUIClickable";

export default class ASUIButton extends ASUIClickable {

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
        const result = await this.props.onAction(e, this);
        if (result !== false)
            this.closeAllDropDownMenus();
    }


}

