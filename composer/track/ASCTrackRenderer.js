import * as React from "react";

import {ASUIClickable, ASUIClickableDropDown} from "../../components/";
import ASCTrackInstruction from "./instruction/ASCTrackInstruction";
import ASCTrackRow from "./row/ASCTrackRow";
import ASCTrackBase from "./ASCTrackBase";
import {Values} from "../../song";


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
        const trackSongPositionSeconds = songPosition - this.getStartPosition();
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
        // let lastRowPositionSeconds = 0;
        while(rows.length < rowLength) {
            const nextCursorEntry = iterator.nextCursorPosition();
            if(Array.isArray(nextCursorEntry)) {
                const instructionData = nextCursorEntry; //iterator.currentInstruction();
                // console.log('instruction', instruction);
                const index = iterator.getIndex();
                const instructionProp = {
                    key: index,
                    index: index,
                    instruction: instructionData,
                    track: this,
                    cursorPosition: iterator.getCursorPosition(),
                };
                if(iterator.getCursorPosition() === cursorOffset) {
                    instructionProp.cursor = true;

                }
                if(selectedIndices.indexOf(index) !== -1)
                    instructionProp.selected = true;
                if(playingIndices.indexOf(index) !== -1)
                    instructionProp.playing = true;
                rowInstructions.push(instructionProp)

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
                let rowPositionSeconds = iterator.getPositionInSeconds();

                if(rowID >= rowOffset) {
                    let rowPositionTicks = iterator.getPositionInTicks();
                    // let segmentID = Math.floor(positionTicks / segmentLengthTicks);
                    let beatID = Math.floor(rowPositionTicks / quantizationTicks);
                    let highlight = [beatID % 2 === 0 ? 'even' : 'odd'];

                    // let beatOffset = positionTicks % quantizationTicks;
                    // let segmentOffsetPerc = beatOffset / quantizationTicks;
                    // console.log({beatID, segmentOffsetTicks: beatOffset, segmentOffsetPerc})

                    if(rowPositionTicks % segmentLengthTicks === 0) {
                        highlight.push('segment-start');
                        // if(rows.length>0)
                        //     rowsngth>0)
                        //     rows[rows.length-1].highlight.push('segment-end');
                    } else if(rowPositionTicks % beatsPerMeasureTicks === 0) {
                        highlight.push('measure-start');
                        // if(rows.length>0)
                        //     rows[rows.length-1].highlight.push('measure-end');
                    }

                    if(!trackSongPositionFound) {
                        const elapsedTimeSeconds = Values.instance.durationTicksToSeconds(rowDeltaTicks, iterator.getTimeDivision(), iterator.getBeatsPerMinute());
                        const nextRowPositionSeconds = rowPositionSeconds + elapsedTimeSeconds;
                        if (trackSongPositionSeconds < nextRowPositionSeconds) {
                            trackSongPositionFound = true;
                            this.renderStats.songPositionRowRange = [rowPositionSeconds, nextRowPositionSeconds - 0.0001]; // Hack?
                            highlight.push('position');
                        }
                        if(autoScrollToCursor) {
                            if(rows.length > rowLength-2)
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
                // lastRowPositionSeconds = rowPositionSeconds;
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


    renderRowSegments() {
        // const trackState = this.getTrackState();
        const cursorRowOffset = this.getRowOffset();
        // const rowLength = this.getRowLength();
        let offsetList = this.getSegmentInfo().map(([offset, seconds]) => offset);


        const lastSegmentRowOffset = offsetList[offsetList.length - 1];
        const lastSegmentRowCount = lastSegmentRowOffset - offsetList[offsetList.length - 2];

        for(let i=lastSegmentRowOffset + lastSegmentRowCount; i<=cursorRowOffset+lastSegmentRowCount; i+=lastSegmentRowCount) {
            offsetList.push(i);
        }


        let selectedSegmentID = 0;
        for(let segmentID=0; segmentID<offsetList.length; segmentID++) {
            const currentOffset = offsetList[segmentID];
            if(cursorRowOffset < currentOffset)
                break;
            selectedSegmentID = segmentID;
        }
        let segmentStart = selectedSegmentID - ASCTrackBase.DEFAULT_MAX_SEGMENTS/2;
        if(segmentStart < 1)
            segmentStart = 1;
        let segmentEnd = segmentStart + ASCTrackBase.DEFAULT_MAX_SEGMENTS;
        // console.log('offsetList', offsetList, selectedSegmentID, segmentStart, segmentEnd);
        const buttonProps = [];
        for(let segmentID=0; segmentID<offsetList.length; segmentID++) {
            if(segmentID !== 0 && segmentID !== offsetList.length - 1) {
                if (segmentID < segmentStart) continue;
                if (segmentID > segmentEnd) continue;
            }
            const currentOffset = offsetList[segmentID];
            const props = {
                onAction: e => this.setRowOffset(currentOffset),
                children: segmentID,
            }
            if(selectedSegmentID === segmentID)
                props.selected = true;
            buttonProps.push(props);
        }

        return buttonProps.map((props, i) => <ASUIClickable
            button wide
            key={i}
            {...props}
        />);
    }


    renderQuantizationButton() {
        const composer = this.props.composer;

        const quantizationTicks = this.getQuantizationTicks();
        const rowDeltaDuration = Values.instance.formatDuration(quantizationTicks, composer.getSong().getTimeDivision());
        return <ASUIClickableDropDown
            button
            className="row-quantization"
            title={`Quantization (Duration = ${rowDeltaDuration})`}
            arrow="▼"
            options={this.cb.renderMenuSetQuantization}
            children={rowDeltaDuration}
        />;
    }

    // renderSelectTrackButton() {
    //     return <ASUIClickable
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
        buttons.push(<ASUIClickableDropDown
            button
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
