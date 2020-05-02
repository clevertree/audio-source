import React from "react";
import PropTypes from "prop-types";

import {Text, View} from 'react-native';

import styles from './assets/ASUIForm.style';

export default class ASUIForm extends React.Component {
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
                {this.props.header ? <View style={styles.header}>{textify(this.props.header)}</View> : null}
                <View style={styles.container}>{textify(this.props.children)}</View>
            </View>
        )
    }
}

function textify(content, props={}) {
    return typeof content === "string" ? <Text children={content} {...props}/> : content;
}
