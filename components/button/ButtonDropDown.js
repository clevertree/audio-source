import MenuDropDown from "../menu/MenuDropDown";
import "./assets/Button.css"
import "../menu/assets/MenuDropDown.css";

export default class ButtonDropDown extends MenuDropDown {
    getClassName() { return 'asui-button'; }
}
