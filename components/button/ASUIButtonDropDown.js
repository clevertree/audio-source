import React from "react";
import PropTypes from "prop-types";
import ASUIDropDownContainer from "../menu/dropdown/ASUIDropDownContainer";
import ASUIClickableBase from "./ASUIClickableBase";
import ASUIMenuContext from "../menu/ASUIMenuContext";

import "./assets/ASUIButton.css"

export default class ASUIButtonDropDown extends ASUIClickableBase {
    /** Menu Context **/
    static contextType = ASUIMenuContext;


    // Default Properties
    static defaultProps = {
        arrow:          true,
        vertical:       true,
    };

    // Property validation
    static propTypes = {
        options: PropTypes.any.isRequired,
    };

    constructor(props) {
        super(props);
        this.dropdown = React.createRef();
    }

    getClassName() { return 'asui-button'; }


    renderChildren(props = {}) {
        let arrow = this.props.arrow === true ? (this.props.vertical ? '▼' : '►') : this.props.arrow;
        return [
            super.renderChildren(props),
            arrow ? <div className="arrow" key="arrow">{arrow}</div> : null,
            <ASUIDropDownContainer
                key="dropdown"
                ref={this.dropdown}
                disabled={this.props.disabled}
                options={this.props.options}
                vertical={this.props.vertical}
            />
        ];
    }


    toggleMenu()    { return this.dropdown.current.toggleMenu(); }
    hoverMenu()     { return this.dropdown.current.hoverMenu(); }

    doAction(e) {
        this.toggleMenu();
    }

    /** Overlay Context **/

    getOverlay() { return this.context.overlay; }

    closeAllDropDownMenus() {
        if(this.getOverlay())
            this.getOverlay().closeAllMenus();
        else
            console.warn("Could not close all dropdown menus", this.getOverlay());
    }

}
