
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

        this.endPromise = new Promise((resolve, reject) => {
            this.endResolve = resolve;
        });

        this.renderPlayback();
    }

    async awaitPlaybackReachedEnd() {
        return await this.endPromise;
    }

    renderPlayback() {
        const currentPositionSeconds = this.audioContext.currentTime - this.startTime;

        this.trackIterator.seekToPosition(currentPositionSeconds + this.seekLength, this.playTrackInstruction.bind(this));
        if(this.trackIterator.hasReachedEnd()) {
            clearInterval(this.seekInterval);
            const endPositionSeconds = this.trackIterator.getEndPositionInSeconds();
            const timeTillFinished = endPositionSeconds - currentPositionSeconds;
            console.log(`Song is ending in ${timeTillFinished} seconds`);
            if(timeTillFinished > 0)
                setTimeout(() => this.endPlayback(), timeTillFinished * 1000);
            else
                this.endPlayback();
        }
    }

    endPlayback() {
        this.endResolve();
        // this.endPromise = true;
    }

    playTrackInstruction(instruction, trackStats) {
        if(instruction instanceof NoteInstruction) {
            const noteStartTime = this.startTime + trackStats.startPosition + trackStats.iterator.positionSeconds; // Track start time equals current track's start + playback times
            // TODO: get instruction ID
            this.song.playInstruction(trackStats.destination, instruction, 0, noteStartTime, trackStats.trackName);
        }
    }

}

export default InstructionPlayback;
