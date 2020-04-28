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

    startTrackIteration(trackStats) {
        super.startTrackIteration(trackStats)
        if(!trackStats.playingIndices)
            trackStats.playingIndices = [];
        this.onEvent && this.onEvent({
            type: 'track:start',
            playback: this,
            trackStats
        });
    }

    addInstructionFilter(filterCallback) {
        const oldCallback = this.playTrackInstructionCallback;
        this.playTrackInstructionCallback = function(instruction, trackStats) {
            instruction = filterCallback(instruction, trackStats);
            if(!instruction)
                return;
            if(!instruction instanceof Instruction)
                throw new Error("Invalid Instruction");
            oldCallback(instruction, trackStats);
        }
    }

    play(destination, startPosition=null) {
        if (!destination || !destination.context)
            throw new Error("Invalid destination");
        this.audioContext = destination.context;
        this.destination = destination;

        this.startTime = this.audioContext.currentTime; // this.audioContext.currentTime

        this.seekInterval = setInterval(() => this.renderPlayback(), this.seekLength / 10);

        if(startPosition !== null) {
            this.seekToPosition(startPosition);
            this.startTime -= startPosition;
        }
        this.renderPlayback();
    }


    playAtStartingTrackIndex(destination, index, callback=null) {
        const trackStats = this.activeTracks[0];
        const iterator = this.instructionGetIterator(trackStats.trackName, trackStats.timeDivision, trackStats.beatsPerMinute);
        iterator.seekToIndex(index, callback);
        const startPosition = iterator.positionSeconds;
        this.play(destination, startPosition);
        console.log('playAtStartingTrackIndex', index, startPosition);
        // this.seekToPosition(startPosition, callback);
    }

    getPlaybackPosition() {
        return this.audioContext.currentTime - this.startTime;

    }

    // getPositionInSeconds() {
    //     return this.startTime;
    // }

    async awaitPlaybackReachedEnd() {
        return await this.endPromise;
    }

    renderPlayback() {
        const currentPositionSeconds = this.getPlaybackPosition();

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
                const noteIndex = trackStats.iterator.currentIndex;
                const playingIndices = trackStats.playingIndices;
                this.song.playInstruction(destination, instruction, trackStats.program, noteStartTime,
                    function() {
                        if(playingIndices.indexOf(noteIndex) === -1) {
                            playingIndices.push(noteIndex);
                            console.log('playingIndices.push', playingIndices);
                        }
                    },
                    function() {
                        playingIndices.splice(playingIndices.indexOf(noteIndex), 1);
                        console.log('playingIndices.splice', playingIndices);
                    });
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

}
