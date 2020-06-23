import PropTypes from "prop-types";

import ASUIClickableDropDown from "../clickable/ASUIClickableDropDown";
import "./assets/ASUIButton.css"

export default class ASUIButtonDropDown extends ASUIClickableDropDown {

    // Default Properties
    static defaultProps = {
        arrow:          true,
        vertical:       true,
    };

    // Property validation
    static propTypes = {
        options: PropTypes.any.isRequired,
    };

    getClassName() {
        return 'asui-button ' + super.getClassName();
    }
}
