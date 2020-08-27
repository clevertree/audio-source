import React from "react";
import PropTypes from "prop-types";
import {ASUIGlobalContext} from "../index";
import ASUIIcon from "../icon/ASUIIcon";
import ASUIClickableDropDown from "../clickable/ASUIClickableDropDown";
import "./assets/ASUIPanel.css"

class ASUIPanel extends React.Component {

    /** Global Context **/
    static contextType = ASUIGlobalContext;
    getGlobalContext()          { return this.context; }
    // setStatus(message)          { this.context.addLogEntry(message); }
    // setError(message)           { this.context.addLogEntry(message, 'error'); }
    getViewMode(viewKey)        { return this.context.getViewMode('panel:' + viewKey); }
    setViewMode(viewKey, mode)  { return this.context.setViewMode('panel:' + viewKey, mode); }
    renderMenuViewMode(viewKey) { return this.context.renderMenuViewMode('panel:' + viewKey); }

    /** Default Properties **/
    static defaultProps = {
    };

    /** Property validation **/
    static propTypes = {
        viewKey: PropTypes.string,
        header: PropTypes.any,
    };

    constructor(props) {
        super(props);
        this.cb = {
            onClick: () => this.toggleViewMode(),
            renderMenuViewMode: () => this.renderMenuViewMode(this.props.viewKey)
        }
    }

    /** Actions **/

    toggleViewMode() {
        const viewKey = this.props.viewKey;
        if(!viewKey)
            return console.warn("Invalid className prop");
        let viewMode = this.getViewMode(viewKey);
        viewMode = viewMode === 'minimize' ? null : 'minimize';
        this.setViewMode(viewKey, viewMode);
    }

    /** Render **/

    render() {
        let className = 'asui-panel';
        if(this.props.className)
            className += ' ' + this.props.className;

        let viewMode = null;
        const viewKey = this.props.viewKey;
        if(viewKey) {
            viewMode = this.getViewMode(viewKey);
            className += ' ' + viewKey;
        }
        if(viewMode === 'none')
            return null;
        if(viewMode)
            className += ' ' + viewMode;

        return (
            <div className={`${className}`}>
                <div className="header"
                     title={this.props.title}
                >
                    {this.props.viewKey ? <ASUIClickableDropDown
                        className="config"
                        vertical
                        options={this.cb.renderMenuViewMode}
                        >
                    </ASUIClickableDropDown> : null}
                    <div
                        className="text"
                        onClick={this.cb.onClick}
                    >{this.props.header}</div>
                </div>
                {viewMode !== 'minimize' ? <div className="container">
                    {this.props.children}
                </div> : null}
            </div>
        )
    }
}
/** Export this script **/
export default ASUIPanel;
