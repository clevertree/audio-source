export default class ASCTrackState {
    static DEFAULT_ROW_LENGTH = 16;
    static DEFAULT_SEGMENT_LENGTH = 16;

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
    get beatsPerMeasure() { return this.state.beatsPerMeasure || this.composer.song.data.beatsPerMeasure; }

    get programID() { return this.state.programID; }

    get selectedIndices() { return this.state.selectedIndices || []; }
    get cursorOffset() { return this.state.cursorOffset || 0; }

    get currentCommand() { return this.state.currentCommand || 'C4'; }
    get currentDuration() { return this.state.currentDuration || '1B'; }
    get currentVelocity() { return this.state.currentVelocity || null; }

    get destinationList() { return this.state.destinationList || []; }
    get rowLength() { return this.state.rowLength || ASCTrackState.DEFAULT_ROW_LENGTH; }
    get rowOffset() { return this.state.rowOffset || 0; }
    get segmentCount() { return this.state.segmentCount || 3; }
    get startPosition() { return this.state.startPosition || 0; }

    async update(newState) {
        await this.composer.updateState(state => {
            if(typeof newState === "function")
                newState = newState();

            state.activeTracks[this.trackName] = newState;
            return state;
        })
    }
}
