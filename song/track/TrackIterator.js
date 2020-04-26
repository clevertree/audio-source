import TrackInstruction from "../instruction/TrackInstruction";
import CommandInstruction from "../instruction/CommandInstruction";
import {InstructionIterator} from "../instruction";


export default class TrackIterator {
    constructor(tracks, startingTrackName, startingBeatsPerMinute, startingTimeDivision) {
        this.tracks = tracks;
        if (!this.tracks[startingTrackName])
            throw new Error("Invalid instruction track: " + startingTrackName);

        // this.onEvent = onEvent;
        this.positionSeconds = 0;
        // this.seekLength = 10;
        this.activeTracks = [];
        // this.currentTrackID = -1;

        this.startingBeatsPerMinute = startingBeatsPerMinute;
        this.startingTimeDivision = startingTimeDivision;

        const startingStats = {
            // program: trackStats.program,            // Current program which all notes route through
            // destination: trackStats.destination,    // Current destination sent to all playFrequency calls
            startPosition: 0,
            trackName: startingTrackName,
            // beatsPerMinute: beatsPerMinute,
            // startingTimeDivision: song.data.startingTimeDivision, // Time division is not passed to sub-groups
        };
        this.startTrackIteration(startingStats);
    }

    instructionGetIterator(trackName, timeDivision=null, beatsPerMinute=null) {
        if(!this.tracks[trackName])
            throw new Error("Invalid instruction track: " + trackName);
        const instructionList = this.tracks[trackName];

        return new InstructionIterator(
            instructionList,
            timeDivision || this.startingTimeDivision,
            beatsPerMinute || this.startingBeatsPerMinute,
        );
    }


    startTrackIteration(trackStats) {
        trackStats.iterator = this.instructionGetIterator(trackStats.trackName, trackStats.timeDivision, trackStats.beatsPerMinute);
        this.activeTracks.push(trackStats);
    }


    getPositionInSeconds() {
        let totalPositionSeconds = 0;
        for(let i=0; i<this.activeTracks.length; i++) {
            const {iterator, startPosition} = this.activeTracks[i];
            const positionSeconds = startPosition + iterator.positionSeconds;
            if (positionSeconds > totalPositionSeconds)
                totalPositionSeconds = positionSeconds;
        }
        return totalPositionSeconds;
    }

    getEndPositionInSeconds() {
        let totalEndPositionSeconds = 0;
        for(let i=0; i<this.activeTracks.length; i++) {
            const {iterator, startPosition} = this.activeTracks[i];
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
        for(let i=0; i<this.activeTracks.length; i++) {
            const {iterator} = this.activeTracks[i];
            if(iterator.hasReachedEnd())
                return true;
        }
        return false;
    }


    /**
     * @param {TrackInstruction} instruction
     * @param trackStats
     */
    processTrackInstruction(instruction, trackStats) {
        // if (instruction.getTrackName() === iterator.trackName) { // TODO track stack

        const subTrackStats = {
            // program: trackStats.program,            // Current program which all notes route through
            // destination: trackStats.destination,    // Current destination sent to all playFrequency calls
            // parentStats: trackStats,
            startPosition: trackStats.iterator.positionSeconds,
            trackName: instruction.getTrackName(),
            beatsPerMinute: trackStats.beatsPerMinute,
            // timeDivision: trackStats.timeDivision, // Time division is not passed to sub-groups
        };
        if(typeof trackStats.program !== "undefined" && trackStats.program)
            subTrackStats.program = trackStats.program;
        if(typeof trackStats.destination !== "undefined" && trackStats.destination)
            subTrackStats.destination = trackStats.destination;
        // TODO: process track instruction parameters
        this.startTrackIteration(subTrackStats);
    }

    /**
     * @param {CommandInstruction} instruction
     * @param trackStats
     */
    processCommandInstruction(instruction, trackStats) {

    }

    processInstruction(instruction, trackStats, callback=null) {
        if(instruction instanceof CommandInstruction)
            this.processCommandInstruction(instruction, trackStats);
        else if(instruction instanceof TrackInstruction)
            this.processTrackInstruction(instruction, trackStats);
        callback && callback(instruction, trackStats);
        // console.log("Note Playback: ", instruction, callback);
    }

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
        for(let i=0; i<this.activeTracks.length; i++) {
            const trackStats = this.activeTracks[i];
            const iterator = trackStats.iterator;
            if(!iterator.hasReachedEnd()) {
                iterator.seekToPosition(positionSeconds, (instruction) => {
                    this.processInstruction(instruction, trackStats, callback);
                });
                if (!iterator.hasReachedEnd())
                    finished = false;
            }
        }
        return finished;
    }

    // seekToPositionTicks(positionTicks, callback=null) {
    //     while (this.positionTicks < positionTicks)
    //         this.nextTrackInstruction(callback);
    //     return this;
    // }
}
