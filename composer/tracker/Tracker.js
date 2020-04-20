import * as React from "react";
import PropTypes from 'prop-types';

import {TrackerInstruction, TrackerRow} from "./";
import {Button, ButtonDropDown, Panel} from "../../components/";

import "./assets/Tracker.css";

class Tracker extends React.Component {
    /** Default Properties **/
    static defaultProps = {
        // cursorOffset: 0,
        // selectedIndices: [],
        // rowOffset: 0,
        // rowLength: 16,
        // quantizationTicks: null,
        // destinationList: []
    };

    /** Property validation **/
    static propTypes = {
        composer: PropTypes.object.isRequired,
        trackName: PropTypes.string.isRequired,
        trackState: PropTypes.object.isRequired
    };

    constructor(props) {
        super(props);

        if(!props.composer)
            throw new Error("Invalid composer");

        this.cb = {
            onKeyDown: (e) => this.onKeyDown(e),
            onWheel: e => this.onWheel(e)
        };
        this.container = React.createRef();
        this.destination = null;
        this.cursorInstruction = React.createRef();
        this.getTrackState();
        this.findRowCursorOffset();
    }

    componentDidMount() {
        this.container.current.addEventListener('wheel', this.cb.onWheel, { passive: false });
    }

    componentWillUnmount() {
        this.container.current.removeEventListener('wheel', this.cb.onWheel);
    }

    // getTrackInfo() {
    //     return new TrackInfo(this.props.trackName, this.props.composer);
    // }

    /** TODO: calculate correct destination **/
    getDestination()            {
        if(this.destination)
            return this.destination;
        console.warn('TODO: calculate correct destination');
        return this.destination = this.getComposer().getVolumeGain();
    }
    getComposer()               { return this.props.composer; }
    getSong()                   { return this.props.composer.song; }

    getTrackName()              { return this.props.trackName; }
    getTrackState()             { return this.props.trackState || {}; }
    getDestinationList()        { return this.props.trackState.destinationList || []; }
    getSelectedIndices()        { return this.props.trackState.selectedIndices || []; }
    getCursorOffset()           { return this.props.trackState.cursorOffset || 0; }
    getRowLength()              { return this.props.trackState.rowLength; }
    getRowOffset()              { return this.props.trackState.rowOffset || 0; }

    findRowCursorOffset() {
        let cursorOffset = this.getCursorOffset();
        const iterator = this.instructionGetQuantizedIterator();
        let row, currentRowStartPosition=0, lastRowStartPosition=0, column=0;
        // let indexFound = null;
        while(row = iterator.nextQuantizedInstructionRow(null, instruction => {
            // if(iterator.cursorPosition === cursorOffset)
            //     indexFound = iterator.currentIndex;
        })) {
            if(iterator.cursorPosition >= cursorOffset) {
                column = cursorOffset - currentRowStartPosition;
                break;
            }
            lastRowStartPosition = currentRowStartPosition;
            currentRowStartPosition = iterator.cursorPosition;
        }

        const nextRowOffset = iterator.cursorPosition + column;
        const lastRowOffset = lastRowStartPosition + column;
        // console.log({indexFound, p: iterator.cursorPosition, cursorOffset, column, lastRowOffset, nextRowOffset});
        return {
            // indexFound, // TODO: index is broken
            previousOffset: cursorOffset > 0 ? cursorOffset - 1 : 0,
            nextOffset: cursorOffset + 1,
            lastRowOffset,
            nextRowOffset
        }
    }

    // findInstructionIndexFromCursorOffset(cursorOffset) {
    //     let indexFound = null;
    //     this.eachRow(() => {
    //         return indexFound === null;
    //
    //     }, (index, instruction, cursorPosition) => {
    //         if(cursorPosition > cursorOffset)
    //             return false;
    //         if(cursorPosition === cursorOffset)
    //             indexFound = index; // @Depreciated
    //         return indexFound === null;
    //     });
    //     // console.log('findInstructionIndexFromCursorOffset', cursorOffset, indexFound);
    //     return indexFound;
    // }

    instructionGetQuantizedIterator() {
        const trackState = this.getTrackState();
        return this.getSong().instructionGetQuantizedIterator(
            this.getTrackName(),
            this.getQuantizationInTicks(),
            trackState.timeDivision, // || this.getSong().data.timeDivision,
            trackState.bpm //  || this.getSong().data.bpm
        )
    }

    getQuantizationInTicks() {
        return this.props.quantizationTicks || this.props.composer.song.data.timeDivision;
    }

    getSegmentInfo() {
        const rowLength = this.getRowLength();
        const rowOffset = this.getRowOffset();

        const currentSegmentID = Math.floor(rowOffset / rowLength);
        let segmentCount = 3;
        if(currentSegmentID >= segmentCount)
            segmentCount = currentSegmentID + 1;
        return {segmentCount, currentSegmentID};
    }


    /** Actions **/

    setCursorOffset(cursorOffset, playSelected= false) {
        this.getComposer().trackerSetCursorOffset(this.getTrackName(), cursorOffset, playSelected);
        // const selectedIndex = this.findInstructionIndexFromCursorOffset(cursorOffset);
        // console.log('setCursorOffset', cursorOffset, selectedIndex);
        // this.selectIndices(selectedIndex === null ? [] : [selectedIndex], cursorOffset);
        // this.playSelectedInstructions();
    }

    selectIndices(selectedIndices=null) {
        console.log('selectedIndices', selectedIndices);
        this.getComposer().trackerSelectIndices(this.getTrackName(), selectedIndices)
    }

    /** Render **/

    render() {
        // console.log('Tracker.render');
        let className = "asc-tracker";
        // if(this.props.className)
        //     className += ' ' + this.props.className;
        if(this.props.selected)
            className += ' selected';
        return (
            <Panel
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
            </Panel>
        );
    }

    renderRowSegments() {
        const composer = this.props.composer;
        const {segmentCount, currentSegmentID} = this.getSegmentInfo();

        const rowLength = this.getRowLength();

        const buttons = [];

        for (let segmentID = 0; segmentID <= segmentCount; segmentID++)
            buttons.push(<Button
                key={segmentID}
                selected={segmentID === currentSegmentID}
                onAction={e => composer.trackerSetCursorOffset(this.props.trackName, segmentID * rowLength)}
            >{segmentID}</Button>);

        buttons.push(<ButtonDropDown
            className="row-length"
            title={`Segment Length (${this.getRowLength()} Rows)`}
            arrow="▼"
            key="row-length"
            onClick={e => this.getTrackInfo().setActive()}
            options={() => this.getComposer().renderMenuTrackerSetSegmentLength(this.getTrackName())}
        >{this.getRowLength()}</ButtonDropDown>);

        return buttons;
    }


    renderRowOptions() {
        const composer = this.props.composer;
        const rowDeltaDuration = composer.values.formatSongDuration(this.getQuantizationInTicks());

        const buttons = [];

        buttons.push(<ButtonDropDown
            className="row-quantization"
            title={`Quantization (Duration = ${rowDeltaDuration})`}
            arrow="▼"
            key="row-quantization"
            onClick={e => this.getTrackInfo().setActive()}
            options={() => this.getComposer().renderMenuTrackerSetQuantization(this.getTrackName())}
        >{rowDeltaDuration}</ButtonDropDown>);


        return buttons;
    }


    renderRowContent() {
        // const trackState = this.getTrackState();
        // const quantizationTicks = trackState.quantizationTicks || this.getSong().data.timeDivision;

        // console.time('Tracker.renderRowContent()');
        const rowLength = this.getRowLength() || 16;
        const rowOffset = this.getRowOffset() || 0;
        const cursorOffset = this.getCursorOffset() || 0;
        const selectedIndices = this.getSelectedIndices();

        const rowContent = [];

        const iterator = this.instructionGetQuantizedIterator();
        // let cursorPosition = 0, rowCount = 0; // , lastPositionTicks = 0;
        // eslint-disable-next-line no-cond-assign
        let rowInstructionElms = [];
        while(iterator.nextQuantizedInstructionRow((row) => {
            if(iterator.rowCount < rowOffset)
                return;
            let nextRowPositionTicks = iterator.getNextRowPositionTicks();
            let rowDeltaDuration = nextRowPositionTicks - iterator.positionTicks;
            if (rowDeltaDuration <= 0) {
                console.warn("rowDeltaDuration is ", rowDeltaDuration);
            }

            const newRowElm = <TrackerRow
                key={iterator.rowCount}
                tracker={this}
                positionTicks={iterator.positionTicks}
                positionSeconds={iterator.positionSeconds}
                deltaDuration={rowDeltaDuration}
                cursorPosition={iterator.cursorPosition}
                cursor={iterator.cursorPosition === cursorOffset}

            >{rowInstructionElms}</TrackerRow>;
            rowContent.push(newRowElm);
            rowInstructionElms = [];
        }, (instruction) => {
            if(iterator.rowCount < rowOffset)
                return;
            const index = iterator.currentIndex;
            rowInstructionElms.push(<TrackerInstruction
                key={index}
                index={index}
                instruction={instruction}
                tracker={this}
                cursorPosition={iterator.cursorPosition}
                cursor={iterator.cursorPosition === cursorOffset}
                selected={selectedIndices.indexOf(index) !== -1}
            />)

        })) {
            if (rowContent.length >= rowLength)
                break;
        }


        // console.timeEnd('Tracker.renderRowContent()');
        return rowContent;
    }

    // renderRowContent2() {
    //     // console.time('tracker.renderRowContent()');
    //     const rowOffset = this.props.rowOffset;
    //     const rowLength = this.props.rowLength;
    //     const cursorOffset = this.props.cursorOffset || 0;
    //
    //     const rowContent = [];
    //
    //     // TODO: calculate from offset: positionTicks, positionSeconds, isCursor, isSelected
    //     this.eachRow((rowCount, currentRowPositionTicks, toPositionTicks, cursorPositionCount, instructionList) => {
    //         const rowInstructionElms = [];
    //         for(let i=0; i<instructionList.length; i++) {
    //             const props = instructionList[i];
    //             if(props.cursor) {
    //                 props.ref = this.cursorInstruction;
    //             }
    //             rowInstructionElms.push(<TrackerInstruction
    //                 key={props.index}
    //                 tracker={this}
    //                 {...props}
    //             />);
    //         }
    //
    //
    //         let rowDeltaDuration = toPositionTicks - currentRowPositionTicks;
    //         if (rowCount >= rowOffset
    //             && rowContent.length < rowLength
    //         ) {
    //             const newRowElm = <TrackerRow
    //                 key={rowCount}
    //                 cursor={cursorPositionCount === cursorOffset} // TODO: Redundant
    //                 tracker={this}
    //                 positionTicks={currentRowPositionTicks}
    //                 positionSeconds={1} // TODO:
    //                 deltaDuration={rowDeltaDuration}
    //                 cursorPosition={cursorPositionCount} // TODO: inefficient? nah
    //
    //             >{rowInstructionElms}</TrackerRow>;
    //             rowContent.push(newRowElm);
    //         }
    //
    //         // Continue rendering rows until we've reached rowLength
    //         return rowContent.length < rowLength;
    //     });
    //
    //
    //     // console.timeEnd('tracker.renderRowContent()');
    //     return rowContent;
    // }

    /** Playback **/

    playSelectedInstructions() {
        return this.playInstructions(this.getSelectedIndices());
    }

    playInstructions(selectedIndices, destination=null) {
        const trackState = this.getTrackState();

        destination = destination || this.getDestination();
        if(!Array.isArray(selectedIndices))
            selectedIndices = [selectedIndices];
        // console.log('playInstructions', selectedIndices);
        const programID = typeof trackState.programID !== "undefined" ? trackState.programID : 0;
        const song = this.getSong();

        // if(stopPlayback)
        //     song.programLoader.stopAllPlayback();

        for(let i=0; i<selectedIndices.length; i++) {
            const selectedIndex = selectedIndices[i];
            const instruction = song.instructionGetByIndex(this.getTrackName(), selectedIndex);
            song.playInstruction(destination, instruction, programID);
        }
    }


    /** User Input **/

    onWheel(e) {
        e.preventDefault();
        let newRowOffset = this.getRowOffset();
        newRowOffset += e.deltaY > 0 ? 1 : -1;
        if(newRowOffset < 0)
            newRowOffset = 0; // return console.log("Unable to scroll past beginning");
        this.getComposer().trackerSetRowOffset(this.getTrackName(), newRowOffset)
        // this.getTrackInfo().changeRowOffset(this.getTrackName(), newRowOffset);
    }

    async onKeyDown(e) {
        // console.log(e.type);
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
            case 'Enter':
                await this.getComposer().instructionInsert();
                break;
            //
            // case 'Play':
            //     break;
            //
            case 'ArrowRight':
                const {nextOffset, indexFound:nextIndexFound} = this.findRowCursorOffset();
                e.preventDefault();
                this.setCursorOffset(nextOffset, true);
                this.selectIndices(nextIndexFound === null ? [] : nextIndexFound);
                break;

            case 'ArrowLeft':
                e.preventDefault();
                const {previousOffset, indexFound:previousIndexFound} = this.findRowCursorOffset();
                if(previousOffset >= 0) {
                    this.setCursorOffset(previousOffset, true);
                    this.selectIndices(previousIndexFound === null ? [] : previousIndexFound);
                }
                break;

            case 'ArrowUp':
                e.preventDefault();
                const {lastRowOffset, indexFound:lastRowIndexFound} = this.findRowCursorOffset();
                if(lastRowOffset >= 0) {
                    this.setCursorOffset(lastRowOffset, true);
                    this.selectIndices(lastRowIndexFound === null ? [] : lastRowIndexFound);
                }
                break;

            case 'ArrowDown':
                e.preventDefault();
                const {nextRowOffset, indexFound:nextRowIndexFound} = this.findRowCursorOffset();
                this.setCursorOffset(nextRowOffset, true);
                this.selectIndices(nextRowIndexFound === null ? [] : nextRowIndexFound)
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
                const keyboardCommand = this.getComposer().keyboard.getKeyboardCommand(e.key, this.getComposer().state.keyboardOctave);
                if(keyboardCommand) {
                    const selectedIndices = this.getSelectedIndices();
                    // const cursorOffset = this.getCursorOffset();
                    if(selectedIndices.length > 0) {
                        await this.getComposer().instructionReplaceCommand(keyboardCommand);

                    } else {
                        await this.getComposer().instructionInsert(keyboardCommand);
                    }
                    // console.log('TODO: keyboardCommand', keyboardCommand, selectedIndices, cursorOffset);
                    return;
                }
                // this.instructionInsert
                console.info("Unhandled key: ", e.key);
                break;
        }
    }

}

export default Tracker;
