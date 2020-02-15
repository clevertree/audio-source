import React from "react";
import ASUIDiv from "./ASUIDiv";
// import ASUIIcon from "../../common/ui/asui-icon";
// import ASUIMenu from "../../common/ui/asui-menu";

class ASUIInputFile extends React.Component {
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
export default ASUIInputFile;
