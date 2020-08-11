import PropTypes from 'prop-types';
import ASUIClickable from "../clickable/ASUIClickable";

export default class ASUIButton extends ASUIClickable {

    /** Default Properties **/
    static defaultProps = {
    };

    /** Property validation **/
    static propTypes = {
        onAction: PropTypes.func.isRequired,
        disabled: PropTypes.bool,
    };

    getClassName() { return 'asui-button ' + super.getClassName(); }


}

