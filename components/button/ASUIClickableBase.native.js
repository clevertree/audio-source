import React from "react";
import {Text, TouchableHighlight, View} from "react-native";

export default class ASUIClickableBase extends React.Component {
    constructor(props) {
        super(props);
        this.cb = {
            onMouseInput: e => this.onMouseInput(e),
            onKeyDown: e => this.onKeyDown(e),
        };
    }


    render() {

        return (
            <TouchableHighlight
                onPress={this.cb.onMouseInput}
                onLongPress={this.cb.onMouseInput}
            >
                <View
                    children={this.renderChildren()}
                    />
            </TouchableHighlight>
        );
    }

    renderChildren(textProps={}) {
        let children = this.props.children;
        if(typeof children !== 'object')
            children = <Text children={children} {...textProps} />;
        return children;
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
        throw new Error("Not implemented");
    }

}
