import React from "react";
import PropTypes from "prop-types";

import RangeSlider from 'rn-range-slider';

import styles from './assets/ASUIInputRange.style';


class ASUIInputRange extends React.Component {
    /** Default Properties **/
    static defaultProps = {
    };

    /** Property validation **/
    static propTypes = {
        onChange: PropTypes.func.isRequired,
    };



    constructor(props = {}) {
        super(props);
        this.cb = {
            onChange: e => this.onChange(e),
            onClick: e => this.onClick(e),
        };
    }

    onClick(e) {
        e.preventDefault();
        const newValue = parseFloat(e.target.value);
        this.props.onChange(e, newValue)
        // e.preventDefault();
    }

    onChange(e) {
        e.preventDefault();
        const newValue = parseFloat(e.target.value);
        this.props.onChange(e, newValue)
        // this.setState({value: newValue});
    }

    render() {
        const style = [styles.default];
        if(this.props.disabled)
            style.push(styles.disabled)
        return (
            <RangeSlider
                style={style}
                value={this.props.value}
                onValueChanged={this.cb.onChange}
                onClick={this.cb.onClick}
                min={this.props.min}
                max={this.props.max}
                step={this.props.step}
                name={this.props.name}
                title={this.props.title}
                />
        )
    }

}


/** Export this script **/
export default ASUIInputRange;
