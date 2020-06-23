import PropTypes from "prop-types";
import ASUIClickableDropDown from "../../clickable/ASUIClickableDropDown";

import "../style/ASUIMenu.css";

export default class ASUIMenuDropDown extends ASUIClickableDropDown {

    // Default Properties
    static defaultProps = {
        arrow:          true,
        vertical:       false,
        // openOverlay:    false
    };

    // Property validation
    static propTypes = {
        options: PropTypes.any.isRequired,
    };


    getClassName() {
        return 'asui-menu-item ' + super.getClassName();
    }
}
