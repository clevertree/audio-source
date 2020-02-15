import React from "react";

class ASPUIForm extends React.Component {

    render() {

        return (
            <div className="aspui-form">
                <div className="title">{this.props.title}</div>
                {this.props.children}
            </div>
        )
    }
}
/** Export this script **/
export default ASPUIForm;
