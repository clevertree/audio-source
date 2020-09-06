import * as React from "react";

import {ASUIButton, ASUIButtonDropDown} from "../../components/";
import ASCTrackInstruction from "./instruction/ASCTrackInstruction";
import ASCTrackRow from "./row/ASCTrackRow";
import ASCTrackBase from "./ASCTrackBase";
import {Values} from "../../common";


// TODO: ASCTrackRowContainer

export default class ASCTrackRenderer extends ASCTrackBase {
    constructor(props) {
        super(props);
        this.renderStats.songPositionRowRange = [0,0];
    }

    /** Render Content **/


    renderRowContent() {
        // const composer = this.getComposer();
        // const track = this.getTrackState();

        /** Song Position **/
        const songPosition = this.getSongPosition();
        const trackSongPosition = songPosition - this.getStartPosition();
        let trackSongPositionFound = false;


        /** Offsets **/
        const cursorOffset = this.getCursorOffset();
        const rowOffset = this.getRowOffset();

        // const quantizationTicks = this.getQuantizationTicks() || this.getSong().data.timeDivision;

        // console.time('ASCThis.renderRowContent()');
        const selectedIndices = this.getSelectedIndices();
        const playingIndices = this.getPlayingIndices();
        const beatsPerMeasureTicks = this.getBeatsPerMeasure() * this.getTimeDivision();
        // const measuresPerSegment = this.getMeasuresPerSegment();
        const segmentLengthTicks = this.getSegmentLengthTicks();
        const quantizationTicks = this.getQuantizationTicks();
        // const isSelectedTrack = this.isSelectedTrack();

        /** Rendering Stats **/
        this.renderStats.songPositionRowRange = null;


        /** Get Iterator **/
        const iterator = this.getRowIterator();

        const rows = [];
        let rowInstructions = [];

        const autoScrollToCursor = !this.props.selected

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
                    let positionSeconds = iterator.getPositionInSeconds();
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

                    if(!trackSongPositionFound) {
                        if(trackSongPosition <= positionSeconds) {
                            trackSongPositionFound = true;
                            const elapsedTimeSeconds = Values.instance.durationTicksToSeconds(rowDeltaTicks, iterator.getTimeDivision(), iterator.getBeatsPerMinute());
                            const lastPositionSeconds = positionSeconds - elapsedTimeSeconds;
                            if(trackSongPosition > lastPositionSeconds) {
                                this.renderStats.songPositionRowRange = [positionSeconds - elapsedTimeSeconds, positionSeconds];
                                highlight.push('position');
                            }
                            // console.log('this.renderStats.songPositionRowRange', this.renderStats.songPositionRowRange, elapsedTimeSeconds)
                        } else if(autoScrollToCursor) {
                            if(rows.length === rowLength-2)
                                rows.shift();
                        }
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
        let offsetList = this.getSegmentInfo().map(([offset, seconds, ticks]) => offset);
        // const segmentLengthTicks = this.getSegmentLengthTicks();
        // let nextSegmentPositionTicks = 0;

        const lastSegmentRowOffset = offsetList[offsetList.length - 1];
        const lastSegmentRowCount = lastSegmentRowOffset - offsetList[offsetList.length - 2];

        // if(rowOffset >= nextSegmentRowOffset) {
        for(let i=lastSegmentRowOffset + lastSegmentRowCount; i<=cursorRowOffset+lastSegmentRowCount; i+=lastSegmentRowCount) {
            offsetList.push(i);
        }
        // console.log('segmentInfo', cursorRowOffset, segmentInfo);
        // }

        let buttons = [];
        let firstButton=null;
        let selectedProps = null;
        for(let i=0; i<offsetList.length; i++) {
            const currentOffset = offsetList[i];
            const props = {
                onAction: e => this.setRowOffset(currentOffset),
                children: i
            }
            if(cursorRowOffset >= currentOffset) {
                selectedProps = props;
            }
            buttons.push(props);
            if(buttons.length > ASCTrackBase.DEFAULT_MAX_SEGMENTS) {
                if(selectedProps)
                    break;
                buttons.shift();
                // if(buttons[0].className) {
                //     buttons.pop();
                // } else {
                // const button = buttons.shift();
                // if(!firstButton)
                //     firstButton = button;
                // }
            }
        }
        if(selectedProps) {
            selectedProps.className = 'selected';
        }
        // console.log('segmentInfo', cursorRowOffset, segmentInfo);

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
            title={`Show ${rowLength} Rows`}
            arrow="▼"
            key="row-length"
            options={this.cb.renderMenuSetRowLength}
            children={`${rowLength} Rows`}
        />);


        return buttons;
    }


}
