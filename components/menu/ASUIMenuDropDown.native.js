import React from "react";
import { View, TouchableHighlight} from 'react-native';
import PropTypes from "prop-types";

// import ASUIDropDownContainer from "./ASUIDropDownContainer";
import styles from "./assets/ASUIDropDownContainer.style";

export default class ASUIMenuDropDown extends React.Component {
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

        this.cb = {
            onKeyDown: (e) => this.onKeyDown(e),
            onMouseInput: e => this.onMouseInput(e),
        };
        this.dropdown = React.createRef();
    }


    getClassName() { return 'asui-menu-item'; }

    render() {
        const style = [styles.default, this.props.style];
        if(this.props.disabled)
            style.push(styles.disabled)
        if(this.props.selected)
            style.push(styles.selected)

        let arrow = this.props.arrow === true ? (this.props.vertical ? '▼' : '►') : this.props.arrow;
        return (
            <TouchableHighlight
                onPress={this.cb.onMouseInput}
                onLongPress={this.cb.onMouseInput}
                >
                <View
                    style={style}
                    >

                    {this.props.children}
                    {arrow ? <div className="arrow">{arrow}</div> : null}
                    {/*<ASUIDropDownContainer*/}
                    {/*    ref={this.dropdown}*/}
                    {/*    disabled={this.props.disabled}*/}
                    {/*    options={this.props.options}*/}
                    {/*    vertical={this.props.vertical}*/}
                    {/*    />*/}
                </View>
            </TouchableHighlight>
        )
    }

    toggleMenu()    { return this.dropdown.current.toggleMenu(); }
    hoverMenu()     { return this.dropdown.current.hoverMenu(); }

    onMouseInput(e) {
        if(e.defaultPrevented)
            return;
        e.preventDefault();
        switch(e.type) {
            case 'click':
                // Try onClick handler first to avoid causing a state change within a render
                if(this.props.onClick)
                    if(this.props.onClick(e) === false)
                        return;
                this.toggleMenu();
                break;

            case 'mouseenter':
            case 'mouseover':
                this.hoverMenu();
                break;

            default:
                throw new Error("Unknown Mouse event: " + e.type);
        }
    }



    onKeyDown(e) {
        if(e.isDefaultPrevented())
            return;
        switch(e.key) {
            case ' ':
            case 'Enter':
                this.toggleMenu();
                break;

            default:
                console.info("Unhandled key: ", e.key);
                break;
        }
    }
    onMouseEnter(e) {
        this.toggleMenu();
    }

}
