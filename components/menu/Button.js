import {MenuItem} from "./MenuItem";

import "./assets/Button.css"
import PropTypes from "prop-types";

class Button extends MenuItem {

    getClassName() { return 'asui-button'; }
}


export default Button;

/** Default props **/
Button.defaultProps = {
    // arrow:          '▼',
    vertical:       true,
};


// validating prop types
Button.propTypes = {
    options: PropTypes.any,
    disabled: PropTypes.bool,
    vertical: PropTypes.bool,
};
