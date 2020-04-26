import TrackIterator from "./TrackIterator";
import {NoteInstruction} from "../instruction";


export default class TrackPlayback extends TrackIterator {
    constructor(destination, song, startingTrackName = null, startTime = null, onEvent=null) {
        super(song.data.tracks,
            startingTrackName || song.getStartTrackName(),
            song.data.beatsPerMinute,
            song.data.timeDivision)

        if (!destination || !destination.context)
            throw new Error("Invalid destination");
        this.audioContext = destination.context;

        if(startTime === null)
            startTime = destination.context.currentTime;
        this.startTime = this.audioContext.currentTime - startTime;

        this.onEvent = onEvent;

        this.song = song;
        this.seekLength = 10;
        this.active = true;
        this.seekInterval = setInterval(() => this.renderPlayback(), this.seekLength / 10);

        this.endPromise = new Promise((resolve, reject) => {
            this.endResolve = resolve;
        });

        this.playTrackInstructionCallback = this.playTrackInstruction.bind(this);

        this.renderPlayback();
    }

    getPositionInSeconds() {
        return this.audioContext.currentTime - this.startTime;
    }

    async awaitPlaybackReachedEnd() {
        return await this.endPromise;
    }

    renderPlayback() {
        const currentPositionSeconds = this.getPositionInSeconds(); // this.audioContext.currentTime - this.startTime;

        if(!this.active || this.hasReachedEnd()) {
            clearInterval(this.seekInterval);
            const endPositionSeconds = this.getEndPositionInSeconds();
            const timeTillFinished = endPositionSeconds - currentPositionSeconds;
            console.log(`Song is ending in ${timeTillFinished} seconds`);
            if(timeTillFinished > 0)
                setTimeout(() => this.stopPlayback(), timeTillFinished * 1000);
            else
                this.stopPlayback();
        } else {
            this.seekToPosition(currentPositionSeconds + this.seekLength, this.playTrackInstructionCallback);
        }
    }

    stopPlayback() {
        if(this.active) {
            this.active = false;
            this.endResolve();
        }
        // this.endPromise = true;
    }

    playTrackInstruction(instruction, trackStats) {
        if(typeof trackStats.program === "undefined")
            return console.error("Track has no program set: ", trackStats);
        if(instruction instanceof NoteInstruction) {
            const noteStartTime = this.startTime + trackStats.startPosition + trackStats.iterator.positionSeconds; // Track start time equals current track's start + playback times
            if(noteStartTime > 0) {
                this.song.playInstruction(trackStats.destination, instruction, trackStats.program, noteStartTime, trackStats.trackName);
            }
        }
    }

    /**
     * @param {CommandInstruction} instruction
     * @param trackStats
     */
    processCommandInstruction(instruction, trackStats) {
        instruction.processCommandInstruction(this.song, trackStats);
    }



    startTrackIteration(trackStats) {
        super.startTrackIteration(trackStats);

        this.onEvent && this.onEvent({
            type: 'track:start',
            playback: this,
            trackStats
        });
        // console.log("Track Playback: ", trackStats.trackName);
    }

}
