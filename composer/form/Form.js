import React from "react";

import "./assets/Form.css"
class Form extends React.Component {

    render() {
        let className = "asc-form";
        if(this.props.className)
            className += ' ' + this.props.className;

        let children = this.props.children;
        if(typeof children === "function")
            children = children(this);

        return (
            <div key={this.props.key} className={className}>
                {this.props.title ? <div className="title">{this.props.title}</div> : null}
                {children}
            </div>
        )
    }
}
/** Export this script **/
export default Form;
