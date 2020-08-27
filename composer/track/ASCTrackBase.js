import * as React from "react";
import PropTypes from 'prop-types';

import {ASUIButton, ASUIButtonDropDown, ASUIGlobalContext, ASUIMenuAction, ASUIMenuBreak} from "../../components/";
import PromptManager from "../../common/prompt/PromptManager";
import TrackInstructionRowIterator from "./instruction/TrackInstructionRowIterator";
import {InstructionIterator} from "../../song";
import Values from "../../common/values/Values";
import {ArgType} from "../../common";
import ASCTrackInstruction from "./instruction/ASCTrackInstruction";
import ASCTrackRow from "./row/ASCTrackRow";


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
    getViewMode()               { return this.context.getViewMode(this.getTrackViewKey()); }
    setViewMode(mode)           { return this.context.setViewMode(this.getTrackViewKey(), mode); }
    getTrackViewKey()           { return 'track:' + this.props.trackName; }

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
            menuOpen: false,
            clientPosition: null,
            rowOffset:      trackState.rowOffset || 0,
            cursorOffset:   trackState.cursorOffset || 0,
        };
        // this.firstCursorRowOffset = null;
        // this.lastCursorRowOffset = null;
        this.cb = {
            onClick: e => this.onClick(e),
            renderMenuSetQuantization: () => this.renderMenuSetQuantization(),
            renderMenuSetSegmentLength: () => this.renderMenuSetSegmentLength(),

            onKeyDown: (e) => this.onKeyDown(e),
            onContextMenu: e => this.onContextMenu(e),
            onWheel: e => this.onWheel(e),
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

    getBeatsPerMeasure() { return this.state.beatsPerMeasure || this.props.composer.song.data.beatsPerMeasure || ASCTrackBase.DEFAULT_BEATS_PER_MEASURE; }
    getMeasuresPerSegment() { return this.state.measuresPerSegment || ASCTrackBase.DEFAULT_MEASURES_PER_SEGMENT; }
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


    cursorGetInfo(cursorOffset=null) {
        return this.getCursorInfo(cursorOffset || this.getCursorOffset());
    }

    // getPositionInfo(positionTicks) {
    //     return this.getTrackState().getPositionInfo(positionTicks);
    // }

    // getTrackState() {
    //     return new TrackState(this.getComposer(), this.getTrackName());
    // }



    /** Render Content **/


    renderRowContent() {
        const composer = this.getComposer();
        // const track = this.getTrackState();

        const songPosition = composer.songStats.position;
        const trackSongPosition = songPosition - this.getStartPosition();
        const cursorOffset = this.getCursorOffset();
        const rowOffset = this.getRowOffset();
        let trackSongPositionFound = false;
        // const quantizationTicks = this.getQuantizationTicks() || this.getSong().data.timeDivision;

        // console.time('ASCThis.renderRowContent()');
        const selectedIndices = this.getSelectedIndices();
        const playingIndices = this.getPlayingIndices();
        const beatsPerMeasureTicks = this.getBeatsPerMeasure() * this.getTimeDivision();
        // const measuresPerSegment = this.getMeasuresPerSegment();
        const segmentLengthTicks = this.getSegmentLengthTicks();
        const quantizationTicks = this.getQuantizationTicks();
        // const isSelectedTrack = this.isSelectedTrack();


        // Get Iterator
        const iterator = this.getRowIterator();

        const rows = [];
        let rowInstructions = [];

        // console.log('quantizationTicks', quantizationTicks, cursorOffset, rowOffset, this.props.this.state);

        const rowLength = this.getRowLength();
        while(rows.length < rowLength) {
            const nextCursorEntry = iterator.nextCursorPosition();
            if(Array.isArray(nextCursorEntry)) {
                const instructionData = nextCursorEntry; //iterator.currentInstruction();
                // console.log('instruction', instruction);
                const index = iterator.getIndex();
                const rowProp = {
                    key: index,
                    index: index,
                    instruction: instructionData,
                    track: this,
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

                // if(this.firstCursorRowOffset === null)
                //     this.firstCursorRowOffset = iterator.cursorPosition;

                // let nextRowPositionTicks = iterator.getNextRowPositionTicks();
                // let rowDeltaDuration = nextRowPositionTicks - iterator.getPositionInTicks();
                if (rowDeltaTicks <= 0 || rowDeltaTicks > quantizationTicks) {
                    console.warn(`rowDeltaTicks is ${rowDeltaTicks} > ${quantizationTicks}`);
                }

                const rowID = iterator.getRowCount();
                if(rowID >= rowOffset) {
                    let positionTicks = iterator.getPositionInTicks();
                    // let segmentID = Math.floor(positionTicks / segmentLengthTicks);
                    let beatID = Math.floor(positionTicks / quantizationTicks);
                    let highlight = [beatID % 2 === 0 ? 'even' : 'odd'];

                    // let beatOffset = positionTicks % quantizationTicks;
                    // let segmentOffsetPerc = beatOffset / quantizationTicks;
                    // console.log({beatID, segmentOffsetTicks: beatOffset, segmentOffsetPerc})

                    if(positionTicks % segmentLengthTicks === 0) {
                        highlight.push('segment-start');
                        // if(rows.length>0)
                        //     rowsngth>0)
                        //     rows[rows.length-1].highlight.push('segment-end');
                    } else if(positionTicks % beatsPerMeasureTicks === 0) {
                        highlight.push('measure-start');
                        // if(rows.length>0)
                        //     rows[rows.length-1].highlight.push('measure-end');
                    }

                    if(!trackSongPositionFound && trackSongPosition <= iterator.getPositionInSeconds()) {
                        trackSongPositionFound = true;
                        highlight.push('position');
                    }

                    const rowProp = {
                        key: rowID,
                        track: this,
                        positionTicks: iterator.getPositionInTicks(),
                        positionSeconds: iterator.getPositionInSeconds(),
                        deltaDuration: rowDeltaTicks,
                        cursorPosition: iterator.getCursorPosition(),
                        highlight,
                        children: rowInstructions
                    };
                    if(iterator.getCursorPosition() === cursorOffset) {
                        rowProp.cursor = true;
                        rowProp.highlight.push('cursor');
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
                    rowProp.highlight.push('cursor');
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

        const quantizationTicks = this.getQuantizationTicks();
        const rowDeltaDuration = composer.values.formatSongDuration(quantizationTicks);
        return <ASUIButtonDropDown
            className="row-quantization"
            title={`Quantization (Duration = ${rowDeltaDuration})`}
            arrow="▼"
            options={this.cb.renderMenuSetQuantization}
            children={rowDeltaDuration}
        />;
    }

    // renderSelectTrackButton() {
    //     return <ASUIButton
    //         className="select-track"
    //         title={`Select Track: ${this.getTrackName()}`}
    //         onAction={() => this.getComposer().trackSelectActive(this.getTrackName())}
    //         children={`▼`}
    //     />;
    // }

    renderRowOptions() {
        // const composer = this.props.composer;

        const buttons = [];

        const rowLength = this.getRowLength();
        buttons.push(<ASUIButtonDropDown
            className="row-length"
            title={`Segment Length (${rowLength} Rows)`}
            arrow="▼"
            key="row-length"
            options={this.cb.renderMenuSetSegmentLength}
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




    toggleDropDownMenu(e) {
        // console.log(e);
        const state = {menuOpen: !this.state.menuOpen, clientPosition: null};
        if(e)
            state.clientPosition = [e.clientX, e.clientY];
        this.setState(state);
    }

    toggleViewMode() {
        let viewMode = this.getViewMode();
        viewMode = viewMode === true ? null : true;
        this.setViewMode(viewMode);
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

    trackUpdatePlayingIndices(trackName, playingIndices) {
        this.trackGetState(trackName)
            .updatePlayingIndices(playingIndices);
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
                if (this.state.selectedTrackIndices.length > 0)
                    selectedIndices = values.filterAndSort(selectedIndices.concat(this.state.selectedTrackIndices));
                break;

            default:
            case true:
                break;

            case 'toggle':
                if (this.state.selectedTrackIndices.length > 0) {
                    const toggledSelectedIndices = this.state.selectedTrackIndices.slice();
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

        const state = {
            selectedIndices: selectedIndices
        }
        if(selectedIndices.length > 0) {
            const instructionData = this.getSong().instructionDataGetByIndex(this.getTrackName(), selectedIndices[0]);
            state.selectedInstructionData = instructionData.slice();
            state.selectedInstructionData[0] = 0;
            // console.log('selectedInstructionData', state.selectedInstructionData);
        }

        if(this.state.playbackOnSelect && playback)
            this.trackPlay(this.getTrackName(), selectedIndices, false);

        const viewKey = this.getTrackViewKey();
        if(composer.state.selectedViewKey !== viewKey) {
            composer.setState({selectedViewKey: viewKey})
        }

        this.setState(state);
        return selectedIndices;

    }

    async selectIndicesPrompt() {
        let selectedIndices = this.state.selectedIndices.join(', ');
        selectedIndices = await PromptManager.openPromptDialog(`Select indices for track ${this.getTrackName()}: `, selectedIndices);
        this.selectIndices(selectedIndices);
    }


    trackSelectActive(trackName, trackData=null, reorderLast=false) {
        this.setState(state => {
            const oldTrackData = state.activeTracks[trackName];
            if(reorderLast) {
                delete state.activeTracks[trackName];
            }
            state.activeTracks[trackName] = oldTrackData || {};
            if(trackData !== null)
                Object.assign(state.activeTracks[trackName], trackData);
            state.selectedComponent = ['track', trackName];
            return state;
        });

        // TODO: parent stats
        // trackData = this.state.activeTracks[trackName];
        // if(trackData.destinationList)
        //     selectedTrack = trackData.destinationList.slice(-1)[0]; // Select last track
        // else
        //     selectedTrack = this.getSong().getStartTrackName();
    }



    trackUnselect(trackName) {
        this.setState(state => {
            delete state.activeTracks[trackName];
            state.selectedComponent = ['track', Object.keys(state.activeTracks)[0]];
            return state;
        });
    }







    changeQuantization(quantizationTicks) {
        if(typeof quantizationTicks !== "number")
            throw new Error("Invalid quantizationTicks");
        this.setState({
            quantizationTicks
        })
    }

    async changeQuantizationPrompt() {
        let quantizationTicks = await PromptManager.openPromptDialog("Enter a quantization:", Values.instance.formatDuration(this.getQuantizationTicks()));
        if (typeof quantizationTicks === 'string')
            quantizationTicks = Values.instance.parseDurationAsTicks(quantizationTicks, this.getTimeDivision());
        this.changeQuantization(quantizationTicks);
    }


    changeSegmentLength(rowLength = null) {
        if(typeof rowLength !== "number")
            throw new Error("Invalid quantizationTicks");
        this.setState({
            rowLength
        })
    }

    async changeSegmentLengthPrompt() {
        const quantizationTicks = await PromptManager.openPromptDialog("Enter a new song name:", this.getQuantizationTicks());
        this.changeQuantization(quantizationTicks);
    }



    /** Menu **/


    renderMenuSetQuantization(title = "Select Quantization") {
        const quantizationTicks = this.getQuantizationTicks();
        const songValues = this.props.composer.values;
        return songValues.renderMenuSelectDuration(
            durationTicks => this.trackerChangeQuantization(this.getTrackName(), durationTicks),
            this.song.data.timeDivision,
            quantizationTicks,
            title
        );
    }



    renderMenuSetSegmentLength() {
        const songValues = this.props.composer.values;
        return (<>
            {songValues.getTrackerSegmentLengthInRows((length, title) =>
                <ASUIMenuAction key={length} onAction={(e) => this.changeSegmentLength(length)}>{title}</ASUIMenuAction>
            )}
            <ASUIMenuAction onAction={(e) => this.changeSegmentLengthPrompt()} >Custom Length</ASUIMenuAction>
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


    /** User Input **/

    onWheel(e) {
        e.preventDefault();
        let rowOffset = parseInt(this.getTrack().getRowOffset()) || 0; // this.getTrackState().rowOffset;
        rowOffset += e.deltaY > 0 ? 1 : -1;
        if(rowOffset < 0)
            rowOffset = 0; // return console.log("Unable to scroll past beginning");

        this.getTrack().setRowOffset(rowOffset);
        // console.log('onWheel', e.deltaY);
        // this.getComposer().trackerSetRowOffset(this.getTrackName(), newRowOffset)
        // this.getComposer().trackerUpdateSegmentInfo(this.getTrackName());
        // this.getTrackInfo().changeRowOffset(this.getTrackName(), newRowOffset);
    }


    onClick(e) {
        this.toggleViewMode()
    }

    onKeyDown(e) {
        const composer = this.getComposer();
        // console.log(e.type, e.key, e.ctrlKey);
        if(e.isDefaultPrevented())
            return;
        if(e.ctrlKey) switch(e.key) {
            case 'x': composer.instructionCutSelected(); return;
            case 'c': composer.instructionCopySelected(); return;
            case 'v': composer.instructionPasteAtCursor(); return;
            default: break;
        }
        const cursorInfo = this.cursorGetInfo();
        // const trackState = this.getTrackState();
        // console.log('cursorInfo', cursorInfo);

        // let selectedIndices;
        switch(e.key) {
            case 'Delete':
                if(cursorInfo.cursorIndex)
                    composer.instructionDeleteIndices(this.getTrackName(), cursorInfo.cursorIndex);
                else
                    composer.instructionDeleteIndices(); // cursorDeleteIndex !== null ? [cursorDeleteIndex] : null
                break;
            //
            // case 'Escape':
            // case 'Backspace':
            //     break;
            //
            //
            // case ' ':
            case 'Play':
                composer.songPlay(); // TODO: play track?
                break;

            case 'ArrowLeft':
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowRight':
                e.preventDefault();
                let targetCursorOffset;
                switch(e.key) {
                    case 'ArrowRight':
                        targetCursorOffset = cursorInfo.nextCursorOffset;
                        break;

                    case 'ArrowLeft':
                        targetCursorOffset = cursorInfo.previousCursorOffset;
                        break;

                    case 'ArrowUp':
                        targetCursorOffset = cursorInfo.previousRowOffset;
                        break;

                    case 'ArrowDown':
                        targetCursorOffset = cursorInfo.nextRowOffset;
                        break;
                    default:
                        throw new Error("Invalid: " + e.key);
                }
                const targetCursorInfo = this.cursorGetInfo(targetCursorOffset)
                this.setCursorOffset(targetCursorOffset, targetCursorInfo.positionTicks);
                //, targetCursorInfo.adjustedCursorRow
                if(targetCursorInfo.cursorIndex !== null) {
                    if(e.shiftKey) {
                        let selectedIndices = [targetCursorInfo.cursorIndex];
                        if(cursorInfo.cursorIndex !== null)
                            selectedIndices.push(cursorInfo.cursorIndex);
                        selectedIndices = this.selectIndices(selectedIndices, false);
                        if(e.ctrlKey) {
                            this.playInstructions(selectedIndices, true);
                        }
                    } else {
                        this.selectIndices('none', true);
                        if(e.ctrlKey) {
                            this.playInstructions(targetCursorInfo.cursorIndex, true);
                        }
                    }
                } else {
                    if(!e.shiftKey) {
                        this.selectIndices('none', true);
                    }
                }

                const rowLength = this.getRowLength();
                if(targetCursorInfo.cursorRow > this.getRowOffset() + (rowLength - 1))
                    this.setRowOffset(targetCursorInfo.cursorRow - (rowLength - 1))
                else if(targetCursorInfo.cursorRow < this.getRowOffset())
                    this.setRowOffset(targetCursorInfo.cursorRow)
                break;

            //
            // case ' ':
            //     break;
            //
            // case 'PlayFrequency':
            //     break;
            case 'PageDown':
                const {cursorOffset: nextCursorOffset} = this.getPositionInfo(cursorInfo.positionTicks + this.getSegmentLengthTicks())
                this.setCursorOffset(nextCursorOffset);
                this.adjustRowOffset(nextCursorOffset + this.getRowLength() / 4);
                // console.log('nextCursorOffset', nextCursorOffset);
                break;

            case 'PageUp':
                const {cursorOffset: previousCursorOffset} = this.getPositionInfo(cursorInfo.positionTicks - this.getSegmentLengthTicks())
                this.setCursorOffset(previousCursorOffset);
                this.adjustRowOffset(previousCursorOffset);
                // console.log('previousCursorOffset', previousCursorOffset);
                break;


            case 'ContextMenu':
                e.preventDefault();
                this.getComposer().openMenuByKey('edit');
                // this.toggleDropDownMenu(); // TODO: open composer edit menu instead
                break;

            case 'Enter':
                if(cursorInfo.cursorIndex !== null)
                    this.selectIndices(cursorInfo.cursorIndex, 'toggle');
                break;

            case ' ':
                if(e.ctrlKey)
                    this.playSelectedInstructions();
                else if(cursorInfo.cursorIndex !== null) {
                    // if(e.shiftKey)
                    //     this.selectIndices(cursorInfo.cursorIndex, 'toggle');
                    // else
                    this.playInstructions([cursorInfo.cursorIndex]);
                }
                // else if(this.getSelectedIndices().length > 0)
                //     this.playSelectedInstructions();
                break;

            case 'Shift':
            case 'Control':
            case 'Alt':
                break;

            default:
                const keyboardCommand = composer.keyboard.getKeyboardCommand(e.key, composer.state.keyboardOctave);
                if(keyboardCommand) {
                    // const selectedIndices = this.getSelectedIndices();
                    // const {cursorIndex} = this.cursorGetInfo()
                    if(cursorInfo.cursorIndex !== null) {
                        try {
                            composer.instructionReplaceArgByType(this.getTrackName(), cursorInfo.cursorIndex, ArgType.frequency, keyboardCommand);
                        } catch (e) { // Hack
                            console.warn(e);
                            composer.instructionReplaceArgByType(this.getTrackName(), cursorInfo.cursorIndex, ArgType.command, keyboardCommand);
                        }

                    } else {
                        composer.instructionInsertAtCursor(this.getTrackName(), keyboardCommand);
                    }
                    // console.log('TODO: keyboardCommand', keyboardCommand, selectedIndices, cursorOffset);
                    return;
                }
                // this.instructionInsert
                console.info("Unhandled key: ", e.key);
                break;
        }
    }

    handleMIDIInput(e) {
        // TODO: Send to song
        console.log('handleMIDIInput', e);
    }
}

