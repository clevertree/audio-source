import React from "react";

import "./assets/Panel.css";
class Panel extends React.Component {

    render() {
        let className = "asp-panel";
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
export default Panel;
