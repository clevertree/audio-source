import React from "react";
import PropTypes from "prop-types";

import {StyleSheet, Text, View} from 'react-native';


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
    return typeof content !== "object" ? <Text children={content} {...props}/> : content;
}

const styles = StyleSheet.create({

    default: {
        backgroundColor: '#DDD',
        borderWidth: 1,
        borderLeftColor: '#FFF',
        borderTopColor: '#FFF',
        borderRightColor: '#AAA',
        borderBottomColor: '#AAA',
        // border: 1px outset #FFF,
        // padding: 0px 0px,
        // margin: 0px 0px 0px 0px,
        display: 'flex',
    },

    header: {
        paddingLeft: 2,
        paddingRight: 2,
        borderBottomColor: '#BBB',
        borderBottomWidth: 1,
        // font-size: smaller,
        // border-bottom: 1px solid #BBB,
        // margin-bottom: 1px,
        // padding: 0 3px 1px 3px,
        // height: 1em,
    },

    container: {
        flexDirection:'row',
        flexWrap:'wrap',
        // display: flex,
        // min-height: 1.4em,
    }

});
