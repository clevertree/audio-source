import ASUIDropDownContainer from "../menu/dropdown/ASUIDropDownContainer";
import React from "react";
import PropTypes from "prop-types";
import {ImageBackground, Text} from "react-native";
import ASUIClickable from "./ASUIClickable";

import styles from "./ASUIButton.style";

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


    renderContainer() {
        // TODO disabled={this.props.disabled}
        // if (this.state.stick)
        //     className += ' stick';

        const style = this.getContainerStyle();
        style.push(styles.container);
        let arrow = this.props.arrow === true ? (this.props.vertical ? '▼' : '►') : this.props.arrow;
        return <ImageBackground
                source={require('./assets/img/bg.png')}
                style={style}
            >
            {this.renderChildren()}
            {arrow ? <Text key="arrow" style={styles.arrow}>{arrow}</Text> : null}
            {this.state.open ? <ASUIDropDownContainer
                key="dropdown"
                ref={this.dropdown}
                options={this.props.options}
                vertical={this.props.vertical}
                onClose={() => this.closeDropDown()}
            /> : null}
        </ImageBackground>;
    }

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

    // hoverMenu() {
    //     if(this.state.open === true || !this.getOverlay() || !this.getOverlay().isHoverEnabled())
    //         return;
    //     this.openMenu();
    // }

    doAction(e) {
        this.toggleMenu();
    }

}
