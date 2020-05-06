import {ASUIMenuDropDown} from "../menu/";
import "./assets/ASUIButton.css"
import ASUIButtonBase from "./ASUIButtonBase.native";
import PropTypes from "prop-types";
import React from "react";
import ASUIDropDownContainer from "../menu/dropdown/ASUIDropDownContainer.native";

export default class ASUIButtonDropDown extends ASUIButtonBase {
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


    renderChildren(props = {}) {
        let arrow = this.props.arrow === true ? (this.props.vertical ? '▼' : '►') : this.props.arrow;
        return [
            super.renderChildren(props),
            arrow ? <div className="arrow">{arrow}</div> : null,
            <ASUIDropDownContainer
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
}
