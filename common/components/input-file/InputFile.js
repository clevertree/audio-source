import React from "react";
import Div from "../div/Div";

// import Icon from "../../common/components/asui-icon";
// import Menu from "../../common/components/asui-menu";

class InputFile extends React.Component {
    constructor(props={}) {
        super(props);
        this.state = {
            value: props.value
        }
    }


    async onChange(e) {
        this.props.onChange(e, this.state.value);
    }

    render() {
        return (
            <input
                type="file"
                value={this.state.value}
                onChange={this.props.onChange}
                name={this.props.name}
                title={this.props.title}
            />
        )
    }
}



/** Export this script **/
export default InputFile;
