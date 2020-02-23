import React from "react";

import "./assets/TrackerGroupsPanel.css";
import Panel from "../../panel/Panel";
import Button from "../../../components/button/Button";

import "./assets/TrackerRowSegmentsPanel.css";

class TrackerRowSegmentsPanel extends React.Component {
    constructor(props) {
        super(props);
        if(!props.composer)
            throw new Error("Invalid composer");
        this.state = this.props.composer.state;
    }

    render() {
        // const composer = this.props.composer;
        let className = "tracker-row-segments-panel";
        if(this.props.className)
            className += ' ' + this.props.className;

        return (
            <Panel className={className} title="Tracker Segments">
                {(() => {
                    const segmentLengthInTicks = this.state.segmentLengthInTicks || (this.state.quantizationInTicks * 16);
                    let songLengthInTicks = this.state.songLengthInTicks;
                    let rowSegmentCount = Math.ceil(songLengthInTicks / segmentLengthInTicks) || 1;
                    if (rowSegmentCount > 256)
                        rowSegmentCount = 256;

                    const buttons = [];

                    // let rowSegmentCount = Math.ceil(lastSegmentRowPositionInTicks / segmentLengthInTicks) + 1;
                    const currentRowSegmentID = this.state.trackerRowOffset;
                    if (rowSegmentCount < currentRowSegmentID + 1)
                        rowSegmentCount = currentRowSegmentID + 1;
                    for (let segmentID = 0; segmentID <= rowSegmentCount; segmentID++)
                        buttons[segmentID] = <Button
                            key={segmentID}
                            onAction={e => this.trackerChangeSegment(segmentID)}
                        >{segmentID}</Button>;
                    return buttons;
                })()}
                <Button
                    onAction={e => this.groupAdd(e)}
                >+</Button>
            </Panel>
        )
    }
}
/** Export this script **/
export default TrackerRowSegmentsPanel;
