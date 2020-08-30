import * as React from "react";

import {ASUIMenuAction} from "../../components/";
import PromptManager from "../../common/prompt/PromptManager";
import TrackInstructionRowIterator from "./instruction/TrackInstructionRowIterator";
import {InstructionIterator} from "../../song";
import Values from "../../common/values/Values";
import ASCTrackBase from "./ASCTrackBase";
import ASCTrackRenderer from "./ASCTrackRenderer";


// TODO: ASCTrackRowContainer
export default class ASCTrackActions extends ASCTrackRenderer {


    getStorageState() {
        return {
            rowOffset: this.state.rowOffset,
            cursorOffset: this.state.cursorOffset,
            viewMode: this.state.viewMode,
        }
    }

    getComposer()           { return this.props.composer; }

    getSong()               { return this.props.composer.song; }

    getTrackName()          { return this.props.trackName; }
    getSelectedIndices()    { return this.props.selectedIndices || []; }

    getCursorOffset()       { return this.state.cursorOffset || 0; }
    getRowOffset()          { return this.state.rowOffset || 0; }

    getRowLength() { return typeof this.state.rowLength !== "undefined" ? this.state.rowLength : ASCTrackBase.DEFAULT_ROW_LENGTH; }


    getTimeDivision() { return this.state.timeDivision || this.props.composer.song.data.timeDivision; }

    getQuantizationTicks() { return this.state.quantizationTicks || this.getTimeDivision(); }
    getBeatsPerMinute() { return this.state.beatsPerMinute || this.props.composer.song.data.beatsPerMinute; }

    getBeatsPerMeasure() { return this.state.beatsPerMeasure || this.props.composer.song.data.beatsPerMeasure || ASCTrackBase.DEFAULT_BEATS_PER_MEASURE; }
    getMeasuresPerSegment() { return this.state.measuresPerSegment || ASCTrackBase.DEFAULT_MEASURES_PER_SEGMENT; }
    getBeatsPerSegment() { return this.getBeatsPerMeasure() * this.getMeasuresPerSegment(); }
    getSegmentLengthTicks() { return this.getBeatsPerSegment() * this.getTimeDivision(); }

    // getProgramID() { return this.state.programID; }
    // getCursorOffset() { return this.state.cursorOffset || 0; }

    // getCursorPositionTicks() { return this.state.cursorPositionTicks || 0; }

    getPlayingIndices() { return this.state.playingIndices || []; }


    getDestinationList() { return this.state.destinationList || []; }
    getTrackLengthTicks() { return this.state.trackLengthTicks || null; }

    getSegmentRowOffsets() { return this.state.segmentRowOffsets || [0]; }

    getStartPosition() { return this.state.startPosition || 0; }

    isSelectedTrack() {
        return this.trackName === this.props.composer.getSelectedTrackName();
    }


    /** TODO: calculate correct destination **/
    // getDestination()            {
    //     if(this.destination)
    //         return this.destination;
    //     console.warn('TODO: calculate correct destination');
    //     return this.destination = this.getComposer().getAudioContext();
    // }


    updateRenderingProps() {
        const segmentLengthTicks = this.getSegmentLengthTicks();
        // const rowOffset = this.getRowOffset();

        const iterator = this.getIterator();
        iterator.seekToEnd();
        const trackLengthTicks = iterator.getPositionInTicks() + segmentLengthTicks * 2;

        const segmentRowOffsets = [];
        const rowIterator = this.getRowIterator();
        // let lastSegmentPositionTicks = 0;
        let nextSegmentPositionTicks = 0;
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

        this.setState({
            trackLengthTicks,
            segmentRowOffsets
        });
    }


    cursorGetInfo(cursorOffset=null) {
        return this.getCursorInfo(cursorOffset || this.getCursorOffset());
    }

    // getPositionInfo(positionTicks) {
    //     return this.getTrackState().getPositionInfo(positionTicks);
    // }

    // getTrackState() {
    //     return new TrackState(this.getComposer(), this.getTrackName());
    // }


    /** Playback **/

    playSelectedInstructions() {
        return this.playInstructions(this.getSelectedIndices());
    }

    playInstructions(selectedIndices, stopPlayback=true) {
        // console.log("ASCTrack.playInstructions", selectedIndices);
        this.getComposer().trackPlay(this.getTrackName(), selectedIndices, stopPlayback)
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

    /** Actions **/


    openContextMenu(e, options=null) {
        if(e.defaultPrevented)
            return;
        e.preventDefault();
        const state = {
            menuOpen: true,
            menuOptions: options,
        }
        if(options)
            state.menuOptions = options;
        if(e)
            state.clientPosition = [e.clientX, e.clientY];
        // console.log(e, e.type, 'openContextMenu', state)
        this.setState(state)
    }

    closeContextMenu() {
        this.setState({
            menuOpen: false,
            menuOptions: null,
            clientPosition: null,
        })
    }


    toggleViewMode() {
        let viewMode = this.state.viewMode;
        viewMode = viewMode === 'minimize' ? null : 'minimize';
        this.setViewMode(viewMode);
    }

    setViewMode(viewMode) {
        this.setState({
            viewMode
        })
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


    instructionPasteAtCursor() {
        let {positionTicks: startPositionTicks} = this.getCursorInfo(this.getCursorOffset());
        this.getComposer().instructionPasteAtPosition(this.getTrackName(), startPositionTicks);
    }

    instructionInsertAtCursor(newInstructionData) {
        let {positionTicks: startPositionTicks} = this.getCursorInfo(this.getCursorOffset());
        this.getComposer().instructionInsertAtPosition(this.getTrackName(), startPositionTicks, newInstructionData);
    }

    // trackGetState(trackName) {
    //     return new TrackState(this, trackName);
    // }



    /** Selection **/

    selectActive() {
        this.getComposer().trackSelect(this.getTrackName());
    }

    // selectIndicesAndPlay(selectedIndices, clearSelection=true, stopPlayback=true) {
    //     selectedIndices = this.selectIndices(selectedIndices, clearSelection);
    //     this.playInstructions(selectedIndices, stopPlayback)
    // }

    selectIndices(selectedIndices, clearSelection=true, playback=true) {
        const composer = this.getComposer();
        const values = Values.instance;
        if (typeof selectedIndices === "string") {
            switch (selectedIndices) {
                case 'all':
                    selectedIndices = [];
                    const maxLength = this.getSong().instructionGetList(this.getTrackName()).length;
                    for (let i = 0; i < maxLength; i++)
                        selectedIndices.push(i);
                    break;
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
                    selectedIndices = selectedIndices.split(/[^0-9]/).map(index => parseInt(index));
            }
        }

        selectedIndices = values.parseSelectedIndices(selectedIndices);
        switch(clearSelection) {
            case false:
                if (this.getSelectedIndices().length > 0)
                    selectedIndices = values.filterAndSort(selectedIndices.concat(this.getSelectedIndices()));
                break;

            default:
            case true:
                break;

            case 'toggle':
                if (this.getSelectedIndices().length > 0) {
                    const toggledSelectedIndices = this.getSelectedIndices().slice();
                    for(const selectedIndex of selectedIndices) {
                        const p = toggledSelectedIndices.indexOf(selectedIndex);
                        if(p === -1) {
                            toggledSelectedIndices.push(selectedIndex);
                        } else {
                            toggledSelectedIndices.splice(p, 1);
                        }
                    }
                    selectedIndices = values.filterAndSort(toggledSelectedIndices);
                }

                break;
        }

        if(this.state.playbackOnSelect && playback)
            this.trackPlay(this.getTrackName(), selectedIndices, false);

        // const viewKey = this.getTrackViewKey();
        composer.trackSelect(this.getTrackName(), selectedIndices);
        // this.setState(state);
        return selectedIndices;

    }

    async selectIndicesPrompt() {
        let selectedIndices = this.getSelectedIndices().join(', ');
        selectedIndices = await PromptManager.openPromptDialog(`Select indices for track ${this.getTrackName()}: `, selectedIndices);
        this.selectIndices(selectedIndices);
    }




    trackUnselect(trackName) {
        this.setState(state => {
            delete state.activeTracks[trackName];
            state.selectedComponent = ['track', Object.keys(state.activeTracks)[0]];
            return state;
        });
    }






    updatePlayingIndices(playingIndices) {
        this.setState({
            playingIndices
        });
    }


    changeQuantization(quantizationTicks) {
        if(typeof quantizationTicks !== "number")
            throw new Error("Invalid quantizationTicks: " + quantizationTicks);
        this.setState({
            quantizationTicks
        }, () => {
            this.updateRenderingProps();
        })
    }

    async changeQuantizationPrompt() {
        let quantizationTicks = await PromptManager.openPromptDialog("Enter a quantization:", Values.instance.formatDuration(this.getQuantizationTicks()));
        if (typeof quantizationTicks === 'string')
            quantizationTicks = Values.instance.parseDurationAsTicks(quantizationTicks, this.getTimeDivision());
        this.changeQuantization(quantizationTicks);
    }


    changeRowLength(rowLength = null) {
        if(typeof rowLength !== "number")
            throw new Error("Invalid quantizationTicks");
        this.setState({
            rowLength
        })
    }

    async changeRowLengthPrompt() {
        const rowLength = await PromptManager.openPromptDialog("Enter a length in rows:", this.state.rowLength);
        this.changeRowLength(Number.parseInt(rowLength));
    }



    /** Menu **/

    renderMenuViewOptions() {
        const oldViewMode = this.state.viewMode;
        return (<>
            <ASUIMenuAction disabled={!oldViewMode} onAction={e => this.setViewMode(null)} >Default</ASUIMenuAction>
            <ASUIMenuAction disabled={oldViewMode === 'minimize'} onAction={e => this.setViewMode('minimize')} >Minimize</ASUIMenuAction>
            <ASUIMenuAction disabled={oldViewMode === 'none'} onAction={e => this.setViewMode('none')} >Hide</ASUIMenuAction>
            <ASUIMenuAction disabled={oldViewMode === 'float'} onAction={e => this.setViewMode('float')} >Float Right</ASUIMenuAction>
        </>);
    }

    renderMenuSetQuantization(title = "Select Quantization") {
        const quantizationTicks = this.getQuantizationTicks();
        const songValues = this.props.composer.values;
        return songValues.renderMenuSelectDuration(
            durationTicks => this.changeQuantization(durationTicks),
            this.getTimeDivision(),
            quantizationTicks,
            title
        );
    }



    renderMenuSetRowLength() {
        const songValues = this.props.composer.values;
        return (<>
            {songValues.getTrackerLengthInRows((length, title) =>
                <ASUIMenuAction key={length} onAction={(e) => this.changeRowLength(length)}>{title}</ASUIMenuAction>
            )}
            <ASUIMenuAction onAction={(e) => this.changeRowLengthPrompt()} >Custom Length</ASUIMenuAction>
        </>);
    }

    // renderMenuSetProgramFilter() {
    //     return this.renderMenuSelectSongProgram(programID => this.trackerChangeProgramFilter(programID));
    // }

    renderMenuKeyboardSetOctave() {
        return Values.instance.getNoteOctaves(octave =>
            <ASUIMenuAction key={octave} onAction={(e) => this.keyboardChangeOctave(octave)}>{octave}</ASUIMenuAction>
        );
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

