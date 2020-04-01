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



    selectIndices(selectedIndices, cursorOffset=null) {
        return this.getComposer().trackerSelectIndices(this.getTrackName(), selectedIndices, cursorOffset);
    }

    /** User Input **/

    onWheel(e) {
        // console.log('onWheel', e);
        e.preventDefault();
        let rowOffset = this.props.rowOffset;
        rowOffset += e.deltaY > 0 ? 1 : -1;
        if(rowOffset < 0)
            rowOffset = 0; // return console.log("Unable to scroll past beginning");
        this.getComposer().trackerChangeRowOffset(this.getTrackName(), rowOffset);
        // console.log("TODO", e.deltaY);
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
            //     throw new Error("TODO: navigate pop");
            //
            // case 'Enter':
            //     break;
            //
            // case 'Play':
            //     break;
            //
            case 'ArrowRight':
                e.preventDefault();
                this.selectIndices(null, this.getCursorOffset() + 1);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.selectIndices(null, this.getCursorOffset() - 1);
                break;

            //
            // case 'ArrowDown':
            //     break;
            //
            // case 'ArrowUp':
            //     break;
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

        let currentRowPositionTicks = 0;


        this.eachRow((rowCount, lastRowPositionTicks, toPositionTicks, cursorPositionCount, rowInstructionElms) => {
            let rowDeltaDuration = toPositionTicks - currentRowPositionTicks;
            if (rowCount >= rowOffset
                && rowContent.length < rowLength
            ) {
                const newRowElm = <TrackerRow
                    key={rowCount}
                    cursor={cursorPositionCount === cursorOffset}
                    tracker={this}
                    positionTicks={lastRowPositionTicks}
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


    // renderRowContent2() {
    //     // console.time('tracker.renderRowContent()');
    //     const tracker = this;
    //     const composer = this.props.composer;
    //     const rowOffset = this.props.rowOffset;
    //     const rowLength = this.props.rowLength;
    //     const cursorOffset = this.props.cursorOffset || 0;
    //     const selectedIndices = this.props.selectedIndices;
    //
    //     const quantizationTicks = this.getQuantizationInTicks();
    //
    //     // Instruction Iterator
    //     let instructionIterator = composer.song.instructionGetIterator(this.props.trackName);
    //     // TODO: based on cell index, not instruction index
    //
    //     let     rowCount=0, cursorPositionCount=0;
    //     const rowContent = [];
    //
    //     let currentRowPositionTicks = 0;
    //
    //     let nextQuantizationBreakInTicks = quantizationTicks;
    //     let rowInstructionElms = [];
    //     while (true) {
    //         const nextInstruction = instructionIterator.nextInstruction();
    //         if(!nextInstruction)
    //             break;
    //         // lastRowSegmentID = Math.floor(instructionIterator.positionTicks / trackerSegmentLengthInTicks);
    //
    //
    //         if(nextInstruction.deltaDurationInTicks > 0) {
    //             // Finish rendering last row
    //             let endPositionTicks = instructionIterator.positionTicks;
    //
    //             // Move next quantized row up to current position
    //             while(nextQuantizationBreakInTicks <= currentRowPositionTicks)
    //                 nextQuantizationBreakInTicks += quantizationTicks;
    //
    //             // Render extra quantized rows if necessary
    //             while(nextQuantizationBreakInTicks < endPositionTicks) {
    //                 addRow(nextQuantizationBreakInTicks);
    //                 nextQuantizationBreakInTicks += quantizationTicks;
    //             }
    //
    //             addRow(endPositionTicks);
    //         }
    //
    //
    //         // Render instruction
    //         const index = instructionIterator.currentIndex;
    //         const props = {
    //             tracker,
    //             instruction: nextInstruction,
    //             index,
    //             cursorPosition: cursorPositionCount // TODO: inefficient
    //         };
    //         if (selectedIndices.indexOf(index) !== -1)
    //             props.selected = true;
    //         if (cursorPositionCount === cursorOffset) {
    //             props.cursor = true;
    //             props.ref = this.cursorInstruction;
    //         }
    //         rowInstructionElms.push(<TrackerInstruction
    //             key={index}
    //             {...props}
    //         />);
    //         cursorPositionCount++;
    //
    //     }
    //     // renderQuantizedRows(maxLengthInTicks);
    //
    //     while(rowContent.length < rowLength) {
    //         addRow(nextQuantizationBreakInTicks);
    //         nextQuantizationBreakInTicks += quantizationTicks;
    //     }
    //
    //     function addRow(toPositionTicks) {
    //         const lastRowPositionTicks = currentRowPositionTicks;
    //         let rowDeltaDuration = toPositionTicks - currentRowPositionTicks;
    //         currentRowPositionTicks = toPositionTicks;
    //         if (rowCount >= rowOffset
    //             && rowContent.length < rowLength
    //         ) {
    //             const newRowElm = <TrackerRow
    //                 key={rowCount}
    //                 cursor={cursorPositionCount === cursorOffset}
    //                 tracker={tracker}
    //                 positionTicks={lastRowPositionTicks}
    //                 deltaDuration={rowDeltaDuration}
    //                 cursorPosition={cursorPositionCount} // TODO: inefficient
    //             >{rowInstructionElms}</TrackerRow>;
    //             rowContent.push(newRowElm);
    //             // console.log('addRow', lastRowPositionTicks, toPositionTicks);
    //         }
    //         rowInstructionElms = [];
    //         rowCount++;
    //         cursorPositionCount++;
    //     }
    //
    //
    //     return rowContent;
    // }

    /** Row Iterator **/

    eachRow(callback) {

        const tracker = this;
        const cursorOffset = this.props.cursorOffset || 0;
        const selectedIndices = this.props.selectedIndices;

        const quantizationTicks = this.getQuantizationInTicks();

        // Instruction Iterator
        let instructionIterator = this.getSong().instructionGetIterator(this.props.trackName);
        // TODO: based on cell index, not instruction index

        let     rowCount=0, cursorPositionCount=0;

        let currentRowPositionTicks = 0;

        let nextQuantizationBreakInTicks = quantizationTicks;
        let rowInstructionElms = [];
        while (true) {
            const nextInstruction = instructionIterator.nextInstruction();
            if(!nextInstruction)
                break;


            if(nextInstruction.deltaDurationInTicks > 0) {
                // Finish rendering last row
                let endPositionTicks = instructionIterator.positionTicks;

                // Move next quantized row up to current position
                while(nextQuantizationBreakInTicks <= currentRowPositionTicks)
                    nextQuantizationBreakInTicks += quantizationTicks;

                // Render extra quantized rows if necessary
                while(nextQuantizationBreakInTicks < endPositionTicks) {
                    doCallback(nextQuantizationBreakInTicks);
                    nextQuantizationBreakInTicks += quantizationTicks;
                }

                doCallback(endPositionTicks);
            }


            // Render instruction
            const index = instructionIterator.currentIndex;
            const props = {
                tracker,
                instruction: nextInstruction,
                index,
                cursorPosition: cursorPositionCount // TODO: inefficient
            };
            if (selectedIndices.indexOf(index) !== -1)
                props.selected = true;
            if (cursorPositionCount === cursorOffset) {
                props.cursor = true;
                props.ref = this.cursorInstruction;
            }
            rowInstructionElms.push(<TrackerInstruction
                key={index}
                {...props}
            />);
            cursorPositionCount++;

        }
        // renderQuantizedRows(maxLengthInTicks);

        for(let i=0; i<256; i++) {
            if(!doCallback(nextQuantizationBreakInTicks))
                break;
            nextQuantizationBreakInTicks += quantizationTicks;
        }

        function doCallback(toPositionTicks) {
            const lastRowPositionTicks = currentRowPositionTicks;
            // let rowDeltaDuration = toPositionTicks - currentRowPositionTicks;
            currentRowPositionTicks = toPositionTicks;

            const result = callback(rowCount, lastRowPositionTicks, toPositionTicks, cursorPositionCount, rowInstructionElms);

            rowInstructionElms=[];
            rowCount++;
            cursorPositionCount++;
            return result;
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
