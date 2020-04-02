import * as React from "react";
import {
    // TrackerInstructionAdd,
    TrackerInstruction,
    TrackerRow
} from "./";
import {Panel, Button, ButtonDropDown} from "../../components/";

import "./assets/Tracker.css";

class Tracker extends React.Component {
    /** Default Properties **/
    static defaultProps = {
        cursorOffset: 4,
        selectedIndices: [],
        rowOffset: 0,
        rowLength: 16,
        quantizationTicks: null
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
            onKeyDown: (e) => this.onKeyDown(e),
            onWheel: e => this.onWheel(e)
        };
        this.container = React.createRef();
        this.cursorInstruction = React.createRef();
    }

    componentDidMount() {
        this.container.current.addEventListener('wheel', this.cb.onWheel, { passive: false });
    }

    componentWillUnmount() {
        this.container.current.removeEventListener('wheel', this.cb.onWheel);
    }

    getComposer()               { return this.props.composer; }
    getSong()                   { return this.props.composer.song; }
    getTrackName()              { return this.props.trackName; }
    getSelectedIndices()        { return this.props.selectedIndices; }
    getCursorOffset()           { return this.props.cursorOffset; }

    getQuantizationInTicks() {
        return this.props.quantizationTicks || this.props.composer.song.data.timeDivision;
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

    findPreviousRowCursorOffset() { // TODO: fix
        let cursorOffset = this.getCursorOffset();

        let previousRowCursorOffset = null;
        this.eachRow((rowCount, lastRowPositionTicks, toPositionTicks, cursorPosition) => {
            if(cursorPosition > cursorOffset)
                previousRowCursorOffset = cursorPosition;
            return previousRowCursorOffset === null;
        }, (instruction, cursorPosition) => {
        });
        console.log('previousRowCursorOffset', previousRowCursorOffset, cursorOffset);
        return previousRowCursorOffset;
    }

    findInstructionIndexFromCursorOffset(cursorOffset) {
        let indexFound = null;
        this.eachRow(() => {
            return indexFound === null;

        }, (instruction, cursorPosition) => {
            if(cursorPosition > cursorOffset)
                return false;
            if(cursorPosition === cursorOffset)
                indexFound = instruction.index;
            return indexFound === null;
        });
        return indexFound;
    }

    /** Actions **/

    setCursorOffset(cursorOffset) {
        const selectedIndices = [this.findInstructionIndexFromCursorOffset(cursorOffset)];
        return this.selectIndices(selectedIndices, cursorOffset);
    }

    selectIndices(selectedIndices=null, cursorOffset=null) {
        // TODO: update rowOffset
        console.log("TODO:", {selectedIndices, cursorOffset});
        return this.getComposer().trackerSelectIndices(this.getTrackName(), selectedIndices, cursorOffset);
    }

    /** Render **/

    render() {
        let className = "asc-tracker";
        // if(this.props.className)
        //     className += ' ' + this.props.className;
        if(this.props.selected)
            className += ' selected';
        return (
            <Panel
                className={className}
                title={this.getTrackName()}
                >
                <div
                    className="asc-tracker-segments"
                    children={this.renderRowSegments()}
                    />
                <div
                    className="asc-tracker-container"
                    ref={this.container}
                    tabIndex={0}
                    onKeyDown={this.cb.onKeyDown}
                    // onWheel={this.cb.onWheel}
                    >
                    {this.renderRowContent()}
                </div>
                <div
                    className="asc-tracker-options"
                    children={this.renderRowOptions()}
                />
            </Panel>
        );
    }

    renderRowSegments() {
        const composer = this.props.composer;
        const {segmentCount, currentSegmentID} = this.getSegmentInfo();
        const rowLength = this.props.rowLength;

        const buttons = [];

        for (let segmentID = 0; segmentID <= segmentCount; segmentID++)
            buttons.push(<Button
                key={segmentID}
                selected={segmentID === currentSegmentID}
                onAction={e => composer.trackerChangeRowOffset(this.props.trackName, segmentID * rowLength)}
            >{segmentID}</Button>);

        return buttons;
    }


    renderRowOptions() {
        const composer = this.props.composer;
        const rowDeltaDuration = composer.values.formatDuration(this.getQuantizationInTicks());

        const buttons = [];

        buttons.push(<ButtonDropDown
            className="row-length"
            title="Tracker Row Length"
            arrow="▼"
            key="row-length"
            options={() => this.getComposer().renderMenuTrackerSetSegmentLength(this.getTrackName())}
        >{this.props.rowLength}</ButtonDropDown>);

        buttons.push(<ButtonDropDown
            className="row-quantization"
            title="Tracker Quantization"
            arrow="▼"
            key="row-quantization"
            options={() => this.getComposer().renderMenuTrackerSetQuantization(this.getTrackName())}
        >{rowDeltaDuration}</ButtonDropDown>);


        return buttons;
    }


    renderRowContent() {
        // console.time('tracker.renderRowContent()');
        const rowOffset = this.props.rowOffset;
        const rowLength = this.props.rowLength;
        const cursorOffset = this.props.cursorOffset || 0;

        const rowContent = [];


        this.eachRow((rowCount, currentRowPositionTicks, toPositionTicks, cursorPositionCount, instructionList) => {
            const rowInstructionElms = [];
            for(let i=0; i<instructionList.length; i++) {
                const props = instructionList[i];
                if(props.cursor) {
                    props.ref = this.cursorInstruction;
                }
                rowInstructionElms.push(<TrackerInstruction
                    key={props.index}
                    tracker={this}
                    {...props}
                />);
            }


            let rowDeltaDuration = toPositionTicks - currentRowPositionTicks;
            if (rowCount >= rowOffset
                && rowContent.length < rowLength
            ) {
                const newRowElm = <TrackerRow
                    key={rowCount}
                    cursor={cursorPositionCount === cursorOffset}
                    tracker={this}
                    positionTicks={currentRowPositionTicks}
                    deltaDuration={rowDeltaDuration}
                    cursorPosition={cursorPositionCount} // TODO: inefficient?
                >{rowInstructionElms}</TrackerRow>;
                rowContent.push(newRowElm);
            }

            // Continue rendering rows until we've reached rowLength
            return rowContent.length < rowLength;
        });


        // console.timeEnd('tracker.renderRowContent()');
        return rowContent;
    }



    /** Row Iterator **/

    eachRow(rowCallback, instructionCallback=null) {
        const cursorOffset = this.props.cursorOffset || 0;
        const selectedIndices = this.props.selectedIndices;

        const quantizationTicks = this.getQuantizationInTicks();

        // Instruction Iterator
        let instructionIterator = this.getSong().instructionGetIterator(this.props.trackName);

        let rowInstructionElms = [];
        let rowCount=0, cursorPosition=0;
        let currentRowPositionTicks = 0;

        let nextQuantizationBreakInTicks = quantizationTicks;
        while (true) {
            const instruction = instructionIterator.nextInstruction();
            if(!instruction)
                break;


            if(instruction.deltaDurationInTicks > 0) {
                // Finish rendering last row
                let endPositionTicks = instructionIterator.positionTicks;

                // Move next quantized row up to current position
                while(nextQuantizationBreakInTicks <= currentRowPositionTicks)
                    nextQuantizationBreakInTicks += quantizationTicks;

                // Render extra quantized rows if necessary
                while(nextQuantizationBreakInTicks < endPositionTicks) {
                    if(doCallback(nextQuantizationBreakInTicks) === false)
                        return;
                    nextQuantizationBreakInTicks += quantizationTicks;
                }

                if(doCallback(endPositionTicks) === false)
                    return;
            }

            if(instructionCallback)
                if(instructionCallback(instruction, cursorPosition) === false)
                    return;

            // Render instruction
            const index = instructionIterator.currentIndex;
            const props = {
                instruction,
                index,
                cursorPosition // TODO: inefficient?
            };
            if (selectedIndices.indexOf(index) !== -1)
                props.selected = true;
            if (cursorPosition === cursorOffset) {
                props.cursor = true;
            }
            rowInstructionElms.push(props);
            cursorPosition++;

        }
        // renderQuantizedRows(maxLengthInTicks);

        for(let i=0; i<256; i++) {
            if(doCallback(nextQuantizationBreakInTicks) === false)
                return;
            nextQuantizationBreakInTicks += quantizationTicks;
        }

        function doCallback(toPositionTicks) {
            const lastRowPositionTicks = currentRowPositionTicks;
            // let rowDeltaDuration = toPositionTicks - currentRowPositionTicks;
            currentRowPositionTicks = toPositionTicks;

            const result = rowCallback(rowCount, lastRowPositionTicks, toPositionTicks, cursorPosition, rowInstructionElms);

            rowInstructionElms=[];
            rowCount++;
            cursorPosition++;
            return result;
        }

    }


    /** User Input **/

    onWheel(e) {
        e.preventDefault();
        let rowOffset = this.props.rowOffset;
        rowOffset += e.deltaY > 0 ? 1 : -1;
        if(rowOffset < 0)
            rowOffset = 0; // return console.log("Unable to scroll past beginning");
        this.getComposer().trackerChangeRowOffset(this.getTrackName(), rowOffset);
    }

    onKeyDown(e) {
        if(e.isDefaultPrevented())
            return;
        switch(e.key) {
            // case 'Delete':
            //     break;
            //
            // case 'Escape':
            // case 'Backspace':
            //     break;
            //
            // case 'Enter':
            //     break;
            //
            // case 'Play':
            //     break;
            //
            case 'ArrowRight':
                e.preventDefault();
                this.setCursorOffset(this.getCursorOffset() + 1);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.setCursorOffset(this.getCursorOffset() - 1);
                break;


            case 'ArrowUp':
                const nextCursorOffset = this.findPreviousRowCursorOffset();
                this.setCursorOffset(nextCursorOffset);
                break;

            case 'ArrowDown':
                const previousCursorOffset = this.findPreviousRowCursorOffset();
                this.setCursorOffset(previousCursorOffset);
                break;
            //
            // case ' ':
            //     break;
            //
            // case 'PlayFrequency':
            //     break;

            case 'ContextMenu':
                e.preventDefault();
                this.cursorInstruction.current.toggleMenu();
                break;

            default:
                console.info("Unhandled key: ", e.key);
                break;
        }
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
