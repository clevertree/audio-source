
// Meant to be used in real-time
import {NoteInstruction} from "./index";

class InstructionPlayback {
    constructor(destination, song, trackName, startTime = null, onEvent = null) {
        if (!destination || !destination.context)
            throw new Error("Invalid destination");
        if(startTime === null)
            startTime = destination.context.currentTime;
        this.startTime = startTime;

        this.trackIterator = song.trackGetIterator(destination, onEvent);
        this.audioContext = destination.context;
        this.song = song;
        this.seekLength = 10;
        this.seekInterval = setInterval(() => this.renderPlayback(), this.seekLength / 10);
        this.active = true;

        this.endPromise = new Promise((resolve, reject) => {
            this.endResolve = resolve;
        });

        this.renderPlayback();
        this.playTrackInstructionCallback = this.playTrackInstruction.bind(this);
    }

    getPositionInSeconds() {
        return this.audioContext.currentTime - this.startTime;
    }

    async awaitPlaybackReachedEnd() {
        return await this.endPromise;
    }

    renderPlayback() {
        const currentPositionSeconds = this.getPositionInSeconds(); // this.audioContext.currentTime - this.startTime;

        if(!this.active || this.trackIterator.hasReachedEnd()) {
            clearInterval(this.seekInterval);
            const endPositionSeconds = this.trackIterator.getEndPositionInSeconds();
            const timeTillFinished = endPositionSeconds - currentPositionSeconds;
            console.log(`Song is ending in ${timeTillFinished} seconds`);
            if(timeTillFinished > 0)
                setTimeout(() => this.endPlayback(), timeTillFinished * 1000);
            else
                this.endPlayback();
        } else {
            this.trackIterator.seekToPosition(currentPositionSeconds + this.seekLength, this.playTrackInstructionCallback);
        }
    }

    endPlayback() {
        this.endResolve();
        this.active = false;
        // this.endPromise = true;
    }

    playTrackInstruction(instruction, trackStats) {
        if(typeof trackStats.program === "undefined")
            return console.error("Track has no program set: ", trackStats);
        if(instruction instanceof NoteInstruction) {
            const noteStartTime = this.startTime + trackStats.startPosition + trackStats.iterator.positionSeconds; // Track start time equals current track's start + playback times
            this.song.playInstruction(trackStats.destination, instruction, trackStats.program, noteStartTime, trackStats.trackName);
        }
    }

}

export default InstructionPlayback;
