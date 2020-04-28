/* eslint-disable no-loop-func */
import * as React from "react";
import PropTypes from 'prop-types';

import {ASCTrackInstruction, ASCTrackRow} from "./";
import {ASUIButton, ASUIButtonDropDown, ASUIPanel} from "../../components/";

import "./assets/ASCTrack.css";
import ActiveTrackState from "./ActiveTrackState";

class ASCTrack extends React.Component {
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
            this.getQuantizationInTicks(),
            trackState.timeDivision, // || this.getSong().data.timeDivision,
            trackState.beatsPerMinute //  || this.getSong().data.beatsPerMinute
        )
    }

    getQuantizationInTicks() {
        return this.props.quantizationTicks || this.props.composer.song.data.timeDivision;
    }

    getSegmentInfo() {
        const trackState = this.getTrackState();

        const currentSegmentID = Math.floor(trackState.rowOffset / trackState.rowLength);
        let segmentCount = trackState.segmentCount;
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

    renderRowSegments() {
        const composer = this.props.composer;
        const {segmentCount, currentSegmentID} = this.getSegmentInfo();

        const rowLength = this.getTrackState().rowLength;

        const buttons = [];

        // TODO: segment length is in rows or ticks?
        for (let segmentID = 0; segmentID <= segmentCount; segmentID++)
            buttons.push(<ASUIButton
                key={segmentID}
                selected={segmentID === currentSegmentID}
                onAction={e => composer.trackerSetRowOffset(this.props.trackName, segmentID * rowLength)}
                children={segmentID}
                />);

        buttons.push(<ASUIButtonDropDown
            className="row-length"
            title={`Segment Length (${rowLength} Rows)`}
            arrow="▼"
            key="row-length"
            options={() => this.getComposer().renderMenuTrackerSetSegmentLength(this.getTrackName())}
            children={rowLength}
            />);

        return buttons;
    }


    renderRowOptions() {
        const composer = this.props.composer;
        const rowDeltaDuration = composer.values.formatSongDuration(this.getQuantizationInTicks());

        const buttons = [];

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


    renderRowContent() {
        const trackState = this.getTrackState();
        const songPosition = this.getComposer().state.songPosition;
        const trackSongPosition = songPosition - trackState.startPosition;
        let trackSongPositionFound = false;
        // const quantizationTicks = trackState.quantizationTicks || this.getSong().data.timeDivision;

        // console.time('ASCTrack.renderRowContent()');
        const selectedIndices = trackState.selectedIndices;
        const playingIndices = trackState.playingIndices;
        // console.log('playingIndices', playingIndices);

        const rowContent = [];

        const iterator = this.instructionGetQuantizedIterator();
        // let cursorPosition = 0, rowCount = 0; // , lastPositionTicks = 0;
        let rowInstructionElms = [];
        while(iterator.nextQuantizedInstructionRow(() => {
            if(iterator.rowCount < trackState.rowOffset)
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

export default ASCTrack;
