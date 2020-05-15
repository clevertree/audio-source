import * as React from "react";
import PropTypes from 'prop-types';

import ASCTrackInstruction from "./instruction/ASCTrackInstruction";
import ASCTrackRow from "./row/ASCTrackRow";
import {ASUIButton, ASUIButtonDropDown} from "../../components/";
import ActiveTrackState from "./state/ActiveTrackState";


// TODO: ASCTrackRowContainer
export default class ASCTrackBase extends React.Component {
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

    static DEFAULT_MAX_SEGMENTS = 8;
    static DEFAULT_MIN_SEGMENTS = 3;

    constructor(props) {
        super(props);

        if(!props.composer)
            throw new Error("Invalid composer");
        this.state = { // TODO: Composer State is delayed
            rowOffset: 0,
            cursorOffset: 0,
        }
        this.cb = {
            onKeyDown: (e) => this.onKeyDown(e),
            onWheel: e => this.onWheel(e)
        };
        this.destination = null;
        // this.cursorInstruction = React.createRef();
        // this.trackerGetCursorInfo();
    }

    // getTrackInfo() {
    //     return new TrackInfo(this.props.trackName, this.props.composer);
    // }

    /** TODO: calculate correct destination **/
    getDestination()            {
        if(this.destination)
            return this.destination;
        console.warn('TODO: calculate correct destination');
        return this.destination = this.getComposer().getAudioContext();
    }
    getComposer()               { return this.props.composer; }
    getSong()                   { return this.props.composer.song; }

    getTrackName()              { return this.props.trackName; }
    getTrackState()             { return new ActiveTrackState(this.props.composer, this.props.trackName); }
    // getDestinationList()        { return this.getTrackState().destinationList; }
    // getSelectedIndices()        { return this.getTrackState().selectedIndices; }
    // getCursorOffset()           { return this.getTrackState().cursorOffset; }
    // getRowLength()              { return this.getTrackState().rowLength; }
    // getRowOffset()              { return this.getTrackState().rowOffset; }
    // getSegmentCount()           { return this.getTrackState().segmentCount; }
    // getStartPosition()          { return this.getTrackState().startPosition; }


    cursorGetInfo(cursorOffset=null) {
        return this.getComposer().trackerGetCursorInfo(this.getTrackName(), cursorOffset);
    }

    instructionGetQuantizedIterator() {
        const trackState = this.getTrackState();
        return this.getSong().instructionGetQuantizedIterator(
            this.getTrackName(),
            trackState.quantizationTicks,
            trackState.timeDivision, // || this.getSong().data.timeDivision,
            trackState.beatsPerMinute //  || this.getSong().data.beatsPerMinute
        )
    }

    // getQuantizationInTicks() {
    //     return this.props.quantizationTicks || this.props.composer.song.data.timeDivision;
    // }

    getSegmentInfo() {
    }


    /** Actions **/

    setCursorOffset(cursorOffset, selectedIndices=null, rowOffset=null) {
        if(selectedIndices === null) {
            const {cursorIndex} = this.cursorGetInfo(cursorOffset);
            selectedIndices = [];
            if(cursorIndex !== null)
                selectedIndices = [cursorIndex];
        }
        if(selectedIndices) {
            this.selectIndices(selectedIndices, cursorOffset, rowOffset);
        }
        this.setState({cursorOffset});
        // if(selectedIndices === null)
        //     selectedIndices = [];

        // const selectedIndex = this.findInstructionIndexFromCursorOffset(cursorOffset);
        // console.log('setCursorOffset', cursorOffset, selectedIndex);
        // this.playSelectedInstructions();


        // TODO: calculate row offset by segment:
        //     if(cursorOffset !== null) {
        //         const cursorInfo = this.trackerGetCursorInfo(trackName, cursorOffset);
        //         // trackState.cursorOffset = cursorOffset;
        //         // TODO: rowOffset = this.trackerGetCursorInfo(cursorOffset).adjustedCursorRow;
        //         // if (rowOffset !== null)
        //         if(cursorInfo.adjustedCursorRow !== null)
        //             trackState.rowOffset = cursorInfo.adjustedCursorRow;
        //         trackState.cursorPositionTicks = cursorInfo.positionTicks;
        //         state.songPosition = cursorInfo.positionSeconds + (trackState.startPosition || 0);
        //     }
    }

    selectIndices(selectedIndices, cursorOffset=null, rowOffset=null) {
        return this.getComposer().trackerSelectIndices(this.getTrackName(), selectedIndices, cursorOffset, rowOffset);
        // TODO: get song position by this.props.index
    }


    /** Render Content **/

    renderRowContent() {
        const trackState = this.getTrackState();
        const songPosition = this.getComposer().state.songPosition;
        const trackSongPosition = songPosition - trackState.startPosition;
        const cursorOffset = trackState.cursorOffset;
        const rowOffset = this.state.rowOffset;
        let trackSongPositionFound = false;
        // const quantizationTicks = trackState.quantizationTicks || this.getSong().data.timeDivision;

        // console.time('ASCTrack.renderRowContent()');
        const selectedIndices = trackState.selectedIndices;
        const playingIndices = trackState.playingIndices;
        const beatsPerMeasureTicks = trackState.beatsPerMeasure * trackState.timeDivision;
        const quantizationTicks = trackState.quantizationTicks;
        // const segmentLengthTicks = trackState.segmentLengthTicks;
        // console.log('beatsPerMeasureTicks', beatsPerMeasureTicks);


        // Get Iterator
        const iterator = this.getSong().instructionGetQuantizedIterator(
            this.getTrackName(),
            quantizationTicks,
            trackState.timeDivision, // || this.getSong().data.timeDivision,
            trackState.beatsPerMinute //  || this.getSong().data.beatsPerMinute
        )

        const rowContent = [];
        let rowInstructionElms = [];
        // eslint-disable-next-line no-loop-func
        while(iterator.nextQuantizedInstructionRow(() => {
            let highlight = false;
            if(iterator.positionTicks % beatsPerMeasureTicks === 0)
                highlight = 'measure-start';
            if(!trackSongPositionFound && trackSongPosition <= iterator.positionSeconds) {
                trackSongPositionFound = true;
                highlight = 'position';
            }

            if(iterator.rowCount < rowOffset)
                return;

            let nextRowPositionTicks = iterator.getNextRowPositionTicks();
            let rowDeltaDuration = nextRowPositionTicks - iterator.positionTicks;
            if (rowDeltaDuration <= 0 || rowDeltaDuration > quantizationTicks) {
                console.warn("rowDeltaDuration is ", rowDeltaDuration);
            }

            const newRowElm = <ASCTrackRow
                key={iterator.rowCount}
                tracker={this}
                positionTicks={iterator.positionTicks}
                positionSeconds={iterator.positionSeconds}
                deltaDuration={rowDeltaDuration}
                cursorPosition={iterator.cursorPosition}
                cursor={iterator.cursorPosition === cursorOffset}
                highlight={highlight}

            >{rowInstructionElms}</ASCTrackRow>;
            rowContent.push(newRowElm);
            rowInstructionElms = [];

            // eslint-disable-next-line no-loop-func
        }, (instruction) => {
            if(iterator.rowCount < rowOffset)
                return;
            const index = iterator.currentIndex;
            rowInstructionElms.push(<ASCTrackInstruction
                key={index}
                index={index}
                instruction={instruction}
                tracker={this}
                cursorPosition={iterator.cursorPosition}
                cursor={iterator.cursorPosition === cursorOffset}
                selected={selectedIndices.indexOf(index) !== -1}
                playing={playingIndices.indexOf(index) !== -1}
            />)

        })) {
            if (rowContent.length >= trackState.rowLength)
                break;
        }


        // console.timeEnd('ASCTrack.renderRowContent()');
        return rowContent;
    }


    renderRowSegments() {
        const composer = this.props.composer;
        const trackState = this.getTrackState();
        const rowOffset = this.state.rowOffset;
        const rowLength = trackState.rowLength;

        // TODO: add next position segment

        let buttons = [], selectedSegmentID = null;
        const segmentPositions = trackState.segmentPositions;
        for(let segmentID=0; segmentID<segmentPositions.length; segmentID++) {
            if(segmentID > ASCTrackBase.DEFAULT_MAX_SEGMENTS)
                break;
            const segmentPosition = segmentPositions[segmentID];
            const props = {
                onAction: e => composer.trackerSetRowOffset(this.props.trackName, segmentPosition),
                children: segmentID
            }
            if(selectedSegmentID === null && rowOffset - rowLength < segmentPosition) {
                selectedSegmentID = segmentID;
                props.selected = true;
            }
            buttons.push(<ASUIButton
                key={segmentID}
                {...props}
            />);
        }

        return buttons;
    }


    renderQuantizationButton() {
        const composer = this.props.composer;
        const trackState = this.getTrackState();

        const rowDeltaDuration = composer.values.formatSongDuration(trackState.quantizationTicks);
        return <ASUIButtonDropDown
            className="row-quantization"
            title={`Quantization (Duration = ${rowDeltaDuration})`}
            arrow="▼"
            options={() => this.getComposer().renderMenuTrackerSetQuantization(this.getTrackName())}
            children={rowDeltaDuration}
        />;
    }

    renderSelectTrackButton() {
        return <ASUIButton
            className="select-track"
            title={`Select Track: ${this.getTrackName()}`}
            onAction={() => this.getComposer().trackerSelect(this.getTrackName())}
            children={`▼`}
        />;
    }

    renderRowOptions() {
        // const composer = this.props.composer;

        const buttons = [];

        const rowLength = this.getTrackState().rowLength;
        buttons.push(<ASUIButtonDropDown
            className="row-length"
            title={`Segment Length (${rowLength} Rows)`}
            arrow="▼"
            key="row-length"
            options={() => this.getComposer().renderMenuTrackerSetSegmentLength(this.getTrackName())}
            children={`${rowLength} Rows`}
        />);


        return buttons;
    }

    /** Playback **/

    playSelectedInstructions() {
        return this.playInstructions(this.getTrackState().selectedIndices);
    }

    playInstructions(selectedIndices, stopPlayback=true) {
        // console.log("ASCTrack.playInstructions", selectedIndices);
        this.getComposer().trackerPlay(this.getTrackName(), selectedIndices, stopPlayback)
    }




    /** User Input **/

    async onKeyDown(e) {
        // console.log(e.type);
        if(e.isDefaultPrevented())
            return;
        let selectedIndices;
        switch(e.key) {
            case 'Delete':
                this.getComposer().instructionDeleteSelected();
                break;
            //
            // case 'Escape':
            // case 'Backspace':
            //     break;
            //
            case 'Enter':
                this.getComposer().instructionInsert();
                break;
            //
            case ' ':
            case 'Play':
                this.getComposer().songPlay(); // TODO: play track?
                break;

            case 'ArrowRight':
                const {nextOffset} = this.cursorGetInfo();
                e.preventDefault();
                selectedIndices = this.setCursorOffset(nextOffset);
                this.playInstructions(selectedIndices);
                break;

            case 'ArrowLeft':
                e.preventDefault();
                const {previousOffset} = this.cursorGetInfo();
                if(previousOffset >= 0) {
                    selectedIndices = this.setCursorOffset(previousOffset);
                    this.playInstructions(selectedIndices);
                }
                break;

            case 'ArrowUp':
                e.preventDefault();
                const {previousRowOffset} = this.cursorGetInfo();
                if(previousRowOffset >= 0) {
                    selectedIndices = this.setCursorOffset(previousRowOffset);
                    this.playInstructions(selectedIndices);
                }
                break;

            case 'ArrowDown':
                e.preventDefault();
                const {nextRowOffset} = this.cursorGetInfo();
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
                    const selectedIndices = this.getTrackState().selectedIndices;
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

