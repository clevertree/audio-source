import React from "react";

import "./assets/Form.css"
class Form extends React.Component {

    render() {
        let className = "asc-form";
        if(this.props.className)
            className += ' ' + this.props.className;

        return (
            <div className={className}>
                {this.props.title ? <div className="title">{this.props.title}</div> : null}
                {this.props.children}
            </div>
        )
    }
}
/** Export this script **/
export default Form;
