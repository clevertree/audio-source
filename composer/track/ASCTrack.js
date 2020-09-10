import * as React from "react";

import ASUIClickableDropDown from "../../components/clickable/ASUIClickableDropDown";
import "./ASCTrack.css";
import ASCTrackInput from "./ASCTrackInput";

export default class ASCTrack extends ASCTrackInput {



    componentDidUpdate(prevProps, prevState, snapshot) {
        if(!prevProps.selected && this.props.selected) {
            const divContainer = this.ref.rowContainer.current;
            if(divContainer && document.activeElement !== divContainer) {
                // console.log('divContainer.focus()', prevProps.selected, this.props.selected, this.ref.rowContainer.current);
                divContainer.focus();
            }
        }
        // TODO: focus on select?
    }


    /** Render **/


    render() {
        const composer = this.getComposer();
        const portrait = composer.state.portrait;
        const trackName = this.getTrackName();
        const trackLength = composer.getSong().data.tracks[trackName].length;
        const viewMode = this.state.viewMode;
        // console.log('ASCTrack.render', trackName);
        let content = null;
        let className = "asc-track";

        switch(viewMode) {
            case false:
            case 'none':
                return null;
            default:
                if(viewMode && !portrait)
                    className += ' ' + viewMode;
                content = this.renderContent();
                break;
            case 'minimize':
                className += ' ' + viewMode;
        }

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
                    >{trackName} ({trackLength} note{trackLength === 1 ? '' : 's'})</div>
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
                // tabIndex={0}
                onKeyDown={this.cb.onKeyDown}
                onTouchStart={this.cb.onTouchStart}
                onTouchEnd={this.cb.onTouchEnd}

                // onWheel={this.cb.onWheel}
            >
                {this.renderRowContent()}
                {this.renderContextMenu()}

            </div>
        ]
    }
}
