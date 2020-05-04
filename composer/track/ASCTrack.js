/* eslint-disable no-loop-func */
import * as React from "react";
import {ASUIPanel} from "../../components/";

import "./ASCTrack.css";
import ASCTrackBase from "./ASCTrackBase";

class ASCTrack extends ASCTrackBase {

    /** Render **/

    render() {
        // console.log('ASCTrack.render');
        let className = "asc-track";
        // if(this.props.className)
        //     className += ' ' + this.props.className;
        if(this.props.selected)
            className += ' selected';
        return (
            <ASUIPanel
                className={className}
                header={this.getTrackName()}
                title={`Track: ${this.getTrackName()}`}
                >
                <div
                    className="asct-segments"
                    children={this.renderRowSegments()}
                    />
                <div
                    className="asct-container"
                    ref={this.container}
                    tabIndex={0}
                    onKeyDown={this.cb.onKeyDown}
                    // onWheel={this.cb.onWheel}
                    >
                    {this.renderRowContent()}
                </div>
                <div
                    className="asct-options"
                    children={this.renderRowOptions()}
                />
            </ASUIPanel>
        );
    }

}

export default ASCTrack;
