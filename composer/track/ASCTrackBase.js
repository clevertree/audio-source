import * as React from "react";
import PropTypes from 'prop-types';

import {ASCTrackInstruction, ASCTrackRow} from "./";
import {ASUIButton, ASUIButtonDropDown, ASUIPanel} from "../../components/";
import ActiveTrackState from "./state/ActiveTrackState";

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
        return this.destination = this.getComposer().getVolumeGain();
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


    trackerGetCursorInfo(cursorOffset=null) {
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


    /** Render Content **/

    renderRowContent() {
        const trackState = this.getTrackState();
        const songPosition = this.getComposer().state.songPosition;
        const trackSongPosition = songPosition - trackState.startPosition;
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
        while(iterator.nextQuantizedInstructionRow(() => {
            let highlight = false;
            if(iterator.positionTicks % beatsPerMeasureTicks === 0)
                highlight = 'measure-start';
            if(!trackSongPositionFound && trackSongPosition <= iterator.positionSeconds) {
                trackSongPositionFound = true;
                highlight = 'position';
            }

            if(iterator.rowCount < trackState.rowOffset)
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
                cursor={iterator.cursorPosition === trackState.cursorOffset}
                highlight={highlight}

            >{rowInstructionElms}</ASCTrackRow>;
            rowContent.push(newRowElm);
            rowInstructionElms = [];

        }, (instruction) => {
            if(iterator.rowCount < trackState.rowOffset)
                return;
            const index = iterator.currentIndex;
            rowInstructionElms.push(<ASCTrackInstruction
                key={index}
                index={index}
                instruction={instruction}
                tracker={this}
                cursorPosition={iterator.cursorPosition}
                cursor={iterator.cursorPosition === trackState.cursorOffset}
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
        const rowOffset = trackState.rowOffset;
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

        const rowDeltaDuration = composer.values.formatSongDuration(trackState.quantizationTicks);
        buttons.push(<ASUIButtonDropDown
            className="row-quantization"
            title={`Quantization (Duration = ${rowDeltaDuration})`}
            arrow="▼"
            key="row-quantization"
            options={() => this.getComposer().renderMenuTrackerSetQuantization(this.getTrackName())}
            children={rowDeltaDuration}
        />);

        return buttons;
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

