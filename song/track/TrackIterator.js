import TrackInstruction from "../instruction/TrackInstruction";
import CommandInstruction from "../instruction/CommandInstruction";

export default class TrackIterator {
    constructor(destination, song, startingTrackName = null, onEvent=null) {
        startingTrackName = startingTrackName || song.getStartTrackName();
        if (!song.data.tracks[startingTrackName])
            throw new Error("Invalid instruction track: " + startingTrackName);

        this.onEvent = onEvent;
        this.song = song;
        this.positionSeconds = 0;
        // this.seekLength = 10;
        this.activeTracks = [];
        // this.currentTrackID = -1;



        const startingStats = {
            program: null,
            startPosition: 0,
            destination,
            trackName: startingTrackName,
            beatsPerMinute: song.data.beatsPerMinute,
            // timeDivision: song.data.timeDivision, // Time division is not passed to sub-groups
        };
        this.startTrackIteration(startingStats);
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
     *
     * @param {TrackInstruction} instruction
     * @param trackStats
     */
    processTrackInstruction(instruction, trackStats) {
        // if (instruction.getTrackName() === iterator.trackName) { // TODO track stack

        const subTrackStats = {
            program: trackStats.program,            // Current program which all notes route through
            destination: trackStats.destination,    // Current destination sent to all playFrequency calls
            // parentStats: trackStats,
            startPosition: trackStats.iterator.positionSeconds,
            trackName: instruction.getTrackName(),
            beatsPerMinute: trackStats.beatsPerMinute,
            // timeDivision: trackStats.timeDivision, // Time division is not passed to sub-groups
        };
        // TODO: process track instruction parameters
        this.startTrackIteration(subTrackStats);
    }


    processInstruction(instruction, trackStats, callback=null) {
        if(instruction instanceof CommandInstruction) // TODO: refactor out command processing for base class
            instruction.processCommandInstruction(this.song, trackStats);
        else if(instruction instanceof TrackInstruction)
            this.processTrackInstruction(instruction, trackStats);
        callback && callback(instruction, trackStats);
        // console.log("Note Playback: ", instruction, callback);
    }


    startTrackIteration(trackStats) {
        trackStats.iterator = this.song.instructionGetIterator(trackStats.trackName, trackStats.timeDivision, trackStats.beatsPerMinute);
        this.activeTracks.push(trackStats);


        this.onEvent && this.onEvent({
            type: 'track:start',
            trackIterator: this,
            trackStats
        });
        // console.log("Track Playback: ", trackStats.trackName);
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
