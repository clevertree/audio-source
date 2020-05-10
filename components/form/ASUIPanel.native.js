import React from "react";
import PropTypes from "prop-types";

import {StyleSheet, Text, View, ScrollView} from 'react-native';

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
        let style = [styles.default];
        if(this.props.style)
            style = [this.props.style];
        if(this.props.disabled)
            style.push(styles.disabled)

        return (
            <View
                style={style}
                >
                {this.props.header ? <View style={styles.header}>{textify(this.props.header, {style: styles.headerText})}</View> : null}
                <View style={this.props.styleContainer || styles.container}>
                    <ScrollView horizontal>
                        {textify(this.props.children)}
                    </ScrollView>
                </View>
            </View>
        )
    }
}

function textify(content, props={}) {
    return typeof content !== "object" ? <Text children={content} {...props}/> : content;
}

const styles = StyleSheet.create({

    default: {
        // display: 'flex',
    },

    headerText: {
        textAlign: 'center',
        color: '#FFF',
    },

    header: {
        backgroundColor: '#333',
        borderTopRightRadius: 8,
        borderTopLeftRadius: 8,

    },

    container: {
        flexDirection:'row',
    }
});
