import * as React from "react";
import {
    // TrackerInstructionAdd,
    TrackerInstruction,
    TrackerRow
} from "./";
import {Div, Form, Panel, Button, ButtonDropDown} from "../../components/";

import "./assets/Tracker.css";

class Tracker extends React.Component {
    /** Default Properties **/
    static defaultProps = {
        selectedIndices: [],
        rowOffset: 0,
        rowLength: 16,
        quantizationInTicks: null
    };

    /** Property validation **/
    static propTypes = {
        // tracker: PropTypes.any.isRequired,
    };

    constructor(props) {
        super(props);

        if(!props.composer)
            throw new Error("Invalid composer");
        // this.state = this.props.composer.state;
        this.cb = {
            onWheel: e => this.onWheel(e)
        }
    }

    getComposer()               { return this.props.composer; }
    getSong()                   { return this.props.composer.song; }
    getTrackName()              { return this.props.trackName; }

    getQuantizationInTicks() {
        return this.props.quantizationInTicks || this.props.composer.song.data.timeDivision
    }

    getSegmentInfo() {
        const rowLength = this.props.rowLength;
        const rowOffset = this.props.rowOffset;

        const currentSegmentID = Math.floor(rowOffset / rowLength);
        let segmentCount = 3;
        if(currentSegmentID >= segmentCount)
            segmentCount = currentSegmentID + 1;
        return {segmentCount, currentSegmentID};
    }

    onWheel(e) {
        let rowOffset = this.props.rowOffset;
        rowOffset += e.deltaY > 0 ? 1 : -1;
        if(rowOffset < 0)
            return console.log("Unable to scroll past beginning");
        this.getComposer().trackerChangeRowOffset(this.getTrackName(), rowOffset);
        console.log("TODO", e.deltaY);
    }

    /** Render **/

    render() {
        let className = "asc-tracker";
        // if(this.props.className)
        //     className += ' ' + this.props.className;
        if(this.props.selected)
            className += ' selected';
        return <Panel
                className={className}
                title={this.getTrackName()}
                >
            {this.renderRowSegments()}
                <Div
                    className="asc-tracker-container"
                    onWheel={this.cb.onWheel}
                >
                    {this.renderRowContent()}
                </Div>
            </Panel>;
    }

    renderRowSegments() {
        const composer = this.props.composer;
        const {segmentCount, currentSegmentID} = this.getSegmentInfo();
        const rowLength = this.props.rowLength;

        const buttons = [];

        buttons.push(<ButtonDropDown
            arrow={'▼'}
            key="segment-quantization"
            options={() => this.getComposer().renderMenuTrackerSetQuantization()}
        >1B</ButtonDropDown>);

        for (let segmentID = 0; segmentID <= segmentCount; segmentID++)
            buttons.push(<Button
                key={segmentID}
                selected={segmentID === currentSegmentID}
                onAction={e => composer.trackerChangeRowOffset(this.props.trackName, segmentID * rowLength)}
            >{segmentID}</Button>);

        // buttons.push(<Button
        //     key="segment-add"
        //     onAction={e => this.groupAdd(e)}
        // >+</Button>);

        // buttons.push(<Button
        //     arrow={'▼'}
        //     key="segment-length"
        //     onAction={e => this.openMenuTrackerSetSegmentLength(e)}
        //     title="Select Tracker Segment Length"
        // >16B</Button>);

        return buttons;
    }

    renderRowContent() {
        // console.time('tracker.renderRowContent()');

        const composer = this.props.composer;
        const rowOffset = this.props.rowOffset;
        const rowLength = this.props.rowLength;
        const selectedIndices = this.props.selectedIndices;

        const quantizationInTicks = this.getQuantizationInTicks();

        // Instruction Iterator
        let instructionIterator = composer.song.instructionGetIterator(this.props.trackName);

        const trackerFilterByInstrumentID = composer.state.trackerFilterByInstrumentID;

        const cursorIndex = this.props.cursorIndex || 0;


        let     rowCount = 0;
        const rowContent = [];

        let currentRowPositionTicks = 0;

        let nextQuantizationBreakInTicks = 0;
        let rowInstructionElms = [];
        while (true) {
            const nextInstruction = instructionIterator.nextInstruction();
            if(!nextInstruction)
                break;

            // lastRowSegmentID = Math.floor(instructionIterator.positionTicks / trackerSegmentLengthInTicks);


            if(nextInstruction.deltaDurationInTicks > 0) {
                // Finish rendering last row
                let endPositionTicks = instructionIterator.positionTicks;

                // Move next quantized row up to current position
                while(nextQuantizationBreakInTicks <= currentRowPositionTicks)
                    nextQuantizationBreakInTicks += quantizationInTicks;

                // Render extra quantized rows if necessary
                while(nextQuantizationBreakInTicks < endPositionTicks) {
                    addRow(nextQuantizationBreakInTicks);
                    nextQuantizationBreakInTicks += quantizationInTicks;
                }

                addRow(endPositionTicks);
            }

            if(trackerFilterByInstrumentID !== null && trackerFilterByInstrumentID !== nextInstruction.instrument)
                continue;

            // Render instruction
            const index = instructionIterator.currentIndex;
            const props = {
                tracker: this,
                instruction: nextInstruction,
                index
            };
            if (selectedIndices.indexOf(index) !== -1) props.selected = true;
            if (index === cursorIndex) props.cursor = true;
            rowInstructionElms.push(<TrackerInstruction
                key={index}
                {...props}
                />);

        }
        // renderQuantizedRows(maxLengthInTicks);

        while(rowContent.length < rowLength) {
            addRow(nextQuantizationBreakInTicks);
            nextQuantizationBreakInTicks += quantizationInTicks;
        }

        function addRow(toPositionTicks) {
            let rowDeltaDuration = toPositionTicks - currentRowPositionTicks;
            currentRowPositionTicks = toPositionTicks;
            if (rowCount >= rowOffset
                && rowContent.length < rowLength
            ) {
                const newRowElm = <TrackerRow
                    positionTicks={currentRowPositionTicks}
                    key={rowCount}
                    deltaDuration={composer.values.formatDuration(rowDeltaDuration)}
                >{rowInstructionElms}</TrackerRow>;
                rowContent.push(newRowElm);
            }
            rowInstructionElms = [];
            rowCount++;
        }


        // console.timeEnd('tracker.renderRowContent()');
        return rowContent;
    }

    // renderOptions() {
    //     return <>
    //         <Form className="tracker-row-length" title="Row &#120491;">
    //             <Button
    //                 arrow={'▼'}
    //                 // className="tracker-row-length"
    //                 onAction={e => this.openMenuTrackerSetQuantization(e)}
    //             >1B</Button>
    //         </Form>
    //
    //         <Form className="tracker-segment-length" title="Seg &#120491;">
    //             <Button
    //                 arrow={'▼'}
    //                 // className="tracker-segment-length"
    //                 onAction={e => this.openMenuTrackerSetSegmentLength(e)}
    //                 title="Select Tracker Segment Length"
    //             >16B</Button>
    //         </Form>
    //     </>;
    // }

}

export default Tracker;
