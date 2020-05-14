import React from 'react';
import PropTypes from "prop-types";

import {View, Image, StyleSheet} from 'react-native';

import IconList from "./assets/IconList";

/** Icon **/
export default class ASUIIcon extends React.Component {

    /** Property validation **/
    static propTypes = {
        source: PropTypes.any.isRequired,
    };


    constructor(props = {}) {
        super(props, {});
    }

    render() {
        let style = styles.default;
        if(this.props.size)
            style = styles[this.props.size];


        let source = this.props.source;
        if(typeof source === "string")
            source = new IconList().getSource(source);
        return <Image style={style} source={source}/>;
    }
}


const styles = StyleSheet.create({
    container: {
    },

    default: {
        width: 24,
        height: 24
    },

    large: {
        width: 48,
        height: 48
    },

    small: {
        width: 16,
        height: 16
    }


});
