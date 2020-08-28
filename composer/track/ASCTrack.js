import * as React from "react";

import {ASUIContextMenu} from "../../components";
import ASCTrackActions from "./ASCTrackActions";
import ASUIClickableDropDown from "../../components/clickable/ASUIClickableDropDown";
import "./ASCTrack.css";

export default class ASCTrack extends ASCTrackActions {

    /** Render **/


    render() {
        const portrait = this.getComposer().state.portrait;
        const viewMode = this.state.viewMode;
        let content = null;
        let className = "asc-track";

        switch(viewMode) {
            case false:
            case 'hide':
                return null;
            default:
                if(viewMode && !portrait)
                    className += ' ' + viewMode;
                content = this.renderContent();
                break;
            case 'minimize':
                className += ' ' + viewMode;
        }

        console.log('ASCTrack.render', viewMode);
        // if(this.props.className)
        //     className += ' ' + this.props.className;
        if(this.props.selected)
            className += ' selected';
        if(viewMode && !portrait)
            className += ' ' + viewMode;

        return (
            <div className={`${className}`}>
                <div className="header"
                     title={this.props.title}
                >
                    {!portrait ? <ASUIClickableDropDown
                        className="config"
                        vertical
                        options={this.cb.renderMenuViewOptions}
                    /> : null}
                    <div
                        className="text"
                        onClick={this.cb.toggleViewMode}
                    >Track: {this.getTrackName()}</div>
                </div>
                {content}
            </div>
        )
    }

    renderContent() {
        // if(this.props.collapsed) {
        //     return (
        //         <div className="buttons-select-track">
        //             {this.renderSelectTrackButton()}
        //         </div>
        //     )
        // }
        return [
            <div
                key="buttons"
                className="buttons">
                <div className="segments">
                    {this.renderRowSegments()}
                </div>
                <div className="options">
                    {this.renderRowOptions()}
                    {this.renderQuantizationButton()}
                </div>
            </div>,
            <div
                key="row-container"
                className="row-container"
                ref={elm => {
                    elm && elm.addEventListener('wheel', this.cb.onWheel, {passive: false});
                    this.ref.rowContainer.current = elm;
                }}
                tabIndex={0}
                onKeyDown={this.cb.onKeyDown}
                onContextMenu={this.cb.onContextMenu}
                // onWheel={this.cb.onWheel}
            >
                {this.renderRowContent()}
                {this.state.menuOpen ? <ASUIContextMenu
                    clientPosition={this.state.clientPosition}
                    key="dropdown"
                    ref={this.dropdown}
                    options={this.cb.options}
                    vertical={true}
                    // onClose={e => this.toggleDropDownMenu(e)}
                /> : null}
            </div>
        ]
    }
}
