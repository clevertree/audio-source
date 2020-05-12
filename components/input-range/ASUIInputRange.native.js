import React from "react";
import {StyleSheet, View} from "react-native";
import PropTypes from "prop-types";

import MultiSlider from "@ptomasroos/react-native-multi-slider";
// import RangeSlider from 'rn-range-slider';
// import { Knob } from 'react-native-knob';


export default class ASUIInputRange extends React.Component {
    /** Default Properties **/
    static defaultProps = {
        min: 0,
        max: 100,
        step: 1,
    };

    /** Property validation **/
    static propTypes = {
        onChange: PropTypes.func.isRequired,
        min: PropTypes.number.isRequired,
        max: PropTypes.number.isRequired,
        step: PropTypes.number.isRequired,
    };



    constructor(props = {}) {
        super(props);
        this.cb = {
            onChange: e => this.onChange(e),
            onClick: e => this.onClick(e),
        };
    }

    onClick(e) {
        const newValue = parseFloat(e.target.value);
        this.props.onChange(e, newValue)
        // e.preventDefault();
    }

    onChange(values) {
        console.log('ASUIInputRange.onChange', values);
        this.props.onChange(values[0])
        // this.setState({value: newValue});
    }

    render() {
        return (
            <MultiSlider
                containerStyle={styles.containerStyle}
                trackStyle={styles.trackStyle}
                sliderLength={80}
                onValuesChangeFinish={this.cb.onChange}
                customMarker={() => <View style={styles.customMarker} />}
                values={[this.props.value]}
                min={this.props.min}
                max={this.props.max}
                step={this.props.step}
            />
        )
    }

}


const styles = StyleSheet.create({

    default: {
    },

    customMarker: {
        borderRadius: 2,
        backgroundColor: '#666',
        marginTop: 24,
        marginLeft: 0,
        height: 25,
        width: 4,
    },

    containerStyle: {
        padding: 1,
        height: 24,
        // width: 60,
        paddingTop: 4,
        // paddingLeft: 3,
    },
    trackStyle: {
        height: 24,
    },
    // selectedStyle: {},
    // unselectedStyle: {},
    // markerContainerStyle: {},
    // markerStyle: {},
});
