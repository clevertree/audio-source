import React from "react";
import PropTypes from "prop-types";
import "./assets/Panel.css"

class Panel extends React.Component {
    /** Default Properties **/
    static defaultProps = {
    };

    /** Property validation **/
    static propTypes = {
        className: PropTypes.string,
        header: PropTypes.any,
    };

    render() {
        let className = 'asui-panel';
        if(this.props.className)
            className += ' ' + this.props.className;

        let children = this.props.children;
        if(typeof children === "function")
            children = children(this);

        return (
            <div
                {...this.props}
                className={className}
                >
                {this.props.header ? <div className="header">{this.props.header}</div> : null}
                {children}
            </div>
        )
    }
}
/** Export this script **/
export default Panel;
