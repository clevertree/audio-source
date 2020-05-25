import TrackInstruction from "../instruction/track/TrackInstruction";
import CommandInstruction from "../instruction/command/CommandInstruction";
import {InstructionIterator} from "../instruction";
import InstructionProcessor from "../../common/program/InstructionProcessor";
import ProgramLoader from "../../common/program/ProgramLoader";


export default class TrackIterator {
    constructor(tracks, startingTrackName, startingBeatsPerMinute, startingTimeDivision, onEvent=null) {
        this.tracks = tracks;
        if (!this.tracks[startingTrackName])
            throw new Error("Invalid instruction track: " + startingTrackName);

        this.onEvent = onEvent || function() {};

        // this.onEvent = onEvent;
        // this.positionSeconds = 0;
        // this.seekLength = 10;
        this.activeIterators = [];
        // this.currentTrackID = -1;

        const startingStats = {
            // program: trackStats.program,            // Current program which all notes route through
            // destination: trackStats.destination,    // Current destination sent to all playFrequency calls
            startPosition: 0,
            trackName: startingTrackName,
            endPositionTicks: 0,
            endPositionSeconds: 0,
            beatsPerMinute: startingBeatsPerMinute,
            startingTimeDivision: startingTimeDivision, // Time division is passed to sub-groups
        };
        this.startTrackIteration(startingStats);
        this.processInstructionCallback = (instruction, stats) =>
            this.processor.processCommandInstruction(instruction, stats);
        this.processor = new InstructionProcessor(
            (trackStats, params) => this.onLoadProgram(trackStats, params),
            (trackStats, commandString, params) => this.onExecuteProgram(trackStats, commandString, params),
            (trackStats, params) => this.onPlayTrack(trackStats, params),
        )
    }

    onLoadProgram(trackStats, params) {
        trackStats.program = null; // TODO: use dummy program here?
    }

    onExecuteProgram(trackStats, commandString, params) {
        console.log("onExecuteProgram", trackStats.trackName, commandString, params);
    }


    onPlayTrack(trackStats, params) {
        const trackName = params[0];
        console.log("onPlayTrack", trackStats.trackName, params);
        const subTrackStats = {
            // program: trackStats.program,            // Current program which all notes route through
            // destination: trackStats.destination,    // Current destination sent to all playFrequency calls
            // parentStats: trackStats,
            startPosition: trackStats.positionSeconds,
            trackName,
            beatsPerMinute: trackStats.beatsPerMinute,
            timeDivision: trackStats.timeDivision, // Time division is passed to sub-groups
        };
        if(typeof trackStats.program !== "undefined" && trackStats.program)
            subTrackStats.program = trackStats.program;
        if(typeof trackStats.destination !== "undefined" && trackStats.destination)
            subTrackStats.destination = trackStats.destination;
        // TODO: process track instruction parameters
        this.startTrackIteration(subTrackStats);
    }


    instructionGetIterator(trackStats) {
        const trackName = trackStats.trackName;
        if(!this.tracks[trackName])
            throw new Error("Invalid instruction track: " + trackName);
        const instructionList = this.tracks[trackName];

        return new InstructionIterator(
            instructionList,
            trackStats,
            this.processInstructionCallback
        );
    }


    startTrackIteration(trackStats) {
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

    /** @deprecated **/
    getEndPositionInSeconds() {
        let totalEndPositionSeconds = 0;
        for(let i=0; i<this.activeIterators.length; i++) {
            const {iterator, startPosition} = this.activeIterators[i];
            const endPositionSeconds = startPosition + iterator.endPositionSeconds;
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
            const {iterator} = this.activeIterators[i];
            if(!iterator.hasReachedEnd())
                return false;
        }
        return true;
    }


    /**
     * @param {CommandInstruction} instruction
     * @param trackStats
     */
    processCommandInstruction(instruction, trackStats) {

    }

    // processInstruction(instruction, trackStats, callback=null) {
    //     if(instruction instanceof CommandInstruction)
    //         this.processCommandInstruction(instruction, trackStats);
    //     else if(instruction instanceof TrackInstruction)
    //         this.processTrackInstruction(instruction, trackStats);
    //     callback && callback(instruction, trackStats);
    //     // console.log("Note Playback: ", instruction, callback);
    // }


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
            const trackStats = this.activeIterators[i];
            const {iterator, startPosition} = trackStats;
            positionSeconds -= startPosition;
            if(!iterator.hasReachedEnd()) {
                iterator.seekToPosition(positionSeconds);
                if (!iterator.hasReachedEnd())
                    finished = false;
            }
        }
        return finished;
    }

    seekToStartingTrackIndex(index, callback=null) {
        const trackStats = this.activeIterators[0];
        const iterator = this.instructionGetIterator(trackStats.trackName, trackStats.timeDivision, trackStats.beatsPerMinute);
        iterator.seekToIndex(index, callback);
        const startPosition = iterator.positionSeconds;
        this.seekToPosition(startPosition, callback);
    }

    // seekToPositionTicks(positionTicks, callback=null) {
    //     while (this.positionTicks < positionTicks)
    //         this.nextTrackInstruction(callback);
    //     return this;
    // }
}
