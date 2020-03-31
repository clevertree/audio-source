import * as React from "react";
import {
    // TrackerInstructionAdd,
    TrackerInstruction,
    TrackerRow
} from "./";
import {Div, Form, Panel, Button} from "../../components/";

import "./assets/Tracker.css";
import PropTypes from "prop-types";

class Tracker extends React.Component {
    /** Default Properties **/
    static defaultProps = {
        selectedIndices: []
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
    }

    getSelectedIndices() { return this.props.selectedIndices}
    getQuantizationInTicks() {
        return this.props.quantizationInTicks || this.props.composer.song.data.timeDivision
    }
    getSegmentLengthInTicks() {
        return this.props.segmentLengthInTicks || (this.getQuantizationInTicks() * 16);
    }
    getCurrentSegmentID() {
        return this.props.currentSegmentID || 0;
    }
    getCursorPositionInTicks() {
        return 0;
    }


    getComposer()               { return this.props.composer; }
    // getTimeDivision()           { return this.getComposer().song.data.timeDivision; }
    // // getQuantizationInTicks()    { return this.state.quantizationInTicks; }
    // getSegmentLengthInTicks()   { return this.getComposer().state.trackerSegmentLengthInTicks; }
    getMaxLengthInTicks()       {
        let songLength = this.getComposer().state.songLengthTicks;
        let segmentLengthInTicks = this.getSegmentLengthInTicks();

        if(songLength < segmentLengthInTicks)
            return segmentLengthInTicks;
        return Math.ceil(songLength / segmentLengthInTicks) * segmentLengthInTicks
    }
    getSong()                   { return this.props.composer.song; }
    getTrackName()              { return this.props.trackName; }

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
                <Div className="asc-tracker-container">
                    {this.renderRowContent()}
                </Div>
            </Panel>;
    }

    renderOptions() {
        return <>
            <Form className="tracker-row-length" title="Row &#120491;">
                <Button
                    arrow={'▼'}
                    // className="tracker-row-length"
                    onAction={e => this.openMenuTrackerSetQuantization(e)}
                >1B</Button>
            </Form>

            <Form className="tracker-segment-length" title="Seg &#120491;">
                <Button
                    arrow={'▼'}
                    // className="tracker-segment-length"
                    onAction={e => this.openMenuTrackerSetSegmentLength(e)}
                    title="Select Tracker Segment Length"
                >16B</Button>
            </Form>
        </>;
    }

    renderRowSegments() {
        const composer = this.props.composer;

        const segmentLengthInTicks = this.getSegmentLengthInTicks();
        let songLengthTicks = composer.state.songLengthTicks;
        let segmentCount = Math.ceil(songLengthTicks / segmentLengthInTicks) || 1;
        if (segmentCount > 256)
            segmentCount = 256;

        const buttons = [];

        buttons.push(<Button
            arrow={'▼'}
            key="segment-quantization"
            onAction={e => this.openMenuTrackerSetQuantization(e)}
        >1B</Button>);

        // let rowSegmentCount = Math.ceil(lastSegmentRowPositionInTicks / trackerSegmentLengthInTicks) + 1;
        const currentRowSegmentID = Math.floor(this.getCursorPositionInTicks() / segmentLengthInTicks);
        if (segmentCount < currentRowSegmentID + 1)
            segmentCount = currentRowSegmentID + 1;
        for (let segmentID = 0; segmentID <= segmentCount; segmentID++)
            buttons.push(<Button
                key={segmentID}
                selected={segmentID === currentRowSegmentID}
                onAction={e => composer.trackerChangeSegment(this.props.trackName, segmentID)}
            >{segmentID}</Button>);

        buttons.push(<Button
            key="segment-add"
            onAction={e => this.groupAdd(e)}
        >+</Button>);

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

        const quantizationInTicks = this.getQuantizationInTicks();
        const currentSegmentStartInTicks = this.getCurrentSegmentID() * this.getSegmentLengthInTicks();
        const currentSegmentEndInTicks = currentSegmentStartInTicks + this.getSegmentLengthInTicks();
        const maxLengthInTicks = this.getMaxLengthInTicks();

        // Instruction Iterator
        let instructionIterator = composer.song.instructionGetIterator(this.props.trackName);

        const trackerFilterByInstrumentID = composer.state.trackerFilterByInstrumentID;

        const selectedIndices = this.getSelectedIndices();
        const cursorIndex = this.props.cursorIndex || 0;


        // let     rowCount = 0;
        // const   rowTotal = this.state.rowTotal,
        //         rowOffset = this.state.rowOffset, // by row or ticks? ticks. rows are can be variable length
        const rowContent = [];

        let lastRowPositionInTicks = 0;

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
                while(nextQuantizationBreakInTicks <= lastRowPositionInTicks)
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

        while(nextQuantizationBreakInTicks < maxLengthInTicks) {
            addRow(nextQuantizationBreakInTicks);
            nextQuantizationBreakInTicks += quantizationInTicks;
        }

        function addRow(toPositionTicks) {
            let rowDeltaDuration = toPositionTicks - lastRowPositionInTicks;
            lastRowPositionInTicks = toPositionTicks;
            if (toPositionTicks >= currentSegmentStartInTicks
                && toPositionTicks < currentSegmentEndInTicks
            ) {
                const newRowElm = <TrackerRow
                    key={rowContent.length}
                    deltaDuration={composer.values.formatDuration(rowDeltaDuration)}
                >{rowInstructionElms}</TrackerRow>;
                rowContent.push(newRowElm);
            }
            rowInstructionElms = [];
            // rowCount++;
        }


        // console.timeEnd('tracker.renderRowContent()');
        return rowContent;
    }

}

export default Tracker;
