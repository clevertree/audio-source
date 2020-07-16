import React from "react";
import {Text, TouchableHighlight, View} from "react-native";
import GlobalStyle from "../../common/style/GlobalStyle";
import ASUIClickableBase from "./ASUIClickableBase";
import PropTypes from "prop-types";

export default class ASUIClickable extends ASUIClickableBase {

    /** Property validation **/
    static propTypes = {
        onAction: PropTypes.func.isRequired,
        disabled: PropTypes.bool,
    };

    getContainerStyle() {
        let style = [];
        if(this.props.style)
            style.push(this.props.style);
        return style;
    }

    render() {
        return (
            <TouchableHighlight
                onPress={this.cb.onMouseInput}
                onLongPress={this.cb.onMouseInput}
                children={this.renderContainer()}
            />
        );
    }

    renderContainer() {
        const style = this.getContainerStyle();
        return <View
            style={style}
            children={this.renderChildren()}
        />
    }

    renderChildren() {
        let children = this.props.children;
        if(typeof children !== 'object')
            children = <Text children={children} style={this.getTextStyle()} numberOfLines={1} />;
        return children;
    }

    getTextStyle() {
        return GlobalStyle.getDefaultTextStyle();
    }

}
