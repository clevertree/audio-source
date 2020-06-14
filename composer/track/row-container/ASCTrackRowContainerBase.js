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

    /** Render Content **/

    // eslint-disable-next-line react/require-render-return
    render() {
        throw new Error("Implement");
    }

    renderRowContent() {
        const composer = this.getComposer();
        const track = this.getTrack();
        const songPosition = composer.state.songPosition;
        const trackSongPosition = songPosition - track.getStartPosition();
        const cursorOffset = track.getCursorOffset();
        const rowOffset = track.getRowOffset();
        let trackSongPositionFound = false;
        // const quantizationTicks = this.getQuantizationTicks() || this.getSong().data.timeDivision;

        // console.time('ASCTrack.renderRowContent()');
        const selectedIndices = track.getSelectedIndices();
        const playingIndices = track.getPlayingIndices();
        const beatsPerMeasureTicks = track.getBeatsPerMeasure() * track.getTimeDivision();
        const measuresPerSegment = track.getMeasuresPerSegment();
        const segmentLengthTicks = track.getSegmentLengthTicks();
        const quantizationTicks = track.getQuantizationTicks();
        // const isSelectedTrack = this.isSelectedTrack();


        // Get Iterator
        const iterator = track.getRowIterator();

        const rows = [];
        let rowInstructions = [];

        console.log('segmentLengthTicks', segmentLengthTicks);

        while(rows.length < track.getRowLength()) {
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
        // console.log(e.type, e.key, e.ctrlKey);
        if(e.isDefaultPrevented())
            return;
        if(e.ctrlKey) switch(e.key) {
            case 'x': composer.instructionCut(this.getTrackName()); return;
            case 'c': composer.instructionCopy(this.getTrackName()); return;
            case 'v': composer.instructionPasteAtCursor(this.getTrackName()); return;
            default: break;
        }
        // let selectedIndices;
        switch(e.key) {
            case 'Delete':
                composer.instructionDeleteSelected();
                break;
            //
            // case 'Escape':
            // case 'Backspace':
            //     break;
            //
            case 'Enter':
                composer.instructionInsertAtCursor(null, null);
                this.playSelectedInstructions();
                break;
            //
            case ' ':
            case 'Play':
                composer.songPlay(); // TODO: play track?
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
                this.setCursorPositionOffset(targetCursorOffset, targetCursorInfo.positionTicks);
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
                const keyboardCommand = composer.keyboard.getKeyboardCommand(e.key, composer.state.keyboardOctave);
                if(keyboardCommand) {
                    const selectedIndices = this.getSelectedIndices();
                    // const {cursorIndex} = this.cursorGetInfo()
                    if(selectedIndices && selectedIndices.length > 0) {
                        composer.instructionReplaceArgByType(this.getTrackName(), selectedIndices, ArgType.frequency, keyboardCommand);

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


    /** Menu **/


    renderContextMenu() {
        // const selectedIndices = this.getTracker().getSelectedIndices();
        return this.getComposer().renderMenuEdit();
    }

}

