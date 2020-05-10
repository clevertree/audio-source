/* eslint-disable no-loop-func */
import * as React from "react";
import {ASUIPanel} from "../../components/";

import "./ASCTrack.css";
import ASCTrackBase from "./ASCTrackBase";

export default class ASCTrack extends ASCTrackBase {
    constructor(props) {
        super(props);
        this.container = React.createRef();
    }

    componentDidMount() {
        this.container.current.addEventListener('wheel', this.cb.onWheel, { passive: false });
    }

    componentWillUnmount() {
        this.container.current.removeEventListener('wheel', this.cb.onWheel);
    }


    /** User Input **/

    onWheel(e) {
        e.preventDefault();
        let newRowOffset = this.getTrackState().rowOffset;
        newRowOffset += e.deltaY > 0 ? 1 : -1;
        if(newRowOffset < 0)
            newRowOffset = 0; // return console.log("Unable to scroll past beginning");
        this.getComposer().trackerSetRowOffset(this.getTrackName(), newRowOffset)
        // this.getComposer().trackerUpdateSegmentInfo(this.getTrackName());
        // this.getTrackInfo().changeRowOffset(this.getTrackName(), newRowOffset);
    }

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

