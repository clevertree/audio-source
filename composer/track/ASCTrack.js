import * as React from "react";
import ASCTrackBase from "./ASCTrackBase";

import "./ASCTrack.css";
import {ASUIContextMenu} from "../../components";

export default class ASCTrack extends ASCTrackBase {

    /** Render **/

    render() {
        const viewMode = this.getViewMode(this.props.trackName);
        let content = null;
        let className = "asc-track";
        switch(viewMode) {
            case false:
                return null;
            default:
            case 'minimize':
                className += ' minimize';
                break;
            case true:
                content = this.renderContent();
        }

        // console.log('ASCTrack.render', viewMode);
        // if(this.props.className)
        //     className += ' ' + this.props.className;
        if(this.props.selected)
            className += ' selected';
        return (
            <div
                className={className}
                >
                <div
                    className="header"
                    onClick={this.cb.onClick}
                    >
                    Track: {this.getTrackName()}
                </div>
                {content}
            </div>
        );
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

// TODO: show all tracks!
