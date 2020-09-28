import React from "react";
import PropTypes from "prop-types";

import "./assets/ASUIInputRange.css";

export default class ASUIInputRange extends React.Component {
    /** Default Properties **/
    static defaultProps = {
    };

    /** Property validation **/
    static propTypes = {
        onChange: PropTypes.func.isRequired,
        onMouseUp: PropTypes.func,
        format: PropTypes.func,
    };

    static formats = {
        percent: value => `${Math.round(value*100)/100}%`
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(prevProps.value !== this.props.value) {
            this.setState({value: this.props.value});
        }
    }

    constructor(props = {}) {
        super(props);
        this.cb = {
            onChange: e => this.onChange(e),
            onMouseUp: e => this.onClick(e),
        };
        this.state = {
            value: this.props.value
        }
    }

    onClick(e) {
        e.preventDefault();
        const newValue = parseFloat(e.target.value);
        this.props.onChange(newValue);
        // e.preventDefault();
        // this.closeAllOpenMenus();
    }

    onChange(e) {
        // console.log(e);
        e.preventDefault();
        const newValue = parseFloat(e.target.value);
        this.props.onChange(newValue)
        this.setState({value: newValue});
    }

    render() {
        const value = this.state.value;
        let title = "Value: " + value;
        if(this.props.format)
            title = this.props.format(value);
        let className = "asui-input-range";
        if(this.props.className)
            className += ' ' + this.props.className;
        if(this.props.size)
            className += ' ' + this.props.size;
        if((value - this.props.min) / (this.props.max - this.props.min) < 0.4)
            className += ' value-right';
        return <div
            className={className}
            >
            <div
                className="value"
                children={title}
                />
            <input
                key="input"
                type="range"
                value={value}
                onChange={this.cb.onChange}
                onMouseUp={this.cb.onMouseUp}
                min={this.props.min}
                max={this.props.max}
                step={this.props.step}
                name={this.props.name}
                title={title}
                />
        </div>;
    }


}
