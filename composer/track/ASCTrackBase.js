import * as React from "react";
import PropTypes from 'prop-types';

import ASCTrackInstruction from "./instruction/ASCTrackInstruction";
import ASCTrackRow from "./row/ASCTrackRow";
import {ASUIButton, ASUIButtonDropDown} from "../../components/";
import {NoteInstruction} from "../../song/instruction";


// TODO: ASCTrackRowContainer
export default class ASCTrackBase extends React.Component {
    static DEFAULT_ROW_LENGTH = 16;
    static DEFAULT_BEATS_PER_SEGMENT = 16;
    static DEFAULT_BEATS_PER_MEASURE = 4;

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

    getComposer()               { return this.props.composer; }
    getSong()                   { return this.props.composer.song; }

    getTrackName()              { return this.props.trackName; }

    getTimeDivision() { return this.state.timeDivision || this.props.composer.song.data.timeDivision; }
    getQuantizationTicks() { return this.state.quantizationTicks || this.getTimeDivision(); }

    getBeatsPerMinute() { return this.state.beatsPerMinute || this.props.composer.song.data.beatsPerMinute; }
    getBeatsPerMeasure() { return this.state.beatsPerMeasure || this.props.composer.song.data.beatsPerMeasure || ASCTrackBase.DEFAULT_BEATS_PER_MEASURE; }

    // getProgramID() { return this.state.programID; }

    getCursorOffset() { return this.state.cursorOffset || 0; }
    getCursorPositionTicks() { return this.state.cursorPositionTicks || 0; }

    getSelectedIndices() { return this.state.selectedIndices || []; }
    getPlayingIndices() { return this.state.playingIndices || []; }

    getRowLength() { return typeof this.state.rowLength !== "undefined" ? this.state.rowLength : ASCTrackBase.DEFAULT_ROW_LENGTH; }
    getRowOffset() { return this.state.rowOffset || 0; }

    getDestinationList() { return this.state.destinationList || []; }

    getTrackLengthTicks() { return this.state.trackLengthTicks || null; }
    getSegmentLengthTicks() { return this.state.segmentLengthTicks || (this.getTimeDivision() * ASCTrackBase.DEFAULT_BEATS_PER_SEGMENT); }
    getSegmentPositions() { return this.state.segmentPositions || [0]; }

    getStartPosition() { return this.state.startPosition || 0; }



    constructor(props) {
        super(props);

        if(!props.composer)
            throw new Error("Invalid composer");
        this.state = this.props.trackState || { // TODO: Composer State is delayed
            selectedIndices: [],
            playingIndices: [],
            rowOffset: 0,
            cursorOffset: 0,
        }
        // this.firstCursorRowOffset = null;
        // this.lastCursorRowOffset = null;
        this.cb = {
            onKeyDown: (e) => this.onKeyDown(e),
            onWheel: e => this.onWheel(e)
        };
        this.destination = null;
        // this.cursorInstruction = React.createRef();
        // this.trackerGetCursorInfo();
        console.log('ASCTrackBase.constructor', this.state)
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

    cursorGetInfo(cursorOffset=null, rowOffset=null) {
        return this.getComposer().trackerGetCursorInfo(
            this.getTrackName(),
            cursorOffset === null ? this.state.cursorOffset : cursorOffset,
            rowOffset === null ? this.state.rowOffset : rowOffset);
    }


    instructionGetQuantizedIterator() {
        return this.getSong().instructionGetQuantizedIterator(
            this.getTrackName(),
            this.getQuantizationTicks(),
            this.getTimeDivision(),
            this.getBeatsPerMinute()
        )
    }



    /** Actions **/

    setCursorPosition(cursorOffset, rowOffset=null) {
        // console.log('setCursorPosition', cursorOffset, rowOffset);
        if(cursorOffset < 0)
            cursorOffset = 0;
        rowOffset = rowOffset === null ? this.state.rowOffset : rowOffset;
        this.setState({cursorOffset, rowOffset});
        // if(select) {
        //
        //     const cursorInfo = this.cursorGetInfo(cursorOffset);
        //     const selectedIndices = this.getSelectedIndices();
        //     if(cursorInfo.cursorIndex !== null) {
        //         selectedIndices.unshift(cursorInfo.cursorIndex);
        //         this.selectIndices(selectedIndices);
        //     }
        //     this.getComposer().setSongPosition(cursorInfo.positionSeconds + this.getStartPosition());
        // }
    }

    selectIndicesAndPlay(selectedIndices, clearSelection=true, stopPlayback=true) {
        selectedIndices = this.selectIndices(selectedIndices, clearSelection);
        this.playInstructions(selectedIndices, stopPlayback)
    }

    selectIndices(selectedIndices, clearSelection=true) {
        // TODO: get song position by this.props.index
        // let selectedIndices = await PromptManager.openPromptDialog("Enter selection: ", oldSelectedIndices.join(','));
        if (typeof selectedIndices === "string") {
            switch (selectedIndices) {
                case 'all':
                    selectedIndices = [];
                    const maxLength = this.getSong().instructionGetList(this.getTrackName()).length;
                    for (let i = 0; i < maxLength; i++)
                        selectedIndices.push(i);
                    break;
                case 'segment':
                    throw new Error('TODO');
                    // selectedIndices = [].map.call(this.querySelectorAll('asct-instruction'), (elm => elm.index));
                    break;
                case 'row':
                    throw new Error('TODO');
                case 'none':
                    selectedIndices = [];
                    break;
                default:
                    selectedIndices = selectedIndices.split(/[^0-9]/).map(index => parseInt(index));
                // throw new Error("Invalid selection: " + selectedIndices);
            }
        }

        if (typeof selectedIndices === 'number')
            selectedIndices = [selectedIndices];
        if(!clearSelection && this.getSelectedIndices().length > 0)
            selectedIndices = selectedIndices.concat(this.getSelectedIndices());
        // console.log('selectIndices', Array.isArray(selectedIndices), selectedIndices);
        if (!Array.isArray(selectedIndices))
            throw new Error("Invalid selection: " + selectedIndices);

        selectedIndices.forEach((index, i) => {
            if(typeof index !== "number")
                throw new Error(`Invalid selection index (${i}): ${index}`);
        });

        // Filter unique indices
        selectedIndices = selectedIndices.filter((v, i, a) => a.indexOf(v) === i && v !== null);
        // Sort indices
        selectedIndices.sort((a, b) => a - b);




        this.setState({selectedIndices});
        this.getComposer().updateCurrentInstruction(this.getTrackName(), selectedIndices);
        return selectedIndices;
    }

    updatePlayingIndices(playingIndices) {
        this.setState({playingIndices});
    }

    /** Render Content **/

    renderRowContent() {
        const songPosition = this.getComposer().state.songPosition;
        const trackSongPosition = songPosition - this.getStartPosition();
        const cursorOffset = this.state.cursorOffset;
        const rowOffset = this.state.rowOffset;
        let trackSongPositionFound = false;
        // const quantizationTicks = this.getQuantizationTicks() || this.getSong().data.timeDivision;

        // console.time('ASCTrack.renderRowContent()');
        const selectedIndices = this.getSelectedIndices();
        const playingIndices = this.getPlayingIndices();
        const beatsPerMeasureTicks = this.getBeatsPerMeasure() * this.getTimeDivision();
        const quantizationTicks = this.getQuantizationTicks();


        // Get Iterator
        const iterator = this.getSong().instructionGetQuantizedIterator(
            this.getTrackName(),
            quantizationTicks,
            this.getTimeDivision(), // || this.getSong().data.timeDivision,
            this.getBeatsPerMinute() //  || this.getSong().data.beatsPerMinute
        )

        const rowContent = [];
        let rowInstructionElms = [];
        // eslint-disable-next-line no-loop-func
        // this.firstCursorRowOffset = null;
        // this.lastCursorRowOffset = null;
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
            // if(this.firstCursorRowOffset === null)
            //     this.firstCursorRowOffset = iterator.cursorPosition;

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
            if (rowContent.length >= this.getRowLength())
                break;
        }
        // this.lastCursorRowOffset = iterator.cursorPosition;
        // console.log('cursorRowOffset', this.firstCursorRowOffset, this.lastCursorRowOffset);

        // console.timeEnd('ASCTrack.renderRowContent()');
        return rowContent;
    }


    renderRowSegments() {
        const composer = this.props.composer;
        const rowOffset = this.state.rowOffset;
        const rowLength = this.getRowLength();

        // TODO: add next position segment

        let buttons = [], selectedSegmentID = null;
        const segmentPositions = this.getSegmentPositions();
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

        const rowDeltaDuration = composer.values.formatSongDuration(this.getQuantizationTicks());
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

        const rowLength = this.getRowLength();
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
        return this.playInstructions(this.getSelectedIndices());
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
        // let selectedIndices;
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
                await this.getComposer().instructionInsertAtCursorPrompt(null, null, false);
                await this.playSelectedInstructions();
                break;
            //
            case ' ':
            case 'Play':
                this.getComposer().songPlay(); // TODO: play track?
                break;

            case 'ArrowLeft':
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowRight':
                e.preventDefault();
                const currentCursorInfo = this.cursorGetInfo();
                let targetCursorOffset;
                switch(e.key) {
                    case 'ArrowRight':
                        targetCursorOffset = currentCursorInfo.nextCursorOffset;
                        break;

                    case 'ArrowLeft':
                        targetCursorOffset = currentCursorInfo.previousCursorOffset;
                        break;

                    case 'ArrowUp':
                        targetCursorOffset = currentCursorInfo.previousRowOffset;
                        break;

                    case 'ArrowDown':
                        targetCursorOffset = currentCursorInfo.nextRowOffset;
                        break;
                    default:
                        throw new Error("Invalid: " + e.key);
                }
                const targetCursorInfo = this.cursorGetInfo(targetCursorOffset)
                this.setCursorPosition(targetCursorOffset, targetCursorInfo.adjustedCursorRow);
                if(e.ctrlKey && targetCursorInfo.cursorIndex !== null) {
                    this.selectIndicesAndPlay(targetCursorInfo.cursorIndex, !e.shiftKey);
                }
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
                    // const selectedIndices = this.getSelectedIndices();
                    const {cursorIndex} = this.cursorGetInfo()
                    if(cursorIndex !== null) {
                        this.getComposer().instructionReplaceCommand(this.getTrackName(), cursorIndex, keyboardCommand);

                    } else {
                        this.getComposer().instructionInsertAtCursor(this.getTrackName(), keyboardCommand);
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

