import {MenuItem} from "./MenuItem";

import "./assets/Button.css"

class Button extends MenuItem {

    getClassName() { return 'asui-menu asui-button'; }
}


export default Button;

/** Default props **/
Button.defaultProps = {
    // arrow:          '▼',
    vertical:       true,
};

Button.propTypes = MenuItem.propTypes;


