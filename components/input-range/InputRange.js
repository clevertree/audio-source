import React from "react";
import "./assets/InputRange.scss";

class InputRange extends React.Component {
    constructor(props = {}) {
        super(props);
        this.state = {
            value: props.value
        }
    }

    get value() { return this.state.value; }
    set value(newValue) {
        this.setState({value: newValue});
    }

    onChange(e) {
        const newValue = parseFloat(e.target.value);
        this.setState({value: newValue});
        this.props.onChange
        ? this.props.onChange(e, newValue)
        : console.warn("Input range has no onChange prop", this);
    }

    render() {
        console.log('InputRange');
        let className = "asui-input-range";
        if(this.props.className)
            className += ' ' + this.props.className;

        return (
            <input
                className={className}
                type="range"
                value={this.state.value}
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
