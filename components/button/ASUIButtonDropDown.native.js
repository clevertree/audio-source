import ASUIDropDownContainer from "../menu/dropdown/ASUIDropDownContainer";
import React from "react";
import PropTypes from "prop-types";
import {ImageBackground, Text} from "react-native";
import ASUIClickableBase from "./ASUIClickableBase";
import ASUIMenuContext from "../menu/ASUIMenuContext";

import styles from "./ASUIButton.style";

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


    renderChildren(props = {key:"children"}) {
        let arrow = this.props.arrow === true ? (this.props.vertical ? '▼' : '►') : this.props.arrow;
        return <ImageBackground
                source={require('./assets/img/bg.png')}
                style={styles.container}
            >
            {super.renderChildren(props)}
            {arrow ? <Text key="arrow" style={styles.arrow}>{arrow}</Text> : null}
            <ASUIDropDownContainer
                key="dropdown"
                ref={this.dropdown}
                disabled={this.props.disabled}
                options={this.props.options}
                vertical={this.props.vertical}
            />
        </ImageBackground>;
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
