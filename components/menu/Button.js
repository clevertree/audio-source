import {Menu, MenuHorizontal} from "./Menu";

import "./assets/Button.css"

class Button extends Menu {

    getClassName() { return 'asui-menu asui-button'; }
}


export default Button;

/** Default props **/
Button.defaultProps = {
    // arrow:          '▼',
    vertical:       true,
};

Button.propTypes = Menu.propTypes;


