import React from "react";
import {View, Text} from 'react-native';
import PropTypes from "prop-types";
import ASUIDropDownContainer from "../dropdown/ASUIDropDownContainer";
import ASUIClickableBase from "../../button/ASUIClickableBase";

import styles from "../style/ASUIMenu.style"

export default class ASUIMenuDropDown extends ASUIClickableBase {

    // Default Properties
    static defaultProps = {
        arrow:          true,
        vertical:       false,
    };

    // Property validation
    static propTypes = {
        options: PropTypes.any.isRequired,
    };

    constructor(props) {
        super(props);
        this.dropdown = React.createRef();
    }


    renderContainer() {
        const style = this.getContainerStyle();
        style.push(styles.container);
        let arrow = this.props.arrow === true ? (this.props.vertical ? '▼' : '►') : this.props.arrow;
        return <View
            style={style}
            >
            {this.renderChildren()}
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
        // console.log(e);
        this.toggleMenu();
    }

    /** Overlay Context **/

    closeAllDropDownMenus()     { return this.dropdown.current.closeAllDropDownMenus(); }

}
