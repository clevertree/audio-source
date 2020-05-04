import React from "react";
import PropTypes from "prop-types";

import {Text, View} from 'react-native';

import styles from './assets/ASUIPanel.style';

export default class ASUIPanel extends React.Component {
    /** Default Properties **/
    static defaultProps = {
    };

    /** Property validation **/
    static propTypes = {
        className: PropTypes.string,
        header: PropTypes.any,
        // children: PropTypes.required,
    };

    render() {
        const style = [styles.default];
        if(this.props.disabled)
            style.push(styles.disabled)

        return (
            <View
                style={style}
                >
                {this.props.header ? <View style={styles.header}>{textify(this.props.header, {style: styles.headerText})}</View> : null}
                <View style={this.props.styleContainer || styles.container}>{textify(this.props.children)}</View>
            </View>
        )
    }
}

function textify(content, props={}) {
    return typeof content !== "object" ? <Text children={content} {...props}/> : content;
}
