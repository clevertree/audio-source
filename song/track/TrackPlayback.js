import TrackIterator from "./TrackIterator";
import ProgramLoader from "../program/ProgramLoader";


export default class TrackPlayback extends TrackIterator {
    constructor(destination, song, startingTrackName = null, filterProgramCommand=null) {
        super(song,
            startingTrackName || song.getStartTrackName(),
            {
                destination,
                startTime: null,
            },
            filterProgramCommand
        );

        if (!destination || !destination.context)
            throw new Error("Invalid destination");
        this.audioContext = destination.context;
        this.destination = destination;
        this.lastCurrentTime = null;

        this.startTime = null;
        this.seekLength = 2;
        this.active = false;
        this.activePrograms = [];

        this.endPromise = new Promise((resolve, reject) => {
            this.endResolve = resolve;
        });
        // console.log('TrackPlayback', startingTrackName, song);
    }

    isActive() { return this.active; }

    /** Command Processing Interface **/



    processCommandInstruction(instructionData, stats) {
        super.processCommandInstruction(instructionData, stats);
    }


    onExecuteProgram(trackStats, commandString, params) {
        const program = trackStats.program;
        if(!program) {
            console.warn("Failed to execute command on empty program: ", commandString, params, trackStats);
            // TODO: error state
        } else {
            // console.log(program.constructor.name, `(${commandString})`, params);
            program[commandString].apply(program, params);
        }
    }


    // onPlayTrack(trackStats, trackName, trackDuration=null, trackStartTime=0, trackFrequency=null) {
    //     const subTrackStats = super.onPlayTrack(trackStats, trackName, trackDuration, trackStartTime, trackFrequency);
    //
    //     subTrackStats.program = trackStats.program;
    //     subTrackStats.destination = trackStats.destination;
    // }

    onLoadProgram(trackStats, program) {

        const oldProgram = trackStats.program;
        // const oldDestination = trackStats.destination;
        let programInstance;
        if(Array.isArray(program)) {
            programInstance = ProgramLoader.loadInstance(program[0], program[1]);
        } else {
            programInstance = this.song.programLoadInstanceFromID(program);
        }
        trackStats.program = programInstance;

        // useDestination allows for audio processing (i.e. effects)
        // if(typeof programInstance.useDestination === 'function')
        //     trackStats.destination = programInstance.useDestination(oldDestination);

        // useProgram allows for both note processing and audio processing effects
        if(typeof programInstance.useProgram === 'function')
            programInstance.useProgram(oldProgram);

        this.activePrograms.push(programInstance);
    }



    /** Actions **/

    startTrackIteration(stats) {
        super.startTrackIteration(stats)
        if(!stats.playingIndices)
            stats.playingIndices = [];
        const playingIndices = stats.playingIndices;
        stats.onInstructionStart = (startTime) => {
            if(!this.active) return;
            const waitTime = startTime -this.audioContext.currentTime;
            // console.log('onInstructionStart', startTime, waitTime);
            const event = {
                type: 'instruction:start',
                trackName: stats.trackName,
                index: stats.currentIndex,
                playingIndices,
            }
            setTimeout(() => {
                if(!this.active) return;
                playingIndices.push(event.index);
                this.song.dispatchEvent(event)
            }, waitTime * 1000);
                                    // console.log('playingIndices.push', playingIndices);
        };
        stats.onInstructionEnd = (index) => {
            if(!this.active) return;
            const event = {
                type: 'instruction:end',
                trackName: stats.trackName,
                index,
                playingIndices,
            }
            // console.log('onInstructionEnd', playingIndices, event);
            const i = playingIndices.indexOf(event.index);
            if(i !== -1)
                playingIndices.splice(i, 1);
            this.song.dispatchEvent(event)
        };
        // this.onEvent({
        //     type: 'track:start',
        //     playback: this,
        //     trackStats
        // });
    }


    play(startPosition=null) {
        // console.log('TrackPlayback.play', startPosition);
        const stats = this.activeIterators[0].stats;
        this.active = true;


        this.startTime = this.audioContext.currentTime; // this.audioContext.currentTime
        if(startPosition !== null)
            this.startTime -= startPosition;
        stats.startTime = this.startTime; // TODO: redundant?

        this.seekInterval = setInterval(() => this.renderPlayback(), (this.seekLength * 1000) / 2);

        this.renderPlayback();
    }


    playAtStartingTrackIndex(index, callback=null) {
        const stats = this.activeIterators[0].stats;
        const iterator = this.instructionGetIterator({
            trackName: stats.trackName,
        });
        iterator.seekToIndex(index, callback);
        const startPosition = iterator.getPositionInSeconds();
        this.play(startPosition);
        // console.log('playAtStartingTrackIndex', index, startPosition);
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
        const currentPositionSeconds = this.audioContext.currentTime - this.startTime;
        if(this.audioContext.currentTime === this.lastCurrentTime)
            console.warn("audioContext.currentTime is stalling: ", this.audioContext.currentTime, this.lastCurrentTime);
        this.lastCurrentTime = this.audioContext.currentTime;

        // console.log('renderPlayback()', {currentPositionSeconds}, this.active, this.hasReachedEnd(), this);

        if(!this.active || this.hasReachedEnd()) {
            clearInterval(this.seekInterval);
            const endPositionSeconds = this.getEndPositionInSeconds();
            const timeTillFinished = endPositionSeconds - currentPositionSeconds;
            // console.log(`Song is ending in ${timeTillFinished} seconds`);
            if(timeTillFinished > 0)
                setTimeout(() => this.stopPlayback(false), timeTillFinished * 1000);
            else
                this.stopPlayback(false);
        } else {
            this.seekToPosition(currentPositionSeconds + this.seekLength);
        }
    }

    stopPlayback(stopAllNotes=true) {
        // console.log('TrackPlayback.stopPlayback', stopAllNotes);
        if(this.active) {
            this.active = false;
            this.endResolve();
        }
        // TODO: unnecessary?
        if(stopAllNotes) {
            ProgramLoader.stopAllPlayback()
            // this.activePrograms.forEach(program => {
            //     try {  program.stopPlayback() }
            //     catch (e) { console.log(program.constructor.name, e); }
            // });
        }
        this.activePrograms = [];
        // this.endPromise = true;
    }

    // playInstruction(instruction, trackStats) {
    //     if(instruction instanceof NoteInstruction) {
    //         if(typeof trackStats.program === "undefined")
    //             return console.error(`Track '${trackStats.trackName}' has no program set`);
    //         const destination = trackStats.destination || this.destination;
    //         const noteStartTime = this.startTime + trackStats.startPosition + trackStats.iterator.getPositionInSeconds(); // ASCTrack start time equals current track's start + playback times
    //         if(noteStartTime > 0) {
    //             const noteIndex = trackStats.currentIndex;
    //             const playingIndices = trackStats.playingIndices;
    //             const onEvent = this.onEvent;
    //             this.song.playInstruction(destination, instruction, trackStats.program, noteStartTime,
    //                 () => {
    //                     if(playingIndices.indexOf(noteIndex) === -1) {
    //                         playingIndices.push(noteIndex);
    //                         // console.log('playingIndices.push', playingIndices);
    //
    //                         onEvent({
    //                             type: 'instruction:play',
    //                             playback: this,
    //                             playingIndices,
    //                             trackStats
    //                         });
    //                     }
    //                 },
    //                 () => {
    //                     playingIndices.splice(playingIndices.indexOf(noteIndex), 1);
    //                     // console.log('playingIndices.splice', playingIndices);
    //                     onEvent({
    //                         type: 'instruction:stop',
    //                         playback: this,
    //                         playingIndices,
    //                         trackStats
    //                     });
    //
    //
    //                 });
    //         }
    //     }
    // }

    // onPlayTrack(trackStats, params) {
    //     super.onPlayTrack(trackStats, params);
    // }
}
