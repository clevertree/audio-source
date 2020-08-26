import * as React from "react";
import PropTypes from 'prop-types';

import {ASUIButton, ASUIButtonDropDown, ASUIGlobalContext} from "../../components/";
import PromptManager from "../../common/prompt/PromptManager";
import ASCTrackRowContainer from "./row-container/ASCTrackRowContainer";
import TrackState from "./state/TrackState";
import TrackInstructionRowIterator from "./instruction/TrackInstructionRowIterator";
import {InstructionIterator} from "../../song";


// TODO: ASCTrackRowContainer
export default class ASCTrackBase extends React.Component {
    static DEFAULT_ROW_LENGTH = 16;
    static DEFAULT_MEASURES_PER_SEGMENT = 4;
    static DEFAULT_BEATS_PER_MEASURE = 4;
    static DEFAULT_MAX_SEGMENTS = 8;
    static DEFAULT_MIN_SEGMENTS = 4;

    /** Global Context **/
    static contextType = ASUIGlobalContext;
    getGlobalContext()          { return this.context; }
    // setStatus(message)          { this.context.addLogEntry(message); }
    // setError(message)           { this.context.addLogEntry(message, 'error'); }
    getViewMode(viewKey)        { return this.context.getViewMode('track:' + viewKey); }
    setViewMode(viewKey, mode)  { return this.context.setViewMode('track:' + viewKey, mode); }

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
        // trackState: PropTypes.object.isRequired
    };


    constructor(props) {
        super(props);

        if(!props.composer)
            throw new Error("Invalid composer");
        const trackState = this.props.trackState || {};
        this.state = {
            rowOffset:      trackState.rowOffset || 0,
            cursorOffset:   trackState.cursorOffset || 0,
        };
        // this.firstCursorRowOffset = null;
        // this.lastCursorRowOffset = null;
        this.cb = {
            onClick: () => this.toggleViewMode()

            // onKeyDown: (e) => this.onKeyDown(e),
            // onWheel: e => this.onWheel(e),
            // options: () => this.renderContextMenu()
        };
        this.ref = {
            rowContainer: React.createRef()
        }
        this.destination = null;
        // this.cursorInstruction = React.createRef();
        // this.trackerGetCursorInfo();
        // console.log('ASCTrackBase.constructor', this.getTrackName(), this.state, trackState);

    }

    componentDidMount() {
        this.updateRenderingProps();
    }


    getComposer()           { return this.props.composer; }

    getSong()               { return this.props.composer.song; }

    getTrackName()          { return this.props.trackName; }
    getCursorOffset()       { return this.state.cursorOffset || 0; }
    getRowOffset()          { return this.state.rowOffset || 0; }

    getRowLength() { return typeof this.state.rowLength !== "undefined" ? this.state.rowLength : ASCTrackBase.DEFAULT_ROW_LENGTH; }


    getTimeDivision() { return this.state.timeDivision || this.props.composer.song.data.timeDivision; }

    getQuantizationTicks() { return this.state.quantizationTicks || this.getTimeDivision(); }
    getBeatsPerMinute() { return this.state.beatsPerMinute || this.props.composer.song.data.beatsPerMinute; }

    getBeatsPerMeasure() { return this.state.beatsPerMeasure || this.props.composer.song.data.beatsPerMeasure || TrackState.DEFAULT_BEATS_PER_MEASURE; }
    getMeasuresPerSegment() { return this.state.measuresPerSegment || TrackState.DEFAULT_MEASURES_PER_SEGMENT; }
    getBeatsPerSegment() { return this.getBeatsPerMeasure() * this.getMeasuresPerSegment(); }
    getSegmentLengthTicks() { return this.getBeatsPerSegment() * this.getTimeDivision(); }

    // getProgramID() { return this.state.programID; }
    // getCursorOffset() { return this.state.cursorOffset || 0; }

    // getCursorPositionTicks() { return this.state.cursorPositionTicks || 0; }

    getSelectedIndices() {
        if(this.isSelectedTrack())
            return this.props.composer.state.selectedTrackIndices;
        return [];
    }
    getPlayingIndices() { return this.state.playingIndices || []; }


    getDestinationList() { return this.state.destinationList || []; }
    getTrackLengthTicks() { return this.state.trackLengthTicks || null; }

    getSegmentRowOffsets() { return this.state.segmentRowOffsets || [0]; }

    getStartPosition() { return this.state.startPosition || 0; }

    isSelectedTrack() {
        return this.trackName === this.props.composer.getSelectedTrackName();
    }


    /** Actions **/

    toggleDropDownMenu(e) {
        const rowContainer = this.ref.rowContainer.current;
        if(rowContainer) {
            rowContainer.toggleDropDownMenu(e);
        } else {
            console.warn("Invalid rowContainer: ", rowContainer);
        }
    }


    /** TODO: calculate correct destination **/
    // getDestination()            {
    //     if(this.destination)
    //         return this.destination;
    //     console.warn('TODO: calculate correct destination');
    //     return this.destination = this.getComposer().getAudioContext();
    // }


    updateRenderingProps(quantizationTicks=null, rowLength=null) {
        // this.getTrackState()
        //     .updateRenderingProps(
        //         quantizationTicks,
        //         rowLength
        //     );
    }


    /** Actions **/

    toggleViewMode() {
        const viewKey = this.props.trackName;
        if(!viewKey)
            return console.warn("Invalid trackName prop");
        let viewMode = this.getViewMode(viewKey);
        viewMode = viewMode === true ? null : true;
        this.setViewMode(viewKey, viewMode);
    }

    async changeQuantizationPrompt(quantizationTicks = null) {
        quantizationTicks = await PromptManager.openPromptDialog(`Enter custom tracker quantization in ticks:`, quantizationTicks || this.track.quantizationTicks);
        this.getTrackState().changeQuantization(quantizationTicks)
    }


    async changeRowLengthPrompt(rowLength=null) {
        rowLength = parseInt(await PromptManager.openPromptDialog(`Enter custom tracker segment length in rows:`, rowLength || this.track.rowLength));
        this.getTrackState().changeRowLength(rowLength);
    }


    setCursorOffset(cursorOffset) {
        if(cursorOffset < 0)
            cursorOffset = 0;
        this.setState({cursorOffset}, () =>
            this.focusRowContainer());
    }

    setRowOffset(rowOffset) {
        if(rowOffset < 0)
            rowOffset = 0;
        // console.log('rowOffset', rowOffset);
        this.setState({rowOffset}, () =>
            this.focusRowContainer());
    }

    adjustRowOffset(cursorOffset=null) {
        cursorOffset = cursorOffset === null ? this.state.cursorOffset : cursorOffset;
        const trackState = this.getTrackState();
        const cursorInfo = trackState.getCursorInfo(cursorOffset);
        const rowLength = this.getRowLength();
        if(cursorInfo.cursorRow > this.getRowOffset() + (rowLength - 1))
            this.setRowOffset(cursorInfo.cursorRow - (rowLength - 1))
        else if(cursorInfo.cursorRow < this.getRowOffset())
            this.setRowOffset(cursorInfo.cursorRow)
        // else
        //     console.log("No adjustment: ", cursorInfo, cursorOffset);
    }



    /** Focus **/

    focus() {
        this.focusRowContainer();
    }

    focusRowContainer() {
        // TODO: if selected?
        // console.log('focusRowContainer');
        this.ref.rowContainer.current.focus();
    }

    /** Input **/

    handleMIDIInput(e) {
        // TODO: Send to song
        console.log('handleMIDIInput', e);
    }

    /** Selection **/

    selectActive() {
        this.getComposer().trackSelectActive(this.getTrackName());
    }

    // selectIndicesAndPlay(selectedIndices, clearSelection=true, stopPlayback=true) {
    //     selectedIndices = this.selectIndices(selectedIndices, clearSelection);
    //     this.playInstructions(selectedIndices, stopPlayback)
    // }

    selectIndices(selectedIndices, clearSelection=true, playback=true) {
        if (typeof selectedIndices === "string") {
            switch (selectedIndices) {
                case 'cursor':
                    const {cursorIndex} = this.cursorGetInfo();
                    selectedIndices = [cursorIndex];
                    break;

                case 'segment':
                    const {segmentID} = this.cursorGetInfo();
                    selectedIndices = this.getComposer()
                        .instructionGetIndicesInRange(
                            this.getTrackName(),
                            segmentID * this.getSegmentLengthTicks(),
                            (segmentID + 1) * this.getSegmentLengthTicks(),
                        )

                    break;
                // selectedIndices = [].map.call(this.querySelectorAll('asct-instruction'), (elm => elm.index));
                case 'row':
                    const {positionTicks} = this.cursorGetInfo();
                    selectedIndices = this.getComposer()
                        .instructionGetIndicesInRange(
                            this.getTrackName(),
                            positionTicks,
                            positionTicks+1,
                        )
                    break;
                // throw new Error("Invalid selection: " + selectedIndices);
                default:
                    break;
            }
        }

        return this.getComposer().trackSelectIndices(this.getTrackName(), selectedIndices, clearSelection, playback);
    }



    cursorGetInfo(cursorOffset=null) {
        return this.getTrackState().getCursorInfo(cursorOffset || this.getCursorOffset());
    }

    // getPositionInfo(positionTicks) {
    //     return this.getTrackState().getPositionInfo(positionTicks);
    // }

    /** @deprecated **/
    getTrackState() {
        return new TrackState(this.getComposer(), this.getTrackName());
    }



    /** Render Content **/

    renderRowContainer() {
        return <ASCTrackRowContainer
            key="row-container"
            ref={this.ref.rowContainer}
            track={this}
        />
    }

    // TODO: pagination
    renderRowSegments() {
        // const trackState = this.getTrackState();
        const cursorRowOffset = this.getRowOffset();
        // const rowLength = this.getRowLength();
        let segmentRowOffsets = this.getSegmentRowOffsets();
        // const segmentLengthTicks = this.getSegmentLengthTicks();
        // let nextSegmentPositionTicks = 0;

        const lastSegmentRowOffset = segmentRowOffsets[segmentRowOffsets.length - 1];
        const lastSegmentRowCount = lastSegmentRowOffset - segmentRowOffsets[segmentRowOffsets.length - 2];

        // if(rowOffset >= nextSegmentRowOffset) {
        segmentRowOffsets = segmentRowOffsets.slice();
        for(let i=lastSegmentRowOffset + lastSegmentRowCount; i<=cursorRowOffset+lastSegmentRowCount; i+=lastSegmentRowCount) {
            segmentRowOffsets.push(i);
        }
        // console.log('segmentRowOffsets', cursorRowOffset, segmentRowOffsets);
        // }

        let buttons = [];
        let selectedFound = false, firstButton=null;
        for(let i=0; i<segmentRowOffsets.length; i++) {
            const rowOffset = segmentRowOffsets[i];
            const nextRowOffset = segmentRowOffsets.length > i ? segmentRowOffsets[i+1] : null;
            const props = {
                onAction: e => this.setRowOffset(rowOffset),
                children: i
            }
            if(!selectedFound && (nextRowOffset === null || cursorRowOffset < nextRowOffset)) {
                selectedFound = true;
                props.className = 'selected';
            }
            buttons.push(props);
            if(buttons.length > TrackState.DEFAULT_MAX_SEGMENTS) {
                // if(buttons[0].className) {
                //     buttons.pop();
                // } else {
                const button = buttons.shift();
                if(!firstButton)
                    firstButton = button;
                // }
            }
        }
        // console.log('segmentRowOffsets', cursorRowOffset, segmentRowOffsets);

        if(firstButton)
            buttons.unshift(firstButton);
        // console.log('renderRowSegments',  this.getTrackName(), {cursorRowOffset});

        return buttons.map((props, i) => <ASUIButton
            key={i}
            {...props}
        />);
    }


    renderQuantizationButton() {
        const composer = this.props.composer;

        const quantizationTicks = this.getQuantizationTicks();
        const rowDeltaDuration = composer.values.formatSongDuration(quantizationTicks);
        return <ASUIButtonDropDown
            className="row-quantization"
            title={`Quantization (Duration = ${rowDeltaDuration})`}
            arrow="▼"
            options={() => this.getComposer().renderMenuTrackerSetQuantization(this.getTrackName(), quantizationTicks)}
            children={rowDeltaDuration}
        />;
    }

    renderSelectTrackButton() {
        return <ASUIButton
            className="select-track"
            title={`Select Track: ${this.getTrackName()}`}
            onAction={() => this.getComposer().trackSelectActive(this.getTrackName())}
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
        this.getComposer().trackPlay(this.getTrackName(), selectedIndices, stopPlayback)
    }

    /** Actions **/

    instructionPasteAtCursor() {
        let {positionTicks: startPositionTicks} = this.getCursorInfo(this.getCursorOffset());
        this.getComposer().instructionPasteAtPosition(this.getTrackName(), startPositionTicks);
    }

    instructionInsertAtCursor(newInstructionData) {
        let {positionTicks: startPositionTicks} = this.getCursorInfo(this.getCursorOffset());
        this.getComposer().instructionInsertAtPosition(this.getTrackName(), startPositionTicks, newInstructionData);
    }



    /** Track Cursor Position **/


    /**
     * Used when selecting
     * @param {Integer} cursorOffset
     * @returns {{cursorRow: null, positionTicks: null, nextCursorOffset: *, previousCursorOffset: number, positionSeconds: number, cursorIndex: null}}
     */
    getCursorInfo(cursorOffset) {
        if(!Number.isInteger(cursorOffset))
            throw new Error("Invalid cursorOffset: " + cursorOffset);
        // cursorOffset = cursorOffset === null ? trackState.cursorOffset : cursorOffset;
        const iterator = this.getRowIterator();

        const ret = {
            segmentID: null,
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

            if(cursorOffset === iterator.getCursorPosition()) {
                ret.cursorRow = iterator.getRowCount();
                ret.positionTicks = iterator.getPositionInTicks();
                ret.positionSeconds = iterator.getPositionInSeconds();
            }

            if(Array.isArray(instructionData)) {

                if(cursorOffset === iterator.getCursorPosition()) {
                    // ret.positionTicks = iterator.getPositionInTicks();
                    if (iterator.getIndex() !== null)
                        ret.cursorIndex = iterator.getIndex();
                }
            } else {
                positions.push(lastRowPositions);
                if(positions.length > 3)
                    positions.shift();
                lastRowPositions = [];
            }
        }
        const column = positions[1].indexOf(cursorOffset);

        ret.nextRowOffset = positions[2][column] || positions[2][positions[2].length-1];
        ret.previousRowOffset = positions[0][column] || 0;

        if(ret.positionTicks !== null) {
            ret.segmentID = Math.floor(ret.positionTicks / this.getSegmentLengthTicks());
        }
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


    /** Iterator **/

    getRowIterator(timeDivision=null, beatsPerMinute=null, quantizationTicks=null) {
        const song = this.props.composer.getSong();
        timeDivision = timeDivision || this.getTimeDivision();
        beatsPerMinute = beatsPerMinute || this.getBeatsPerMinute();
        quantizationTicks = quantizationTicks || this.getQuantizationTicks();
        return TrackInstructionRowIterator.getIteratorFromSong(
            song,
            this.props.trackName,
            {
                quantizationTicks,
                timeDivision,
                beatsPerMinute,
            }
        )
    }


    getIterator(timeDivision=null, beatsPerMinute=null) {
        const song = this.props.composer.getSong();
        timeDivision = timeDivision || this.getTimeDivision();
        beatsPerMinute = beatsPerMinute || this.getBeatsPerMinute();
        return InstructionIterator.getIteratorFromSong(
            song,
            this.props.trackName,
            {
                timeDivision, // || this.getSong().data.timeDivision,
                beatsPerMinute, //  || this.getSong().data.beatsPerMinute
            }
        )
    }

}

