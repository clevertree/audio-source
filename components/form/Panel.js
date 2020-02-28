import React from "react";
import "./assets/Panel.css"

class Panel extends React.Component {
    render() {
        let className = 'asui-panel';
        if(this.props.className)
            className += ' ' + this.props.className;

        let children = this.props.children;
        if(typeof children === "function")
            children = children(this);

        return (
            <div className={className}>
                {this.props.title ? <div className="title">{this.props.title}</div> : null}
                {children}
            </div>
        )
    }
}
/** Export this script **/
export default Panel;
