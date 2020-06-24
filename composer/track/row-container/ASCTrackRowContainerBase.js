import * as React from "react";
import PropTypes from 'prop-types';

import ASCTrackInstruction from "../instruction/ASCTrackInstruction";
import ASCTrackRow from "../row/ASCTrackRow";
import {ArgType} from "../../../common";
// import {ASUIButton, ASUIButtonDropDown} from "../../../components/";


// TODO: ASCTrackRowContainer
export default class ASCTrackRowContainerBase extends React.Component {

    /** Default Properties **/
    // static defaultProps = {
    // };

    /** Property validation **/
    static propTypes = {
        // cursorOffset: PropTypes.number.isRequired,
        // composer: PropTypes.object.isRequired,
        track: PropTypes.object.isRequired,
        // rowOffset: PropTypes.string.isRequired,
    };

    // static DEFAULT_MAX_SEGMENTS = 8;
    // static DEFAULT_MIN_SEGMENTS = 3;

    constructor(props) {
        super(props);

        if(!props.track)
            throw new Error("Invalid track");
        this.state = {
            // rowOffset: 0,
            menuOpen: false,
        };
        // this.firstCursorRowOffset = null;
        // this.lastCursorRowOffset = null;
        this.cb = {
            onKeyDown: (e) => this.onKeyDown(e),
            // onWheel: e => this.onWheel(e),
            options: () => this.renderContextMenu()
        };
        this.destination = null;
        // this.cursorInstruction = React.createRef();
        // this.trackerGetCursorInfo();
    }


    getTrack()                  { return this.props.track; }
    getComposer()               { return this.getTrack().getComposer(); }
    getCursorOffset()           { return this.props.track.getCursorOffset(); }
    getRowOffset()              { return this.props.track.getRowOffset(); }


    /** Render Content **/

    // eslint-disable-next-line react/require-render-return
    render() {
        throw new Error("Implement");
    }

    renderRowContent() {
        const composer = this.getComposer();
        const track = this.getTrack();
        const trackState = track.getTrackState();

        const songPosition = composer.songStats.position;
        const trackSongPosition = songPosition - trackState.getStartPosition();
        const cursorOffset = this.getCursorOffset();
        const rowOffset = this.getRowOffset();
        let trackSongPositionFound = false;
        // const quantizationTicks = this.getQuantizationTicks() || this.getSong().data.timeDivision;

        // console.time('ASCTrack.renderRowContent()');
        const selectedIndices = trackState.getSelectedIndices();
        const playingIndices = trackState.getPlayingIndices();
        const beatsPerMeasureTicks = trackState.getBeatsPerMeasure() * trackState.getTimeDivision();
        // const measuresPerSegment = track.getMeasuresPerSegment();
        const segmentLengthTicks = trackState.getSegmentLengthTicks();
        const quantizationTicks = trackState.getQuantizationTicks();
        // const isSelectedTrack = this.isSelectedTrack();


        // Get Iterator
        const iterator = trackState.getRowIterator();

        const rows = [];
        let rowInstructions = [];

        // console.log('quantizationTicks', quantizationTicks, cursorOffset, rowOffset, this.props.track.state);

        const rowLength = trackState.getRowLength();
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
                    track,
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
                        track,
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

    /** Actions **/

    toggleDropDownMenu(e) {
        // console.log(e);
        const state = {menuOpen: !this.state.menuOpen, clientPosition: null};
        if(e)
            state.clientPosition = [e.clientX, e.clientY];
        this.setState(state);
    }


    /** User Input **/

    onKeyDown(e) {
        const composer = this.getComposer();
        const track = this.getTrack();
        // console.log(e.type, e.key, e.ctrlKey);
        if(e.isDefaultPrevented())
            return;
        if(e.ctrlKey) switch(e.key) {
            case 'x': composer.instructionCutSelected(); return;
            case 'c': composer.instructionCopySelected(); return;
            case 'v': composer.instructionPasteAtCursor(); return;
            default: break;
        }
        const cursorInfo = track.cursorGetInfo();
        const trackState = track.getTrackState();
        // console.log('cursorInfo', cursorInfo);

        // let selectedIndices;
        switch(e.key) {
            case 'Delete':
                if(cursorInfo.cursorIndex)
                    composer.instructionDeleteIndices(track.getTrackName(), cursorInfo.cursorIndex);
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
                const targetCursorInfo = track.cursorGetInfo(targetCursorOffset)
                track.setCursorOffset(targetCursorOffset, targetCursorInfo.positionTicks);
                //, targetCursorInfo.adjustedCursorRow
                if(targetCursorInfo.cursorIndex !== null) {
                    if(e.shiftKey) {
                        let selectedIndices = [targetCursorInfo.cursorIndex];
                        if(cursorInfo.cursorIndex !== null)
                            selectedIndices.push(cursorInfo.cursorIndex);
                        selectedIndices = track.selectIndices(selectedIndices, false);
                        if(e.ctrlKey) {
                            track.playInstructions(selectedIndices, true);
                        }
                    } else {
                        track.selectIndices('none', true);
                        if(e.ctrlKey) {
                            track.playInstructions(targetCursorInfo.cursorIndex, true);
                        }
                    }
                } else {
                    if(!e.shiftKey) {
                        track.selectIndices('none', true);
                    }
                }

                const rowLength = trackState.getRowLength();
                if(targetCursorInfo.cursorRow > track.getRowOffset() + (rowLength - 1))
                    track.setRowOffset(targetCursorInfo.cursorRow - (rowLength - 1))
                else if(targetCursorInfo.cursorRow < track.getRowOffset())
                    track.setRowOffset(targetCursorInfo.cursorRow)
                break;

            //
            // case ' ':
            //     break;
            //
            // case 'PlayFrequency':
            //     break;
            case 'PageDown':
                const {cursorOffset: nextCursorOffset} = trackState.getPositionInfo(cursorInfo.positionTicks + trackState.getSegmentLengthTicks())
                track.setCursorOffset(nextCursorOffset);
                track.adjustRowOffset(nextCursorOffset + trackState.getRowLength() / 4);
                // console.log('nextCursorOffset', nextCursorOffset);
                break;

            case 'PageUp':
                const {cursorOffset: previousCursorOffset} = trackState.getPositionInfo(cursorInfo.positionTicks - trackState.getSegmentLengthTicks())
                track.setCursorOffset(previousCursorOffset);
                track.adjustRowOffset(previousCursorOffset);
                // console.log('previousCursorOffset', previousCursorOffset);
                break;


            case 'ContextMenu':
                e.preventDefault();
                this.getComposer().openMenuByKey('edit');
                // track.toggleDropDownMenu(); // TODO: open composer edit menu instead
                break;

            case 'Enter':
                if(cursorInfo.cursorIndex !== null)
                    track.selectIndices(cursorInfo.cursorIndex, 'toggle');
                break;

            case ' ':
                if(e.ctrlKey)
                    track.playSelectedInstructions();
                else if(cursorInfo.cursorIndex !== null) {
                    if(e.shiftKey)
                        track.selectIndices(cursorInfo.cursorIndex, 'toggle');
                    else
                        track.playInstructions([cursorInfo.cursorIndex]);
                }
                // else if(track.getSelectedIndices().length > 0)
                //     track.playSelectedInstructions();
                break;

            case 'Shift':
            case 'Control':
            case 'Alt':
                break;

            default:
                const keyboardCommand = composer.keyboard.getKeyboardCommand(e.key, composer.state.keyboardOctave);
                if(keyboardCommand) {
                    // const selectedIndices = track.getSelectedIndices();
                    // const {cursorIndex} = track.cursorGetInfo()
                    if(cursorInfo.cursorIndex !== null) {
                        composer.instructionReplaceArgByType(track.getTrackName(), cursorInfo.cursorIndex, ArgType.frequency, keyboardCommand);

                    } else {
                        composer.instructionInsertAtCursor(track.getTrackName(), keyboardCommand);
                    }
                    // console.log('TODO: keyboardCommand', keyboardCommand, selectedIndices, cursorOffset);
                    return;
                }
                // track.instructionInsert
                console.info("Unhandled key: ", e.key);
                break;
        }
    }


    /** Menu **/


    onContextMenu(e) {
        if(e.defaultPrevented || e.altKey)
            return;
        e.preventDefault();
        this.props.track.selectActive();
        this.toggleDropDownMenu(e);
    }



    renderContextMenu() {
        // const selectedIndices = track.getTrack().getSelectedIndices();
        return this.getComposer().renderMenuEdit();
    }

}

