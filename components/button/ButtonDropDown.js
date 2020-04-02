import MenuDropDown from "../menu/MenuDropDown";
import "./assets/Button.css"

export default class ButtonDropDown extends MenuDropDown {
    // Default Properties
    static defaultProps = {
        arrow:          true,
        vertical:       true,
    };
    getClassName() { return 'asui-button'; }
}
