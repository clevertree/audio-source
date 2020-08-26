import React from "react";
import PropTypes from "prop-types";
import {ASUIGlobalContext} from "../index";
import "./assets/ASUIPanel.css"

class ASUIPanel extends React.Component {

    /** Global Context **/
    static contextType = ASUIGlobalContext;
    getGlobalContext()          { return this.context; }
    // setStatus(message)          { this.context.addLogEntry(message); }
    // setError(message)           { this.context.addLogEntry(message, 'error'); }
    getViewMode(viewKey)        { return this.context.getViewMode('panel:' + viewKey); }
    setViewMode(viewKey, mode)  { return this.context.setViewMode('panel:' + viewKey, mode); }

    /** Default Properties **/
    static defaultProps = {
    };

    /** Property validation **/
    static propTypes = {
        className: PropTypes.string,
        header: PropTypes.any,
    };

    constructor(props) {
        super(props);
        this.cb = {
            onClick: () => this.toggleViewMode()
        }
    }

    /** Actions **/

    toggleViewMode() {
        const viewKey = this.props.className;
        if(!viewKey)
            return console.warn("Invalid className prop");
        let viewMode = this.getViewMode(viewKey);
        viewMode = viewMode === 'minimized' ? null : 'minimized';
        this.setViewMode(viewKey, viewMode);
    }

    /** Render **/

    render() {
        let className = 'asui-panel';
        let viewMode = null;
        if(this.props.className) {
            className += ' ' + this.props.className;
            viewMode = this.getViewMode(this.props.className);
            // console.log('viewMode', this.props.className, viewMode);
        }

        if(viewMode === false)
            return null;
        if(viewMode === 'minimized')
            className += ' minimized';

        return (
            <div className={`${className}`}>
                <div className="header"
                     title={this.props.title}
                     onClick={this.cb.onClick}
                >{this.props.header}</div>
                {viewMode !== 'minimized' ? <div className="container">
                    {this.props.children}
                </div> : null}
            </div>
        )
    }
}
/** Export this script **/
export default ASUIPanel;
