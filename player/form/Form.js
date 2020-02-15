import React from "react";

import "./assets/Form.css"
class Form extends React.Component {

    render() {
        let className = "asp-form";
        if(this.props.className)
            className += ' ' + this.props.className;

        return (
            <div className={className}>
                <div className="title">{this.props.title}</div>
                {this.props.children}
            </div>
        )
    }
}
/** Export this script **/
export default Form;
