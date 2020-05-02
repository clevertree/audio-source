import React from "react";
import PropTypes from "prop-types";

import MultiSlider from "@ptomasroos/react-native-multi-slider";
// import RangeSlider from 'rn-range-slider';
// import { Knob } from 'react-native-knob';

import styles from './assets/ASUIInputRange.style';


class ASUIInputRange extends React.Component {
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
        const style = [styles.default];
        if(this.props.disabled)
            style.push(styles.disabled)
        return (
            <MultiSlider
                containerStyle={{
                    height: 30,
                    paddingLeft: 8,
                }}
                sliderLength={40}
                onValuesChangeFinish={this.cb.onChange}
                min={this.props.min}
                max={this.props.max}
                step={this.props.step}
            />
        // <RangeSlider
        //     style={style}
        //     value={this.props.value}
        //     onValueChanged={this.cb.onChange}
        //     onClick={this.cb.onClick}
        //     min={this.props.min}
        //     max={this.props.max}
        //     step={this.props.step}
        //     name={this.props.name}
        //     title={this.props.title}
        // />
        )
    }

}


/** Export this script **/
export default ASUIInputRange;
