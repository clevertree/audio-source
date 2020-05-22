import * as React from "react";
import PropTypes from 'prop-types';

import ASCTrackInstruction from "./instruction/ASCTrackInstruction";
import ASCTrackRow from "./row/ASCTrackRow";
import {ASUIButton, ASUIButtonDropDown} from "../../components/";
import PromptManager from "../../common/prompt/PromptManager.native";
import {ASCTrack} from "./index";
import TrackInstructionRowIterator from "./instruction/TrackInstructionRowIterator";
import {Instruction} from "../../song";


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
    // getCursorPositionTicks() { return this.state.cursorPositionTicks || 0; }

    getSelectedIndices() { return this.state.selectedIndices || []; }
    getPlayingIndices() { return this.state.playingIndices || []; }

    getRowLength() { return typeof this.state.rowLength !== "undefined" ? this.state.rowLength : ASCTrackBase.DEFAULT_ROW_LENGTH; }
    getRowOffset() { return this.state.rowOffset || 0; }

    getDestinationList() { return this.state.destinationList || []; }

    getTrackLengthTicks() { return this.state.trackLengthTicks || null; }
    getSegmentLengthTicks() { return this.state.segmentLengthTicks || (this.getTimeDivision() * ASCTrackBase.DEFAULT_BEATS_PER_SEGMENT); }
    // getSegmentPositions() { return this.state.segmentPositions || [0]; }

    getStartPosition() { return this.state.startPosition || 0; }



    constructor(props) {
        super(props);

        if(!props.composer)
            throw new Error("Invalid composer");
        this.state = Object.assign({}, {
            selectedIndices: [],
            playingIndices: [],
            rowOffset: 0,
            cursorOffset: 0,
            // segmentPositions: [0],
            trackLengthTicks: null,
        }, this.props.trackState);
        // this.firstCursorRowOffset = null;
        // this.lastCursorRowOffset = null;
        this.cb = {
            onKeyDown: (e) => this.onKeyDown(e),
            onWheel: e => this.onWheel(e)
        };
        this.destination = null;
        // this.cursorInstruction = React.createRef();
        // this.trackerGetCursorInfo();
        console.log('ASCTrackBase.constructor', this.state);

        this.getPositionInfo(this.getSegmentLengthTicks());
        this.getPositionInfo(this.getSegmentLengthTicks()*2);
        this.getPositionInfo(this.getSegmentLengthTicks()*3);
    }

    componentDidMount() {
        this.updateTrackLengthInTicks();
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

    getIterator() {
        return TrackInstructionRowIterator.getIteratorFromSong(
            this.getSong(),
            this.getTrackName(),
            this.getQuantizationTicks(),
            this.getTimeDivision(), // || this.getSong().data.timeDivision,
            this.getBeatsPerMinute(), //  || this.getSong().data.beatsPerMinute
        )
    }


    /** Actions **/

    setCursorPositionTicks(positionTicks) {
        const {cursorOffset, rowCount} = this.getPositionInfo(positionTicks);
        console.log('setCursorPositionTicks', {positionTicks, cursorOffset, rowCount});
        this.setCursorPositionOffset(cursorOffset);
        this.setRowOffset(rowCount);
    }

    setRowOffset(rowOffset) {
        if(rowOffset < 0)
            rowOffset = 0;
        // console.log('rowOffset', rowOffset);
        this.setState({rowOffset});
    }

    setCursorPositionOffset(cursorOffset) {
        // console.log('setCursorPositionOffset', cursorOffset);
        if(cursorOffset < 0)
            cursorOffset = 0;
        this.setState({cursorOffset});
    }


    selectIndicesAndPlay(selectedIndices, clearSelection=true, stopPlayback=true) {
        selectedIndices = this.selectIndices(selectedIndices, clearSelection);
        this.playInstructions(selectedIndices, stopPlayback)
    }

    selectIndices(selectedIndices, clearSelection=true, selectTrack=true) {
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
        if(selectTrack)
            this.getComposer().trackSelect(this.getTrackName());
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
        const iterator = this.getIterator();

        const rowContent = [];
        let rowInstructionElms = [];

        while(rowContent.length < this.getRowLength()) {
            const nextCursorEntry = iterator.nextCursorPosition();
            if(nextCursorEntry instanceof Instruction) {
                const instruction = nextCursorEntry; //iterator.currentInstruction();
                // console.log('instruction', instruction);
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
            } else {
                const rowDeltaTicks = nextCursorEntry;
                let highlight = false;
                if(iterator.positionTicks % beatsPerMeasureTicks === 0)
                    highlight = 'measure-start';
                if(!trackSongPositionFound && trackSongPosition <= iterator.positionSeconds) {
                    trackSongPositionFound = true;
                    highlight = 'position';
                }

                // if(this.firstCursorRowOffset === null)
                //     this.firstCursorRowOffset = iterator.cursorPosition;

                // let nextRowPositionTicks = iterator.getNextRowPositionTicks();
                // let rowDeltaDuration = nextRowPositionTicks - iterator.positionTicks;
                if (rowDeltaTicks <= 0 || rowDeltaTicks > quantizationTicks) {
                    console.warn(`rowDeltaTicks is ${rowDeltaTicks} > ${quantizationTicks}`);
                }

                const rowID = iterator.rowCount;
                if(rowID >= rowOffset) {
                    const newRowElm = <ASCTrackRow
                        key={rowID}
                        tracker={this}
                        positionTicks={iterator.positionTicks}
                        positionSeconds={iterator.positionSeconds}
                        deltaDuration={rowDeltaTicks}
                        cursorPosition={iterator.cursorPosition}
                        cursor={iterator.cursorPosition === cursorOffset}
                        highlight={highlight}

                    >{rowInstructionElms}</ASCTrackRow>;
                    rowContent.push(newRowElm);
                }

                rowInstructionElms = [];
            }
        }

        // this.lastCursorRowOffset = iterator.cursorPosition;
        // console.log('cursorRowOffset', this.firstCursorRowOffset, this.lastCursorRowOffset);

        // console.timeEnd('ASCTrack.`render`RowContent()');
        return rowContent;
    }


    renderRowSegments() {
        // const rowOffset = this.state.rowOffset;
        // const rowLength = this.getRowLength();
        const segmentLengthTicks = this.getSegmentLengthTicks();
        const trackLengthTicks = this.getTrackLengthTicks() + segmentLengthTicks;

        let buttons = [];
        // const segmentPositions = this.getSegmentPositions();

        // console.log('renderRowSegments', segmentPositions);
        for(let i=0; i<=ASCTrackBase.DEFAULT_MIN_SEGMENTS+1; i++) {
            const positionTicks = i * segmentLengthTicks;
            if(buttons.length > ASCTrackBase.DEFAULT_MAX_SEGMENTS
            || positionTicks > trackLengthTicks)
                break;
            const props = {
                onAction: e => this.setCursorPositionTicks(positionTicks),
                children: i
            }
            // if(selectedSegmentID === null && rowOffset - rowLength < positionTicks) {
            //     selectedSegmentID = positionTicks;
            //     props.selected = true;
            // }
            buttons.push(<ASUIButton
                key={positionTicks}
                {...props}
            />);
        }

        // console.log('renderRowSegments',  this.getTrackName(), {segmentLength: segmentLengthTicks, trackLengthTicks, buttons});

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

    /** Actions **/


    changeQuantization(quantizationTicks) {
        if (!quantizationTicks || !Number.isInteger(quantizationTicks))
            throw new Error("Invalid quantization value");
        console.info('changeQuantization', quantizationTicks);
        this.setState({quantizationTicks}); // , () => this.updateSegmentInfo()
    }

    async changeQuantizationPrompt(quantizationTicks = null) {
        quantizationTicks = await PromptManager.openPromptDialog(`Enter custom tracker quantization in ticks:`, quantizationTicks || this.track.quantizationTicks);
        this.changeQuantization(quantizationTicks)
    }


    changeRowLength(rowLength = null) {
        if (!Number.isInteger(rowLength))
            throw new Error("Invalid track row length value");
        this.setState({rowLength})
    }

    async changeRowLengthPrompt(rowLength=null) {
        rowLength = parseInt(await PromptManager.openPromptDialog(`Enter custom tracker segment length in rows:`, rowLength || this.track.rowLength));
        this.changeRowLength(rowLength);
    }

    /**
     * Used when track has been modified
     */
    updateTrackLengthInTicks(trackLengthTicks=null) {
        if(trackLengthTicks === null) {
            const iterator = this.getIterator();
            iterator.seekToEnd();
            trackLengthTicks = iterator.positionTicks;
        }
        if(this.state.trackLengthTicks !== trackLengthTicks)
            this.setState({
                trackLengthTicks,
            });
        // const qIterator = this.getQuantizedIterator();
        // const segmentLengthTicks = this.getSegmentLengthTicks();
        // const segmentPositions = [];
        // const segmentLimit = ASCTrack.DEFAULT_MIN_SEGMENTS || 3;
        // let lastSegmentPositionTicks = 0;
        // while ( qIterator.positionTicks < trackLengthTicks
        // || segmentPositions.length < segmentLimit) {
        //     if(lastSegmentPositionTicks <= qIterator.positionTicks) {
        //         // Found end of segment
        //         segmentPositions.push(qIterator.rowCount);
        //         lastSegmentPositionTicks += segmentLengthTicks;
        //     }
        //     qIterator.nextQuantizedInstructionRow();
        // }

        // console.log('updateSegmentInfo', segmentPositions, trackLengthTicks, this.state);
        this.setState({
            trackLengthTicks,
            // segmentPositions,
        });
    }


    /**
     * Used when selecting
     * @param cursorOffset
     * @returns {{positionTicks: PositionTickInfo[] | number, cursorRow, positionSeconds, previousOffset: number, nextRowOffset, cursorIndex: null, adjustedCursorRow, nextOffset: *, previousRowOffset}}
     */
    cursorGetInfo(cursorOffset=null) {
        cursorOffset = cursorOffset === null ? this.state.cursorOffset : cursorOffset;
        // rowOffset = rowOffset === null ? this.state.rowOffset : rowOffset;
        if(!Number.isInteger(cursorOffset))
            throw new Error("Invalid cursorOffset: " + cursorOffset);
        // cursorOffset = cursorOffset === null ? trackState.cursorOffset : cursorOffset;
        const iterator = this.getIterator();
        let cursorIndex = null, cursorRow=null;
        let lastRowPositions=[], positions=[[0]];
        // let indexFound = null;
        while(positions.length < 3 || positions[2][0] <= cursorOffset) {
            iterator.nextCursorPosition();
            lastRowPositions.push(iterator.cursorPosition);
            if(iterator.cursorPositionIsInstruction) {
            } else {
                positions.push(lastRowPositions);
                if(positions.length > 3)
                    positions.shift();
                lastRowPositions = [];
            }
            if(cursorOffset === iterator.cursorPosition) {
                cursorRow = iterator.rowCount;
                if (iterator.currentIndex !== null)
                    cursorIndex = iterator.currentIndex;
            }
        }
        const column = positions[1].indexOf(cursorOffset);

        const ret = {
            cursorIndex,
            // column,
            cursorRow,
            nextRowOffset: positions[2][column] || positions[2][positions[2].length-1],
            previousRowOffset: positions[0][column] || 0,
            nextCursorOffset: cursorOffset + 1,
            previousCursorOffset: cursorOffset > 0 ? cursorOffset - 1 : 0,
            positionTicks: iterator.positionTicks,
            positionSeconds: iterator.positionSeconds,
            // cursorRowLow: cursorRow - this.getRowLength(),
            // cursorRowHigh: cursorRow - 1,
        };
        // console.log(cursorOffset, ret);
        return ret;
    }

    getPositionInfo(positionTicks) {
        if(!Number.isInteger(positionTicks))
            throw new Error("Invalid positionTicks: " + positionTicks);

        const iterator = this.getIterator();
        iterator.seekToPositionTicks(positionTicks)
        // let indexFound = null;
        // while(iterator.positionTicks < positionTicks) {
        //     iterator.nextQuantizedInstructionRow();
        // }

        const ret = {
            positionTicks,
            positionIndex: iterator.currentIndex,
            positionSeconds: iterator.positionSeconds,
            cursorOffset: iterator.cursorPosition,
            rowCount: iterator.rowCount,
        }
        console.info('getPositionInfo', ret);
        return ret;
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
        // console.log(e.type, e.key, e.ctrlKey);
        if(e.isDefaultPrevented())
            return;
        if(e.ctrlKey) switch(e.key) {
            case 'x': this.getComposer().instructionCut(this.getTrackName()); return;
            case 'c': this.getComposer().instructionCopy(this.getTrackName()); return;
            case 'v': this.getComposer().instructionPasteAtCursor(this.getTrackName()); return;
            default: break;
        }
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
                this.setCursorPositionOffset(targetCursorOffset);
                const targetCursorInfo = this.cursorGetInfo(targetCursorOffset)
                    //, targetCursorInfo.adjustedCursorRow
                if(targetCursorInfo.cursorIndex !== null) {
                    if(e.ctrlKey) {
                        this.selectIndicesAndPlay(targetCursorInfo.cursorIndex, !e.shiftKey);
                    }
                }

                if(targetCursorInfo.cursorRow > this.getRowOffset() + (this.getRowLength() - 1))
                    this.setRowOffset(targetCursorInfo.cursorRow - (this.getRowLength() - 1))
                else if(targetCursorInfo.cursorRow < this.getRowOffset())
                    this.setRowOffset(targetCursorInfo.cursorRow)
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

