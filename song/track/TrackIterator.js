import TrackInstruction from "../instruction/TrackInstruction";

export default class TrackIterator {
    constructor(destination, song, startingTrackName = null) {
        startingTrackName = startingTrackName || song.getStartTrackName();
        if (!song.data.tracks[startingTrackName])
            throw new Error("Invalid instruction track: " + startingTrackName);

        this.song = song;
        this.positionSeconds = 0;
        // this.seekLength = 10;
        this.activeTracks = [];
        // this.currentTrackID = -1;



        const startingStats = {
            startTime: 0,
            destination,
            trackName: startingTrackName,
            bpm: song.data.bpm,
            timeDivision: song.data.timeDivision,
        };
        this.startTrackIteration(startingStats);
    }

    getPositionInSeconds() {
        let totalPositionSeconds = 0;
        for(let i=0; i<this.activeTracks.length; i++) {
            const {iterator, startTime} = this.activeTracks[i];
            const positionSeconds = startTime + iterator.positionSeconds;
            if (positionSeconds > totalPositionSeconds)
                totalPositionSeconds = positionSeconds;
        }
        return totalPositionSeconds;
    }


    getEndPositionInSeconds() {
        let totalEndPositionSeconds = 0;
        for(let i=0; i<this.activeTracks.length; i++) {
            const {iterator, startTime} = this.activeTracks[i];
            const endPositionSeconds = startTime + iterator.endPositionSeconds;
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

        const subTrackStats = {
            // parentStats: trackStats,
            startTime: trackStats.iterator.positionSeconds,
            destination: trackStats.destination,
            trackName: instruction.getTrackName(),
            bpm: trackStats.bpm,
            timeDivision: trackStats.timeDivision,
        };
        // TODO: process track instruction parameters
        this.startTrackIteration(subTrackStats);
    }

    processInstruction(instruction, trackStats, callback=null) {
        if(instruction instanceof TrackInstruction)
            this.processTrackInstruction(instruction, trackStats, callback);
        callback && callback(instruction, trackStats);
    }


    startTrackIteration(trackStats) {
        trackStats.iterator = this.song.instructionGetIterator(trackStats.trackName, trackStats.timeDivision, trackStats.bpm);
        this.activeTracks.push(trackStats);

        // this.song.dispatchEvent(new CustomEvent('track:start', {
        //     detail: {
        //         playback: this,
        //         stats,
        //         iterator
        //     }
        // }));
    }

    seekToEnd(callback=null, seekLength=1) {
        let seekPosition=0, finished = false;
        while(!finished) {
            finished = this.seekToPosition(seekPosition, callback);
            seekPosition += seekLength;
        }
        // return this;
    }

    seekToPosition(positionSeconds, callback=null) {
        let finished = true;
        for(let i=0; i<this.activeTracks.length; i++) {
            const trackStats = this.activeTracks[i];
            const iterator = trackStats.iterator;
            if(iterator.hasReachedEnd())
                continue;

            iterator.seekToPosition(positionSeconds, (instruction) => {
                this.processInstruction(instruction, trackStats, callback);
            });
            if(!iterator.hasReachedEnd())
                finished = false;
        }
        return finished;
    }

    // seekToPositionTicks(positionTicks, callback=null) {
    //     while (this.positionTicks < positionTicks)
    //         this.nextTrackInstruction(callback);
    //     return this;
    // }
}
