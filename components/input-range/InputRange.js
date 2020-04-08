import React from "react";
import "./assets/InputRange.scss";

class InputRange extends React.Component {
    constructor(props = {}) {
        super(props);
        this.cb = {
            onChange: e => this.onChange(e),
            onClick: e => this.onClick(e),
        }
    }

    onClick(e) {
        // e.preventDefault();
    }

    onChange(e) {
        e.preventDefault();
        const newValue = parseFloat(e.target.value);
        this.props.onChange
        ? this.props.onChange(e, newValue)
        : console.warn("Input range has no onChange prop", this);
    }

    render() {
        let className = "asui-input-range";
        if(this.props.className)
            className += ' ' + this.props.className;

        return (
            <input
                className={className}
                type="range"
                defaultValue={this.props.value}
                onChange={this.cb.onChange}
                onClick={this.cb.onClick}
                min={this.props.min}
                max={this.props.max}
                name={this.props.name}
                title={this.props.title}
                />
        )
    }

}


/** Export this script **/
export default InputRange;
