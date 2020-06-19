import React from "react";
import PropTypes from "prop-types";
import ASUIDropDownContainer from "../menu/dropdown/ASUIDropDownContainer";
import ASUIClickable from "./ASUIClickable";

import "./assets/ASUIButton.css"

export default class ASUIButtonDropDown extends ASUIClickable {

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
        // this.dropdown = React.createRef();
        this.state = {
            open: false,
            stick: false
        }
    }

    getClassName() { return 'asui-button dropdown'; }


    renderChildren(props = {}) {
        let arrow = this.props.arrow === true ? (this.props.vertical ? '▼' : '►') : this.props.arrow;
        return [
            super.renderChildren(props),
            arrow ? <div className="arrow" key="arrow">{arrow}</div> : null,
            (this.state.open ? <ASUIDropDownContainer
                key="dropdown"
                // ref={this.dropdown}
                // disabled={this.props.disabled}
                options={this.props.options}
                vertical={this.props.vertical}
                onClose={() => this.closeDropDownMenu()}
            /> : null)
        ];
    }


    openDropDownMenu() {
        this.setState({open: true, stick: false});
    }

    stickDropDown() {
        this.setState({open: true, stick: true});
    }

    closeDropDownMenu() {
        this.setState({open: false, stick: false});
    }


    toggleMenu() {
        if (!this.state.open)
            this.openDropDownMenu();
        else if (!this.state.stick)
            this.stickDropDown();
        else
            this.closeDropDownMenu();
    }

    doAction(e) {
        this.toggleMenu();
    }


}
