import React from "react";
import PropTypes from "prop-types";
import "./assets/ASUIPanel.css"

class ASUIPanel extends React.Component {

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

        return (
            <div className={className}>
                {this.props.header ? <div className="header">{this.props.header}</div> : null}
                <div className="container">
                    {this.props.children}
                </div>
            </div>
        )
    }
}
/** Export this script **/
export default ASUIPanel;
