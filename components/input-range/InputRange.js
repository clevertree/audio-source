import React from "react";
import "./assets/InputRange.scss";

class InputRange extends React.Component {
    constructor(props = {}) {
        super(props);
    }


    onChange(e) {
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
                onChange={e => this.onChange(e)}
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
