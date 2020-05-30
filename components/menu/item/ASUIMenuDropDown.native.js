import React from "react";
import {View, Text} from 'react-native';
import PropTypes from "prop-types";
import ASUIDropDownContainer from "../dropdown/ASUIDropDownContainer";
import ASUIClickable from "../../button/ASUIClickable";

import styles from "../style/ASUIMenu.style"

export default class ASUIMenuDropDown extends ASUIClickable {

    // Default Properties
    static defaultProps = {
        arrow:          true,
        vertical:       false,
        // openOverlay:    false
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
            {this.state.open ? <ASUIDropDownContainer
                key="dropdown"
                ref={this.dropdown}
                disabled={this.props.disabled}
                options={this.props.options}
                vertical={this.props.vertical}
                // openOverlay={this.props.openOverlay}
            /> : null}
        </View>;
    }

    /** Drop Down Menu **/

    openDropDown() {
        this.setState({open: true, stick: false});
    }

    stickDropDown() {
        this.setState({open: true, stick: true});
    }

    closeDropDown() {
        this.setState({open: false, stick: false});
    }


    toggleMenu() {
        if (!this.state.open)
            this.openDropDown();
        else if (!this.state.stick)
            this.stickDropDown();
        else
            this.closeDropDown();
    }

    hoverDropDown() {
        if(this.state.open === true || !this.getOverlay() || !this.getOverlay().isHoverEnabled())
            return;
        this.openMenu();
    }

    /** Actions **/

    doAction(e) {
        this.toggleMenu();
    }


}
