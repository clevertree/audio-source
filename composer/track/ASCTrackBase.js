import * as React from "react";
import PropTypes from 'prop-types';

import ASCTrackInstruction from "./instruction/ASCTrackInstruction";
import ASCTrackRow from "./row/ASCTrackRow";
import {ASUIButton, ASUIButtonDropDown} from "../../components/";
import PromptManager from "../../common/prompt/PromptManager";
import TrackInstructionRowIterator from "./instruction/TrackInstructionRowIterator";
import {InstructionIterator} from "../../song";
import ASCTrackRowContainer from "./row-container/ASCTrackRowContainer";


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
    static DEFAULT_MIN_SEGMENTS = 4;

    constructor(props) {
        super(props);

        if(!props.composer)
            throw new Error("Invalid composer");
        this.state = this.props.trackState || {
            // selectedIndices: [],
            playingIndices: [],
            rowOffset: 0,
            cursorOffset: 0,
            // segmentPositions: [0],
            trackLengthTicks: null,
        };
        // this.firstCursorRowOffset = null;
        // this.lastCursorRowOffset = null;
        this.cb = {
            // onKeyDown: (e) => this.onKeyDown(e),
            // onWheel: e => this.onWheel(e),
            // options: () => this.renderContextMenu()
        };
        this.destination = null;
        // this.cursorInstruction = React.createRef();
        // this.trackerGetCursorInfo();
        console.log('ASCTrackBase.constructor', this.state);

        // this.getPositionInfo(this.getSegmentLengthTicks());
        // this.getPositionInfo(this.getSegmentLengthTicks()*2);
        // this.getPositionInfo(this.getSegmentLengthTicks()*3);
    }

    componentDidMount() {
        this.updateRenderingProps();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(this.props.trackState !== prevProps.trackState) {
            console.log('componentDidUpdate', this.props.trackName, prevProps.trackState, this.props.trackState);
            this.setState(this.props.trackState);
        }
    }

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
    getSelectedIndices() {
        if(this.isSelectedTrack())
            return this.getComposer().state.selectedTrackIndices;
        return [];
    }

    getPlayingIndices() { return this.state.playingIndices || []; }
    getRowLength() { return typeof this.state.rowLength !== "undefined" ? this.state.rowLength : ASCTrackBase.DEFAULT_ROW_LENGTH; }

    getRowOffset() { return this.state.rowOffset || 0; }

    getDestinationList() { return this.state.destinationList || []; }
    getTrackLengthTicks() { return this.state.trackLengthTicks || null; }
    getSegmentLengthTicks() { return this.state.segmentLengthTicks || (this.getTimeDivision() * ASCTrackBase.DEFAULT_BEATS_PER_SEGMENT); }

    getSegmentRowOffsets() { return this.state.segmentRowOffsets || [0]; }

    getStartPosition() { return this.state.startPosition || 0; }

    isSelectedTrack() {
        return this.props.trackName === this.props.composer.state.selectedTrack;
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

    getRowIterator() {
        return TrackInstructionRowIterator.getIteratorFromSong(
            this.getSong(),
            this.getTrackName(),
            {
                quantizationTicks: this.getQuantizationTicks(),
                timeDivision: this.getTimeDivision(), // || this.getSong().data.timeDivision,
                beatsPerMinute: this.getBeatsPerMinute(), //  || this.getSong().data.beatsPerMinute
            }
        )
    }


    getIterator() {
        return InstructionIterator.getIteratorFromSong(
            this.getSong(),
            this.getTrackName(),
            {
                timeDivision: this.getTimeDivision(), // || this.getSong().data.timeDivision,
                beatsPerMinute: this.getBeatsPerMinute(), //  || this.getSong().data.beatsPerMinute
            }
        )
    }




    /** Actions **/

    toggleDropDownMenu(menuOpen = !this.state.menuOpen) {
        this.setState({menuOpen});
    }

    changeQuantization(quantizationTicks) {
        if (!quantizationTicks || !Number.isInteger(quantizationTicks))
            throw new Error("Invalid quantization value");
        this.updateRenderingProps(quantizationTicks);
    }

    async changeQuantizationPrompt(quantizationTicks = null) {
        quantizationTicks = await PromptManager.openPromptDialog(`Enter custom tracker quantization in ticks:`, quantizationTicks || this.track.quantizationTicks);
        this.changeQuantization(quantizationTicks)
    }


    changeRowLength(rowLength = null) {
        if (!Number.isInteger(rowLength))
            throw new Error("Invalid track row length value");
        this.updateRenderingProps(null, rowLength);
    }

    async changeRowLengthPrompt(rowLength=null) {
        rowLength = parseInt(await PromptManager.openPromptDialog(`Enter custom tracker segment length in rows:`, rowLength || this.track.rowLength));
        this.changeRowLength(rowLength);
    }

    /**
     * Used when track has been modified
     */
    updateRenderingProps(quantizationTicks=null, rowLength=null) {
        quantizationTicks = quantizationTicks || this.getQuantizationTicks();
        rowLength = rowLength || this.getRowLength();
        const rowOffset = this.getRowOffset();
        const segmentLengthTicks = this.getSegmentLengthTicks();

        const iterator = this.getIterator();
        iterator.seekToEnd();
        const trackEndTicks = iterator.getPositionInTicks() + segmentLengthTicks * 2;

        // TODO: inefficient
        const segmentRowOffsets = [];
        const rowIterator = this.getRowIterator();
        // let lastSegmentPositionTicks = 0;
        let nextRowOffset = 0;
        while(true) {
            const positionTicks = rowIterator.getPositionInTicks();
            if(positionTicks >= trackEndTicks
                && segmentRowOffsets.length >= ASCTrackBase.DEFAULT_MIN_SEGMENTS)
                break;
            if(segmentRowOffsets.length >= ASCTrackBase.DEFAULT_MAX_SEGMENTS)
                break;
            const instructionData = rowIterator.nextCursorPosition();
            if(Array.isArray(instructionData)) {
            } else {
                // Row
                const currentRowOffset = rowIterator.getRowCount();
                if(nextRowOffset <= currentRowOffset) {
                    // lastSegmentPositionTicks += segmentLengthTicks;
                    segmentRowOffsets.push(currentRowOffset);
                    nextRowOffset += rowLength;
                }
            }
        }

        console.log('updateRenderingProps', {
            trackEndTicks,
            quantizationTicks,
            rowLength
        }, segmentRowOffsets)

        this.setState({
            trackLengthTicks: trackEndTicks,
            quantizationTicks,
            rowLength,
            segmentRowOffsets
        });
        this.getComposer().saveStateWithTimeout();
    }



    // TODO: should set song position?
    setCursorPositionTicks(positionTicks) {
        const {cursorOffset, rowCount, positionSeconds} = this.getPositionInfo(positionTicks);
        console.log('setCursorPositionTicks', {positionTicks, cursorOffset, rowCount, positionSeconds});
        this.setCursorPositionOffset(cursorOffset, positionTicks);
        this.setRowOffset(rowCount);
        this.getComposer().setSongPosition(this.getStartPosition() + positionSeconds);

    }

    setRowOffset(rowOffset) {
        if(rowOffset < 0)
            rowOffset = 0;
        // console.log('rowOffset', rowOffset);
        this.setState({rowOffset});
    }

    setCursorPositionOffset(cursorOffset, cursorPositionTicks=null) {
        // console.log('setCursorPositionOffset', cursorOffset);
        if(cursorOffset < 0)
            cursorOffset = 0;
        if(cursorPositionTicks === null)
            cursorPositionTicks = this.cursorGetInfo(cursorOffset).positionTicks;
        this.setState({cursorOffset, cursorPositionTicks});
    }


    selectIndicesAndPlay(selectedIndices, clearSelection=true, stopPlayback=true) {
        selectedIndices = this.selectIndices(selectedIndices, clearSelection);
        this.playInstructions(selectedIndices, stopPlayback)
    }

    selectIndices(selectedIndices, clearSelection=true) {
        selectedIndices = this.getComposer().values.parseSelectedIndices(selectedIndices);
        // TODO: get song position by this.props.index
        if(!clearSelection && this.getSelectedIndices().length > 0)
            selectedIndices = selectedIndices.concat(this.getSelectedIndices());
        return this.getComposer().trackSelect(this.getTrackName(), selectedIndices);
    }

    updatePlayingIndices(playingIndices) {
        this.setState({playingIndices});
    }



    /**
     * Used when selecting
     * @param {Integer} cursorOffset
     * @returns {{cursorRow: null, positionTicks: null, nextCursorOffset: *, previousCursorOffset: number, positionSeconds: number, cursorIndex: null}}
     */
    cursorGetInfo(cursorOffset=null) {
        cursorOffset = cursorOffset === null ? this.state.cursorOffset : cursorOffset;
        // rowOffset = rowOffset === null ? this.state.rowOffset : rowOffset;
        if(!Number.isInteger(cursorOffset))
            throw new Error("Invalid cursorOffset: " + cursorOffset);
        // cursorOffset = cursorOffset === null ? trackState.cursorOffset : cursorOffset;
        const iterator = this.getRowIterator();

        const ret = {
            cursorIndex: null,
            cursorRow: null,
            nextCursorOffset: cursorOffset + 1,
            previousCursorOffset: cursorOffset > 0 ? cursorOffset - 1 : 0,
            positionTicks: null,
            positionSeconds: 0,
            // cursorRowLow: cursorRow - this.getRowLength(),
            // cursorRowHigh: cursorRow - 1,
        };

        let lastRowPositions=[], positions=[[0]];
        // let indexFound = null;
        while(positions.length < 3 || positions[2][0] <= cursorOffset) {
            const instructionData = iterator.nextCursorPosition();
            lastRowPositions.push(iterator.getCursorPosition());
            if(Array.isArray(instructionData)) {

                if(cursorOffset === iterator.getCursorPosition()) {
                    if (iterator.getIndex() !== null)
                        ret.cursorIndex = iterator.getIndex();
                }
            } else {
                positions.push(lastRowPositions);
                if(positions.length > 3)
                    positions.shift();
                lastRowPositions = [];
                if(cursorOffset === iterator.getCursorPosition()) {
                    ret.cursorRow = iterator.getRowCount();
                    ret.positionTicks = iterator.getPositionInTicks();
                    ret.positionSeconds = iterator.getPositionInSeconds();
                }
            }
        }
        const column = positions[1].indexOf(cursorOffset);

        ret.nextRowOffset = positions[2][column] || positions[2][positions[2].length-1];
        ret.previousRowOffset = positions[0][column] || 0;
        // console.log(cursorOffset, ret);
        return ret;
    }

    getPositionInfo(positionTicks) {
        if(!Number.isInteger(positionTicks))
            throw new Error("Invalid positionTicks: " + positionTicks);

        const iterator = this.getRowIterator();
        iterator.seekToPositionTicks(positionTicks)
        // let indexFound = null;
        // while(iterator.getPositionInTicks() < positionTicks) {
        //     iterator.nextQuantizedInstructionRow();
        // }

        const ret = {
            positionTicks,
            positionIndex: iterator.getIndex(),
            positionSeconds: iterator.getPositionInSeconds(),
            cursorOffset: iterator.getCursorPosition(),
            rowCount: iterator.getRowCount(),
        }
        // console.info('getPositionInfo', ret);
        return ret;
    }


    /** Render Content **/

    renderRowContainer() {
        return <ASCTrackRowContainer
            key="row-container"
            track={this}
        />
    }

    renderRowContent() {
        const songPosition = this.getComposer().state.songPosition;
        const trackSongPosition = songPosition - this.getStartPosition();
        const cursorOffset = this.getCursorOffset();
        const rowOffset = this.getRowOffset();
        let trackSongPositionFound = false;
        // const quantizationTicks = this.getQuantizationTicks() || this.getSong().data.timeDivision;

        // console.time('ASCTrack.renderRowContent()');
        const selectedIndices = this.getSelectedIndices();
        const playingIndices = this.getPlayingIndices();
        const beatsPerMeasureTicks = this.getBeatsPerMeasure() * this.getTimeDivision();
        const quantizationTicks = this.getQuantizationTicks();
        // const isSelectedTrack = this.isSelectedTrack();


        // Get Iterator
        const iterator = this.getRowIterator();

        const rows = [];
        let rowInstructions = [];

        while(rows.length < this.getRowLength()) {
            const nextCursorEntry = iterator.nextCursorPosition();
            if(Array.isArray(nextCursorEntry)) {
                const instructionData = nextCursorEntry; //iterator.currentInstruction();
                // console.log('instruction', instruction);
                const index = iterator.getIndex();
                const rowProp = {
                    key: index,
                    index: index,
                    instruction: instructionData,
                    tracker: this,
                    cursorPosition: iterator.getCursorPosition(),
                };
                if(iterator.getCursorPosition() === cursorOffset) {
                    rowProp.cursor = true;

                }
                if(selectedIndices.indexOf(index) !== -1)
                    rowProp.selected = true;
                if(playingIndices.indexOf(index) !== -1)
                    rowProp.playing = true;
                rowInstructions.push(rowProp)

            } else {
                const rowDeltaTicks = nextCursorEntry;
                let highlight = false;
                if(iterator.getPositionInTicks() % beatsPerMeasureTicks === 0)
                    highlight = 'measure-start';
                if(!trackSongPositionFound && trackSongPosition <= iterator.getPositionInSeconds()) {
                    trackSongPositionFound = true;
                    highlight = 'position';
                }

                // if(this.firstCursorRowOffset === null)
                //     this.firstCursorRowOffset = iterator.cursorPosition;

                // let nextRowPositionTicks = iterator.getNextRowPositionTicks();
                // let rowDeltaDuration = nextRowPositionTicks - iterator.getPositionInTicks();
                if (rowDeltaTicks <= 0 || rowDeltaTicks > quantizationTicks) {
                    console.warn(`rowDeltaTicks is ${rowDeltaTicks} > ${quantizationTicks}`);
                }

                const rowID = iterator.getRowCount();
                if(rowID >= rowOffset) {
                    const rowProp = {
                        key: rowID,
                        tracker: this,
                        positionTicks: iterator.getPositionInTicks(),
                        positionSeconds: iterator.getPositionInSeconds(),
                        deltaDuration: rowDeltaTicks,
                        cursorPosition: iterator.getCursorPosition(),
                        highlight: highlight,
                        children: rowInstructions
                    };
                    if(iterator.getCursorPosition() === cursorOffset) {
                        rowProp.cursor = true;
                        rowProp.highlight = 'cursor';
                    }
                    rows.push(rowProp);
                    // console.log(rowID, iterator.getPositionInTicks(), rowDeltaTicks, iterator.getPositionInTicks() + rowDeltaTicks);
                }

                rowInstructions = [];
            }
        }

        // this.lastCursorRowOffset = iterator.cursorPosition;
        // console.log('cursorRowOffset', this.firstCursorRowOffset, this.lastCursorRowOffset);

        // console.timeEnd('ASCTrack.`render`RowContent()');
        return rows.map(rowProp => {
            rowProp.children = rowProp.children.map(instructionProp => {
                if(instructionProp.cursor)
                    rowProp.highlight = 'cursor';
                return <ASCTrackInstruction
                    {...instructionProp}
                />
            })
            return <ASCTrackRow
                {...rowProp}
                // positionTicks={} deltaDuration={} tracker={} cursor={} cursorPosition={}
                />
        });
    }

    // TODO: pagination
    renderRowSegments() {
        let trackSongPositionFound = false;
        const cursorRowOffset = this.getRowOffset();
        const rowLength = this.getRowLength();
        const rowOffset = this.getRowOffset();
        let segmentRowOffsets = this.getSegmentRowOffsets();

        const nextSegmentRowOffset = segmentRowOffsets[segmentRowOffsets.length - 1] + rowLength;
        // if(rowOffset >= nextSegmentRowOffset) {
            segmentRowOffsets = segmentRowOffsets.slice();
            for(let i=nextSegmentRowOffset; i<=rowOffset+rowLength; i+=rowLength) {
                segmentRowOffsets.push(i);
            }
            console.log('segmentRowOffsets', rowOffset, segmentRowOffsets);
        // }

        let buttons = [];
        for(let i=0; i<segmentRowOffsets.length; i++) {
            const rowOffset = segmentRowOffsets[i];
            const props = {
                onAction: e => this.setRowOffset(rowOffset),
                children: i
            }
            if(!trackSongPositionFound && cursorRowOffset < rowOffset + rowLength) {
                trackSongPositionFound = true;
                props.className = 'selected';
            }
            buttons.push(<ASUIButton
                key={i}
                {...props}
            />);

        }

        // console.log('renderRowSegments',  this.getTrackName(), {cursorRowOffset});

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

}

