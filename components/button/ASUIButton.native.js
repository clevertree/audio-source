import React from "react";
import PropTypes from 'prop-types';

import ASUIMenuContext from "../menu/ASUIMenuContext";
import styles from './assets/ASUIButton.style';
import {Text, TouchableHighlight, View, ImageBackground} from "react-native";

// TODO: subclass Button and MenuDropDown with hover close handler
class ASUIButton extends React.Component {
    /** Context **/
    static contextType = ASUIMenuContext;

    /** Default Properties **/
    static defaultProps = {
    };

    /** Property validation **/
    static propTypes = {
        onAction: PropTypes.func.isRequired,
        disabled: PropTypes.bool,
        // selected: PropTypes.bool,
    };


    constructor(props) {
        super(props);
        this.cb = {
            onMouseInput: e => this.onMouseInput(e),
            onKeyDown: e => this.onKeyDown(e),
        };
    }

    getOverlay() { return this.context.overlay; }


    render() {
        const style = [styles.default];
        if(this.props.disabled)
            style.push(styles.disabled)
        // if(this.props.selected)
        //     style.push(styles.selected)

        return (
            <TouchableHighlight
                style={{display: 'flex'}}
                onPress={this.cb.onMouseInput}
                onLongPress={this.cb.onMouseInput}
            >
                <ImageBackground source={require('./assets/img/bg.png')} style={{}}>
                    <View
                        style={style}
                        >
                        {textify(this.props.children)}
                    </View>
                </ImageBackground>
            </TouchableHighlight>
        );
    }



    /** User Input **/

    onMouseInput(e) {
        if(e.defaultPrevented)
            return;
        e.preventDefault();
        this.doAction(e);
    }


    onKeyDown(e) {
        if(e.isDefaultPrevented())
            return;
        switch(e.key) {
            case ' ':
            case 'Enter':
                this.doAction(e);
                break;

            default:
                console.info("Unhandled key: ", e.key);
                break;
        }
    }

    /** Actions **/

    doAction(e) {
        if(this.props.disabled) {
            console.warn(this.constructor.name + " is disabled.", this);
            return;
        }

        if(!this.props.onAction)
            throw new Error("Button does not contain props 'onAction'");
        const result = this.props.onAction(e, this);
        if (result !== false)
            this.closeAllDropDownMenus();
    }


    closeAllDropDownMenus() {
        if(this.getOverlay())
            this.getOverlay().closeAllMenus();
    }
}




export default ASUIButton;


function textify(content, props={}) {
    return typeof content === "string" ? <Text children={content} {...props}/> : content;
}
