import React from "react";
import PropTypes from "prop-types";
import {ASUIGlobalContext} from "../index";
import ASUIClickableDropDown from "../clickable/ASUIClickableDropDown";
import "./assets/ASUIPanel.css"

class ASUIPanel extends React.Component {

    /** Global Context **/
    static contextType = ASUIGlobalContext;
    getGlobalContext()              { return this.context; }
    // setStatus(message)          { this.context.addLogEntry(message); }
    // setError(message)           { this.context.addLogEntry(message, 'error'); }
    getViewMode(viewKey)            { return this.context.getViewMode('panel:' + viewKey); }
    setViewMode(viewKey, mode)      { return this.context.setViewMode('panel:' + viewKey, mode); }
    renderMenuViewOptions(viewKey)  { return this.context.renderMenuViewOptions('panel:' + viewKey); }
    isPortraitMode()                { return this.context.isPortraitMode(); }

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
            renderMenuViewOptions: () => this.renderMenuViewOptions(this.props.viewKey)
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
        const portrait = this.isPortraitMode();
        let className = 'asui-panel';
        if(this.props.className)
            className += ' ' + this.props.className;
        if(this.props.horizontal)
            className += ' horizontal';
        if(this.props.large)
            className += ' large';

        let viewMode = null;
        const viewKey = this.props.viewKey;
        if(viewKey) {
            viewMode = this.getViewMode(viewKey);
            className += ' view-mode ' + viewKey;
        }
        switch(viewMode) {
            case false:
            case 'none':
                return null;
            default:
                if(viewMode && !portrait)
                    className += ' ' + viewMode;
                break;
            case 'minimize':
                className += ' ' + viewMode;
        }

        return (
            <div className={`${className}`}>
                <div className="header"
                     title={this.props.title}
                >
                    {this.props.viewKey && !portrait ? <ASUIClickableDropDown
                        className="config"
                        vertical
                        options={this.cb.renderMenuViewOptions}
                    /> : null}
                    <div
                        className="text"
                        onClick={this.props.viewKey ? this.cb.onClick : null}
                    >{this.props.header}</div>
                </div>
                {viewMode !== 'minimize' ? <div className="container">
                    {this.props.children}
                </div> : null}
                <div className="footer"/>
            </div>
        )
    }
}
/** Export this script **/
export default ASUIPanel;
