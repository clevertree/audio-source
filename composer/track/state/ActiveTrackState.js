export default class ActiveTrackState {
    static DEFAULT_ROW_LENGTH = 16;
    static DEFAULT_BEATS_PER_SEGMENT = 16;
    static DEFAULT_BEATS_PER_MEASURE = 4;

    constructor(composer, trackName=null) {
        if(trackName === null)
            trackName = composer.state.selectedTrack;
        if(!composer.state.activeTracks.hasOwnProperty(trackName))
            throw new Error(`Invalid track: ${trackName}`)

        this.composer = composer;
        this.trackName = trackName;
        this.state = composer.state.activeTracks[trackName];
    }

    get timeDivision() { return this.state.timeDivision || this.composer.song.data.timeDivision; }
    get quantizationTicks() { return this.state.quantizationTicks || this.timeDivision; }

    get beatsPerMinute() { return this.state.beatsPerMinute || this.composer.song.data.beatsPerMinute; }
    get beatsPerMeasure() { return this.state.beatsPerMeasure || this.composer.song.data.beatsPerMeasure || ActiveTrackState.DEFAULT_BEATS_PER_MEASURE; }

    get programID() { return this.state.programID; }

    get selectedIndices() { return this.state.selectedIndices || []; }
    /** @deprecated **/
    get cursorOffset() { return this.state.cursorOffset || 0; }
    get cursorPositionTicks() { return this.state.cursorPositionTicks || 0; }
    get playingIndices() { return this.state.playingIndices || []; }

    get currentInstructionType() { return this.state.currentInstructionType || 'custom'; }
    get currentCommand() { return this.state.currentCommand || 'C4'; }
    get currentDuration() { return this.state.currentDuration || '1B'; }
    get currentVelocity() { return this.state.currentVelocity || null; }
    get currentArguments() { return this.state.currentArguments || []; }

    get destinationList() { return this.state.destinationList || []; }
    get rowLength() { return typeof this.state.rowLength !== "undefined" ? this.state.rowLength : ActiveTrackState.DEFAULT_ROW_LENGTH; }
    get rowOffset() { return this.state.rowOffset || 0; }

    get trackLengthTicks() { return this.state.trackLengthTicks || null; }
    get segmentLengthTicks() { return this.state.segmentLengthTicks || (this.timeDivision * ActiveTrackState.DEFAULT_BEATS_PER_SEGMENT); }
    get segmentPositions() { return this.state.segmentPositions || [0]; }

    get startPosition() { return this.state.startPosition || 0; }

    async update(newState) {
        await this.composer.updateState(state => {
            if(typeof newState === "function")
                newState(state.activeTracks[this.trackName]);

            // state.activeTracks[this.trackName] = newState;
            return state;
        })
    }
}
