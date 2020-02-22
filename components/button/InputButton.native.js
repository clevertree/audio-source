import React from "react";

class Button extends React.Component {
    render() {
        const React = require('react');
        const {View, TouchableHighlight} = require('react-native');
        return React.createElement(View, this.props,
            React.createElement(TouchableHighlight, {
                onPress: this.props.onAction
            }, this.getChildren())
        );
    }
}

/** Export this script **/
export default Button;
