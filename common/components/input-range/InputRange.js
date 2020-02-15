import React from "react";


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

    async onChange(e) {
        this.props.onChange(e, this.state.value);
    }

    render() {
        return (
            <input
                type="range"
                value={this.state.value}
                onChange={this.props.onChange}
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
