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
        this.props.onChange(e, e.target.value);
    }

    render() {
        let className = "asui-input-range" + (this.props.className ? ' ' + this.props.className : '');

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
