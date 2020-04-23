/* eslint-disable no-loop-func */
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
        this.trackerGetCursorInfo();
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
    getRowLength()              { return this.props.trackState.rowLength || 16; }
    getRowOffset()              { return this.props.trackState.rowOffset || 0; }
    getStartPosition()          { return this.props.trackState.startPosition || 0; }


    trackerGetCursorInfo(cursorOffset=null) {
        return this.getComposer().trackerGetCursorInfo(this.getTrackName(), cursorOffset);
    }

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

    setCursorOffset(cursorOffset, selectedIndices=null, rowOffset=null) {
        if(selectedIndices === null) {
            const {cursorIndex} = this.trackerGetCursorInfo(cursorOffset);
            selectedIndices = [];
            if(cursorIndex !== null)
                selectedIndices = [cursorIndex];
        }
        // if(selectedIndices === null)
        //     selectedIndices = [];
        return this.selectIndices(selectedIndices, cursorOffset, rowOffset);

        // const selectedIndex = this.findInstructionIndexFromCursorOffset(cursorOffset);
        // console.log('setCursorOffset', cursorOffset, selectedIndex);
        // this.playSelectedInstructions();
    }

    selectIndices(selectedIndices, cursorOffset=null, rowOffset=null) {
        return this.getComposer().trackerSelectIndices(this.getTrackName(), selectedIndices, cursorOffset, rowOffset);
        // TODO: get song position by this.props.index
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
        const trackStartPosition = this.getStartPosition();
        const songPosition = this.getComposer().state.songPosition;
        const trackSongPosition = songPosition - trackStartPosition;
        let trackSongPositionFound = false;
        // const quantizationTicks = trackState.quantizationTicks || this.getSong().data.timeDivision;

        // console.time('Tracker.renderRowContent()');
        const rowLength = this.getRowLength();
        const rowOffset = this.getRowOffset();
        const cursorOffset = this.getCursorOffset() ;
        const selectedIndices = this.getSelectedIndices();

        const rowContent = [];

        const iterator = this.instructionGetQuantizedIterator();
        // let cursorPosition = 0, rowCount = 0; // , lastPositionTicks = 0;
        let rowInstructionElms = [];
        while(iterator.nextQuantizedInstructionRow(() => {
            if(iterator.rowCount < rowOffset)
                return;
            let nextRowPositionTicks = iterator.getNextRowPositionTicks();
            let rowDeltaDuration = nextRowPositionTicks - iterator.positionTicks;
            if (rowDeltaDuration <= 0) {
                console.warn("rowDeltaDuration is ", rowDeltaDuration);
            }

            let highlight = false;
            if(!trackSongPositionFound && trackSongPosition <= iterator.positionSeconds) {
                trackSongPositionFound = true;
                highlight = true;
            }
            const newRowElm = <TrackerRow
                key={iterator.rowCount}
                tracker={this}
                positionTicks={iterator.positionTicks}
                positionSeconds={iterator.positionSeconds}
                deltaDuration={rowDeltaDuration}
                cursorPosition={iterator.cursorPosition}
                cursor={iterator.cursorPosition === cursorOffset}
                highlight={highlight}

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

    /** Playback **/

    playSelectedInstructions() {
        return this.playInstructions(this.getSelectedIndices());
    }

    playInstructions(selectedIndices, stopPlayback=true) {
        // console.log("Tracker.playInstructions", selectedIndices);
        this.getComposer().trackerPlay(this.getTrackName(), selectedIndices, stopPlayback)
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
        let selectedIndices;
        switch(e.key) {
            // case 'Delete':
            //     break;
            //
            // case 'Escape':
            // case 'Backspace':
            //     break;
            //
            case 'Enter':
                this.getComposer().instructionInsert();
                break;
            //
            // case 'Play':
            //     break;
            //
            case 'ArrowRight':
                const {nextOffset} = this.trackerGetCursorInfo();
                e.preventDefault();
                selectedIndices = this.setCursorOffset(nextOffset);
                this.playInstructions(selectedIndices);
                break;

            case 'ArrowLeft':
                e.preventDefault();
                const {previousOffset} = this.trackerGetCursorInfo();
                if(previousOffset >= 0) {
                    selectedIndices = this.setCursorOffset(previousOffset);
                    this.playInstructions(selectedIndices);
                }
                break;

            case 'ArrowUp':
                e.preventDefault();
                const {previousRowOffset} = this.trackerGetCursorInfo();
                if(previousRowOffset >= 0) {
                    selectedIndices = this.setCursorOffset(previousRowOffset);
                    this.playInstructions(selectedIndices);
                }
                break;

            case 'ArrowDown':
                e.preventDefault();
                const {nextRowOffset} = this.trackerGetCursorInfo();
                selectedIndices = this.setCursorOffset(nextRowOffset);
                this.playInstructions(selectedIndices);
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
                        await this.getComposer().instructionReplaceCommandSelected(keyboardCommand);

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
