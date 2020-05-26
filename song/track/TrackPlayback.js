import TrackIterator from "./TrackIterator";
import ProgramLoader from "../../common/program/ProgramLoader";


export default class TrackPlayback extends TrackIterator {
    constructor(destination, song, startingTrackName = null) {
        super(song,
            startingTrackName || song.getStartTrackName(),
            {
                destination,
                startTime: null,
            })

        if (!destination || !destination.context)
            throw new Error("Invalid destination");
        this.audioContext = destination.context;
        this.destination = destination;

        // this.startTime = null;
        this.seekLength = 10;
        this.active = false;
        this.activePrograms = [];

        this.endPromise = new Promise((resolve, reject) => {
            this.endResolve = resolve;
        });
        this.executionFilter = function() { return true; }
    }

    isActive() { return this.active; }

    /** Command Processing Interface **/

    onExecuteProgram(trackStats, commandString, params) {
        if(this.executionFilter(trackStats, commandString, params)) {
            const program = trackStats.program;
            program[commandString].apply(program, params);
        }
    }


    onPlayTrack(trackStats, params) {
        const subTrackStats = super.onPlayTrack(trackStats, params)

        subTrackStats.program = trackStats.program;
        subTrackStats.destination = trackStats.destination;
    }

    onLoadProgram(trackStats, params) {

        const oldProgram = trackStats.program;
        const oldDestination = trackStats.destination;
        let programInstance;
        if(typeof params[0] === "string") {
            programInstance = ProgramLoader.loadInstance(params[0], params[1]);
        } else {
            programInstance = this.song.programLoadInstanceFromID(params[0]);
        }
        trackStats.program = programInstance;

        // useDestination allows for audio processing (i.e. effects)
        if(typeof programInstance.useDestination === 'function')
            trackStats.destination = programInstance.useDestination(oldDestination);

        // useProgram allows for both note processing and audio processing effects
        if(typeof programInstance.useProgram === 'function')
            programInstance.useProgram(oldProgram);

        this.activePrograms.push(programInstance);
    }



    /** Actions **/

    startTrackIteration(trackStats) {
        super.startTrackIteration(trackStats)
        if(!trackStats.playingIndices)
            trackStats.playingIndices = [];
        // this.onEvent({
        //     type: 'track:start',
        //     playback: this,
        //     trackStats
        // });
    }

    setExecutionFilter(executionFilter) {
        this.executionFilter = executionFilter;
    }

    play(startPosition=null) {
        const stats = this.activeIterators[0].stats;
        this.active = true;

        stats.startTime = this.audioContext.currentTime; // this.audioContext.currentTime


        this.seekInterval = setInterval(() => this.renderPlayback(), this.seekLength / 10);

        if(startPosition !== null) {
            stats.startTime -= startPosition;
            // this.seekToPosition(startPosition);
        }
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
        const stats = this.activeIterators[0].stats;
        return this.audioContext.currentTime - stats.startTime;

    }

    // getPositionInSeconds() {
    //     return this.startTime;
    // }

    async awaitPlaybackReachedEnd() {
        return await this.endPromise;
    }

    renderPlayback() {
        const currentPositionSeconds = this.getPlaybackPosition();
        // console.log('currentPositionSeconds', currentPositionSeconds);

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
            this.seekToPosition(currentPositionSeconds + this.seekLength);
        }
    }

    stopPlayback() {
        if(this.active) {
            this.active = false;
            this.endResolve();
        }
        this.activePrograms.forEach(program => {
            try {  program.stopPlayback() }
            catch (e) { console.log(e); }
        });
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
