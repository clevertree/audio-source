import * as React from "react";
import ASCTrackBase from "./ASCTrackBase";

import "./ASCTrack.css";

export default class ASCTrack extends ASCTrackBase {

    /** Render **/

    render() {
        // console.log('ASCTrack.render');
        let className = "asc-track";
        // if(this.props.className)
        //     className += ' ' + this.props.className;
        if(this.props.selected)
            className += ' selected';
        return (
            <div
                className={className}
                >
                <div className="header">
                    {this.getTrackName()}
                </div>
                {this.renderContent()}

            </div>
        );
    }

    renderContent() {
        if(this.props.collapsed) {
            return (
                <div className="buttons-select-track">
                    {this.renderSelectTrackButton()}
                </div>
            )
        }
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
            this.renderRowContainer()
        ]
    }

}

