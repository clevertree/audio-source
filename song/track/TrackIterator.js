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
            startPosition: 0,
            destination,
            trackName: startingTrackName,
            bpm: song.data.bpm,
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
     * @param callback
     */
    processTrackInstruction(instruction, trackStats, callback=null) {
        // if (instruction.getTrackName() === iterator.trackName) { // TODO track stack

        const subTrackStats = {
            // parentStats: trackStats,
            startPosition: trackStats.iterator.positionSeconds,
            destination: trackStats.destination,
            trackName: instruction.getTrackName(),
            bpm: trackStats.bpm,
            // timeDivision: trackStats.timeDivision, // Time division is not passed to sub-groups
        };
        // TODO: process track instruction parameters
        this.startTrackIteration(subTrackStats);
    }

    /**
     *
     * @param {CommandInstruction} instruction
     * @param trackStats
     * @param callback
     */
    processCommandInstruction(instruction, trackStats, callback=null) {
        const command = instruction.getCommandName().toLowerCase();
        switch(command) {
            case 'instrument':   // Set Instrument
            case 'i':
                const [instrument] = command.getParams();
                if(!instrument)
                    throw new Error("Invalid instrument");
                trackStats.instrument = instrument;
                break;

            case 'destination':     // Change destination (does not handle note processing)
            case 'd':
                const destinationProgram = instruction.loadDestinationFromParams(this.song);
                if(destinationProgram) {

                }
                // this.song.instrumentLoadInstance()
                break;
        }
    }

    processInstruction(instruction, trackStats, callback=null) {
        if(instruction instanceof CommandInstruction)
            this.processCommandInstruction(instruction, trackStats, callback);
        else if(instruction instanceof TrackInstruction)
            this.processTrackInstruction(instruction, trackStats, callback);
        callback && callback(instruction, trackStats);
        // console.log("Note Playback: ", instruction, callback);
    }


    startTrackIteration(trackStats) {
        trackStats.iterator = this.song.instructionGetIterator(trackStats.trackName, trackStats.timeDivision, trackStats.bpm);
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
