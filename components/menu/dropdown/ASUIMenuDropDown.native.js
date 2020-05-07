import React from "react";
import {View, TouchableHighlight, Text, ImageBackground, StyleSheet} from 'react-native';
import PropTypes from "prop-types";
import ASUIDropDownContainer from "./ASUIDropDownContainer.native";
import ASUIClickableBase from "../../button/ASUIClickableBase";

import styles from "../ASUIMenu.style"

export default class ASUIMenuDropDown extends ASUIClickableBase {
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
        let style = [styles.container];
        if(this.props.style)
            style.push(this.props.style);

        let arrow = this.props.arrow === true ? (this.props.vertical ? '▼' : '►') : this.props.arrow;
        return <View
            style={style}
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
        </View>;
    }


    toggleMenu()    { return this.dropdown.current.toggleMenu(); }
    hoverMenu()     { return this.dropdown.current.hoverMenu(); }

    doAction(e) {
        console.log(e);
        this.toggleMenu();
    }
}
