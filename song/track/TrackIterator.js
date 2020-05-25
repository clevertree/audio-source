import InstructionIterator from "../instruction/iterator/InstructionIterator";
import InstructionProcessor from "../../common/program/InstructionProcessor";


export default class TrackIterator {
    constructor(song, startingTrackName, startingStats= {}) {
        this.song = song;
        if (!this.song.hasTrack(startingTrackName))
            throw new Error("Invalid instruction track: " + startingTrackName);

        // this.onEvent = onEvent || function() {};

        // this.onEvent = onEvent;
        // this.positionSeconds = 0;
        // this.seekLength = 10;
        this.activeIterators = [];
        // this.currentTrackID = -1;

        // program: trackStats.program,            // Current program which all notes route through
        // destination: trackStats.destination,    // Current destination sent to all playFrequency calls

        startingStats.startTime = 0;
        startingStats.startPosition = 0;            // Necessary for position calculations
        startingStats.trackName = startingTrackName;
        if(!startingStats.beatsPerMinute)
            startingStats.beatsPerMinute = song.data.beatsPerMinute;
        if(!startingStats.timeDivision)
            startingStats.timeDivision = song.data.timeDivision; // Time division is passed to sub-groups

        this.processor = new InstructionProcessor(
            (trackStats, params) => this.onLoadProgram(trackStats, params),
            (trackStats, commandString, params) => this.onExecuteProgram(trackStats, commandString, params),
            (trackStats, params) => this.onPlayTrack(trackStats, params),
        )

        // Start Track iteration
        this.startTrackIteration(startingStats);
    }

    onLoadProgram(trackStats, params) {
        trackStats.program = null; // TODO: use dummy program here?
    }

    onExecuteProgram(trackStats, commandString, params) {
        // console.log("onExecuteProgram", trackStats.trackName, commandString, params);
    }


    onPlayTrack(trackStats, params) {
        const trackName = params[0];
        // console.log("onPlayTrack", trackStats.trackName, params);
        const subTrackStats = {
            // program: trackStats.program,            // Current program which all notes route through
            // destination: trackStats.destination,    // Current destination sent to all playFrequency calls
            // parentStats: trackStats,
            startTime: trackStats.startTime + trackStats.positionSeconds,
            startPosition: trackStats.positionSeconds,
            trackName,
            beatsPerMinute: trackStats.beatsPerMinute,
            timeDivision: trackStats.timeDivision, // Time division is passed to sub-groups
        };
        // TODO: process track instruction parameters
        this.startTrackIteration(subTrackStats);
        return subTrackStats;
    }


    processCommandInstruction(instruction, stats) {
        this.processor.processCommandInstruction(instruction, stats);
    }

    instructionGetIterator(trackStats) {
        return InstructionIterator.getIteratorFromSong(
            this.song,
            trackStats.trackName,
            trackStats,
            (instruction, stats) => this.processCommandInstruction(instruction, stats)
        )
    }


    startTrackIteration(trackStats) {
        trackStats.endPositionTicks = 0;
        trackStats.endPositionSeconds = 0;
        const iterator = this.instructionGetIterator(trackStats);
        this.activeIterators.push(iterator);
        return trackStats;
    }

    /** @deprecated **/
    getPositionInSeconds() {
        let totalPositionSeconds = 0;
        for(let i=0; i<this.activeIterators.length; i++) {
            const iterator = this.activeIterators[i];
            const startPosition = iterator.stats.startPosition;
            const positionSeconds = startPosition + iterator.getPositionInSeconds();
            if (positionSeconds > totalPositionSeconds)
                totalPositionSeconds = positionSeconds;
        }
        return totalPositionSeconds;
    }

    getEndPositionInSeconds() {
        let totalEndPositionSeconds = 0;
        for(let i=0; i<this.activeIterators.length; i++) {
            const iterator = this.activeIterators[i];
            const endPositionSeconds = iterator.stats.startPosition + iterator.stats.endPositionSeconds;
            if (endPositionSeconds > totalEndPositionSeconds)
                totalEndPositionSeconds = endPositionSeconds;
        }
        return totalEndPositionSeconds;
    }

    // incrementTrack() {
    //     this.currentTrackID++;
    //     if(this.currentTrackID >= this.activeTracks.length)
    //         this.currentTrackID = 0;
    //     return this.currentTrackID;
    // }

    hasReachedEnd() {
        for(let i=0; i<this.activeIterators.length; i++) {
            const iterator = this.activeIterators[i];
            if(!iterator.hasReachedEnd())
                return false;
        }
        return true;
    }




    /** Seeking **/


    seekToEnd(callback=null, seekLength=1) {
        let seekPosition=0, finished = false;
        while(!finished) {
            seekPosition += seekLength; // Seek before
            finished = this.seekToPosition(seekPosition, callback);
        }
        // return this;
    }

    seekToPosition(positionSeconds, callback=null) {
        let finished = true;
        for(let i=0; i<this.activeIterators.length; i++) {
            const iterator = this.activeIterators[i];
            const stats = iterator.stats;
            if(!iterator.hasReachedEnd()) {
                iterator.seekToPosition(positionSeconds - stats.startPosition);
            }

            if (!iterator.hasReachedEnd()) {
                finished = false;
            } else {
                // TODO: update parent stats with end position?
                // const endPositionSeconds = stats.startPosition + stats.endPositionSeconds;
                // console.log("Track ends: ", endPositionSeconds);
            }
        }
        return finished;
    }

    // seekToStartingTrackIndex(index, callback=null) {
    //     const trackStats = this.activeIterators[0];
    //     const iterator = this.instructionGetIterator(trackStats.trackName, trackStats.timeDivision, trackStats.beatsPerMinute);
    //     iterator.seekToIndex(index, callback);
    //     const startPosition = iterator.getPositionInSeconds();
    //     this.seekToPosition(startPosition, callback);
    // }

    // seekToPositionTicks(positionTicks, callback=null) {
    //     while (this.positionTicks < positionTicks)
    //         this.nextTrackInstruction(callback);
    //     return this;
    // }
}
