import TrackIterator from "./TrackIterator";
import {Instruction, NoteInstruction} from "../instruction";


export default class TrackPlayback extends TrackIterator {
    constructor(song, startingTrackName = null, onEvent=null) {
        super(song.data.tracks,
            startingTrackName || song.getStartTrackName(),
            song.data.beatsPerMinute,
            song.data.timeDivision)



        this.onEvent = onEvent;

        this.song = song;
        this.seekLength = 10;
        this.active = true;

        this.endPromise = new Promise((resolve, reject) => {
            this.endResolve = resolve;
        });

        this.playTrackInstructionCallback = this.playTrackInstruction.bind(this);

    }

    addInstructionFilter(filterCallback) {
        const oldCallback = this.playTrackInstructionCallback;
        this.playTrackInstructionCallback = function(instruction, trackStats) {
            instruction = filterCallback(instruction, trackStats)
            if(instruction instanceof Instruction)
                oldCallback(instruction, trackStats);
        }
    }

    play(destination, startTime=null) {
        if (!destination || !destination.context)
            throw new Error("Invalid destination");
        this.audioContext = destination.context;
        this.destination = destination;

        if(startTime === null)
            startTime = this.audioContext.currentTime;
        this.startTime = startTime; // this.audioContext.currentTime

        this.seekInterval = setInterval(() => this.renderPlayback(), this.seekLength / 10);

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
            return console.error("ASCTrack has no program set: ", trackStats);
        if(instruction instanceof NoteInstruction) {
            const destination = trackStats.destination || this.destination;
            const noteStartTime = this.startTime + trackStats.startPosition + trackStats.iterator.positionSeconds; // ASCTrack start time equals current track's start + playback times
            if(noteStartTime > 0) {
                this.song.playInstruction(destination, instruction, trackStats.program, noteStartTime, trackStats.trackName);
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
        // console.log("ASCTrack Playback: ", trackStats.trackName);
    }

}
