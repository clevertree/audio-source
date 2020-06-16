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
    static DEFAULT_MEASURES_PER_SEGMENT = 4;
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

    }

    componentDidMount() {
        this.updateRenderingProps();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(this.props.trackState !== prevProps.trackState) {
            // console.log('componentDidUpdate', this.props.trackName, prevProps.trackState, this.props.trackState);
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
    getMeasuresPerSegment() { return this.state.measuresPerSegment || ASCTrackBase.DEFAULT_MEASURES_PER_SEGMENT; }
    getBeatsPerSegment() { return this.getBeatsPerMeasure() * this.getMeasuresPerSegment(); }
    getSegmentLengthTicks() { return this.getBeatsPerSegment() * this.getTimeDivision(); }

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

    getRowIterator(quantizationTicks=null) {
        return this.getComposer()
            .trackGetRowIterator(
                this.getTrackName(),
                this.getTimeDivision(), // || this.getSong().data.timeDivision,
                this.getBeatsPerMinute(), //  || this.getSong().data.beatsPerMinute
                quantizationTicks
            );
    }


    getIterator() {
        return this.getComposer()
            .instructionGetIterator(
                this.getTrackName(),
                this.getTimeDivision(), // || this.getSong().data.timeDivision,
                this.getBeatsPerMinute() //  || this.getSong().data.beatsPerMinute
            );
    }




    /** Actions **/

    // toggleDropDownMenu(menuOpen = !this.state.menuOpen) {
    //     this.setState({menuOpen});
    // }

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
        // const rowOffset = this.getRowOffset();
        const segmentLengthTicks = this.getSegmentLengthTicks();
        let nextSegmentPositionTicks = 0;

        const iterator = this.getIterator();
        iterator.seekToEnd();
        const trackLengthTicks = iterator.getPositionInTicks() + segmentLengthTicks * 2;

        // TODO: inefficient
        const segmentRowOffsets = [];
        const rowIterator = this.getRowIterator(quantizationTicks);
        // let lastSegmentPositionTicks = 0;
        while(true) {
            const positionTicks = rowIterator.getPositionInTicks();
            if(positionTicks >= trackLengthTicks
                && segmentRowOffsets.length >= ASCTrackBase.DEFAULT_MIN_SEGMENTS)
                break;
            if(segmentRowOffsets.length >= ASCTrackBase.DEFAULT_MAX_SEGMENTS)
                break;
            const instructionData = rowIterator.nextCursorPosition();
            if(Array.isArray(instructionData)) {
            } else {
                // Row
                const currentRowOffset = rowIterator.getRowCount();
                const currentPositionTicks = rowIterator.getPositionInTicks();
                if(nextSegmentPositionTicks <= currentPositionTicks) {
                    // lastSegmentPositionTicks += segmentLengthTicks;
                    segmentRowOffsets.push(currentRowOffset);
                    nextSegmentPositionTicks += segmentLengthTicks;
                }
            }
        }

        // console.log('updateRenderingProps', {
        //     trackLengthTicks,
        //     quantizationTicks,
        //     rowLength
        // }, segmentRowOffsets)

        this.setState({
            trackLengthTicks,
            quantizationTicks,
            rowLength,
            segmentRowOffsets
        });
        this.getComposer().saveStateWithTimeout();
    }



    // TODO: should set song position?
    // setCursorPositionTicks(positionTicks) {
    //     const {cursorOffset, rowCount, positionSeconds} = this.getPositionInfo(positionTicks);
    //     console.log('setCursorPositionTicks', {positionTicks, cursorOffset, rowCount, positionSeconds});
    //     this.setCursorPositionOffset(cursorOffset, positionTicks);
    //     this.setRowOffset(rowCount);
    //     this.getComposer().setSongPosition(this.getStartPosition() + positionSeconds);
    // }

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

    /** Selection **/

    selectActive() {
        this.getComposer().trackSelectActive(this.getTrackName());
    }

    selectIndicesAndPlay(selectedIndices, clearSelection=true, stopPlayback=true) {
        selectedIndices = this.selectIndices(selectedIndices, clearSelection);
        this.playInstructions(selectedIndices, stopPlayback)
    }

    selectIndices(selectedIndices, clearSelection=true) {
        if (typeof selectedIndices === "string") {
            switch (selectedIndices) {
                case 'cursor':
                    throw new Error('TODO');
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
                    throw new Error('TODO');
                // throw new Error("Invalid selection: " + selectedIndices);
            }
        }

        return this.getComposer().trackSelectIndices(this.getTrackName(), selectedIndices, clearSelection);
    }

    updatePlayingIndices(playingIndices) {
        this.setState({playingIndices});
    }

    getIndicesInRange(positionTicksStart, positionTicksEnd) {

    }



    /**
     * Used when selecting
     * @param {Integer} cursorOffset
     * @returns {{cursorRow: null, positionTicks: null, nextCursorOffset: *, previousCursorOffset: number, positionSeconds: number, cursorIndex: null}}
     */
    cursorGetInfo(cursorOffset=null) {
        cursorOffset = cursorOffset === null ? this.getCursorOffset() : cursorOffset;
        // rowOffset = rowOffset === null ? this.state.rowOffset : rowOffset;
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


    /** Render Content **/

    renderRowContainer() {
        return <ASCTrackRowContainer
            key="row-container"
            track={this}
        />
    }

    // TODO: pagination
    renderRowSegments() {
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
            if(buttons.length > ASCTrackBase.DEFAULT_MAX_SEGMENTS) {
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

        const rowDeltaDuration = composer.values.formatSongDuration(this.getQuantizationTicks());
        return <ASUIButtonDropDown
            className="row-quantization"
            title={`Quantization (Duration = ${rowDeltaDuration})`}
            arrow="▼"
            options={() => this.getComposer().renderMenuTrackerSetQuantization(this.getTrackName(), this.getQuantizationTicks())}
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
        this.getComposer().trackerPlay(this.getTrackName(), selectedIndices, stopPlayback)
    }

}

