import React from "react";

import "./assets/Panel.css";
class Panel extends React.Component {

    render() {
        let className = "asc-panel";
        if(this.props.className)
            className += ' ' + this.props.className;

        let children = this.props.children;
        if(typeof children === "function")
            children = children(this);
        // console.log('children', children);

        return (
            <div className={className}>
                {this.props.title ? <div className="title">{this.props.title}</div> : null}
                <div className="container">
                    {children}
                </div>
            </div>
        )
    }
}
/** Export this script **/
export default Panel;
