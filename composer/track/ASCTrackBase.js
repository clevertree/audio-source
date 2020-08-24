import * as React from "react";
import PropTypes from 'prop-types';

import {ASUIButton, ASUIButtonDropDown, ASUIGlobalContext} from "../../components/";
import PromptManager from "../../common/prompt/PromptManager";
import ASCTrackRowContainer from "./row-container/ASCTrackRowContainer";
import TrackState from "./state/TrackState";


// TODO: ASCTrackRowContainer
export default class ASCTrackBase extends React.Component {

    /** Program Context **/
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
        trackState: PropTypes.object.isRequired
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
    getSelectedIndices()    { return this.getTrackState().getSelectedIndices(); }

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
        this.getTrackState()
            .updateRenderingProps(
                quantizationTicks,
                rowLength
            );
    }


    /** Actions **/

    toggleViewMode() {
        const viewKey = this.props.trackName;
        if(!viewKey)
            return console.warn("Invalid trackName prop");
        let viewMode = this.getViewMode(viewKey);
        viewMode = viewMode === 'minimized' ? null : 'minimized';
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
        const rowLength = trackState.getRowLength();
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
        const trackState = this.getTrackState();
        const cursorRowOffset = this.getRowOffset();
        // const rowLength = this.getRowLength();
        let segmentRowOffsets = trackState.getSegmentRowOffsets();
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
        const trackState = this.getTrackState();
        const composer = this.props.composer;

        const rowDeltaDuration = composer.values.formatSongDuration(trackState.getQuantizationTicks());
        return <ASUIButtonDropDown
            className="row-quantization"
            title={`Quantization (Duration = ${rowDeltaDuration})`}
            arrow="▼"
            options={() => this.getComposer().renderMenuTrackerSetQuantization(this.getTrackName(), trackState.getQuantizationTicks())}
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
        const trackState = this.getTrackState();
        // const composer = this.props.composer;

        const buttons = [];

        const rowLength = trackState.getRowLength();
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
        const activeTrack = this.getTrackState();
        let {positionTicks: startPositionTicks} = activeTrack.getCursorInfo(this.getCursorOffset());
        this.getComposer().instructionPasteAtPosition(this.getTrackName(), startPositionTicks);
    }

    instructionInsertAtCursor(newInstructionData) {
        const activeTrack = this.getTrackState();
        let {positionTicks: startPositionTicks} = activeTrack.getCursorInfo(this.getCursorOffset());
        this.getComposer().instructionInsertAtPosition(this.getTrackName(), startPositionTicks, newInstructionData);
    }
}

