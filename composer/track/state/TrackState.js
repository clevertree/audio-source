import TrackInstructionRowIterator from "../instruction/TrackInstructionRowIterator";
import {InstructionIterator} from "../../../song";

export default class TrackState {
    static DEFAULT_ROW_LENGTH = 16;
    static DEFAULT_MEASURES_PER_SEGMENT = 4;
    static DEFAULT_BEATS_PER_MEASURE = 4;
    static DEFAULT_MAX_SEGMENTS = 8;
    static DEFAULT_MIN_SEGMENTS = 4;

    constructor(composer, trackName) {
        this.composer = composer;
        this.trackName = trackName;
        this.state = composer.state.activeTracks[trackName];
        // if(!this.state)
        //     throw new Error("Invalid Track State: " + trackName);
    }


    getTimeDivision() { return this.state.timeDivision || this.composer.song.data.timeDivision; }

    getQuantizationTicks() { return this.state.quantizationTicks || this.getTimeDivision(); }
    getBeatsPerMinute() { return this.state.beatsPerMinute || this.composer.song.data.beatsPerMinute; }

    getBeatsPerMeasure() { return this.state.beatsPerMeasure || this.composer.song.data.beatsPerMeasure || TrackState.DEFAULT_BEATS_PER_MEASURE; }
    getMeasuresPerSegment() { return this.state.measuresPerSegment || TrackState.DEFAULT_MEASURES_PER_SEGMENT; }
    getBeatsPerSegment() { return this.getBeatsPerMeasure() * this.getMeasuresPerSegment(); }
    getSegmentLengthTicks() { return this.getBeatsPerSegment() * this.getTimeDivision(); }

    // getProgramID() { return this.state.programID; }
    // getCursorOffset() { return this.state.cursorOffset || 0; }

    // getCursorPositionTicks() { return this.state.cursorPositionTicks || 0; }

    getSelectedIndices() {
        if(this.isSelectedTrack())
            return this.composer.state.selectedTrackIndices;
        return [];
    }
    getPlayingIndices() { return this.state.playingIndices || []; }

    getRowLength() { return typeof this.state.rowLength !== "undefined" ? this.state.rowLength : TrackState.DEFAULT_ROW_LENGTH; }

    getRowOffset() { return this.state.rowOffset || 0; }

    getDestinationList() { return this.state.destinationList || []; }
    getTrackLengthTicks() { return this.state.trackLengthTicks || null; }

    getSegmentRowOffsets() { return this.state.segmentRowOffsets || [0]; }

    getStartPosition() { return this.state.startPosition || 0; }

    isSelectedTrack() {
        return this.trackName === this.composer.getSelectedTrackName();
    }


    /** Actions **/



    /**
     * Used when track has been modified
     * @deprecated
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
                && segmentRowOffsets.length >= TrackState.DEFAULT_MIN_SEGMENTS)
                break;
            if(segmentRowOffsets.length >= TrackState.DEFAULT_MAX_SEGMENTS)
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

        this.composer.setState(state => {
            const trackState = state.activeTracks[this.trackName];
            trackState.trackLengthTicks = trackLengthTicks;
            trackState.quantizationTicks = quantizationTicks;
            trackState.rowLength = rowLength;
            trackState.segmentRowOffsets = segmentRowOffsets;
            this.state = trackState;
            return state;
        });
        // this.composer.saveStateWithTimeout(); // TODO: why is this here?
    }

    updatePlayingIndices(playingIndices) {
        this.composer.setState(state => {
            const trackState = state.activeTracks[this.trackName];
            trackState.playingIndices = playingIndices;
            this.state = trackState;
            return state;
        });
    }

    changeQuantization(quantizationTicks) {
        if (!quantizationTicks || !Number.isInteger(quantizationTicks))
            throw new Error("Invalid quantization value");
        this.updateRenderingProps(quantizationTicks);
    }

    changeRowLength(rowLength = null) {
        if (!Number.isInteger(rowLength))
            throw new Error("Invalid track row length value");
        this.updateRenderingProps(null, rowLength);
    }


}
