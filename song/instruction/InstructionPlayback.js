import TrackInstruction from "./TrackInstruction";

// Meant to be used in real-time
class InstructionPlayback {
    constructor(destination, song, trackName, startTime = null, onended = null) {
        if (!destination || !destination.context)
            throw new Error("Invalid destination");
        if(startTime === null)
            startTime =  destination.context.currentTime;

        this.audioContext = destination.context;
        this.song = song;
        this.onended = onended;
        // this.trackName = trackName;
        // this.seekLength = seekLength;
        this.subTracks = [];
        this.seekLength = 10;
        const startingStats = {
            startTime,
            destination,
            trackName,
            bpm: song.data.bpm,
            timeDivision: song.data.timeDivision,
        };
        this.startTrackPlayback(startingStats);
        setInterval(() => this.renderPlayback(), this.seekLength);
        this.renderPlayback();

    }

    startTrackPlayback(stats) {
        const iterator = this.song.instructionGetIterator(stats.trackName, stats.bpm, stats.timeDivision);
        this.subTracks.push([
            stats,
            iterator
        ]);
        console.log('track:start', stats.trackName);
        this.song.dispatchEvent(new CustomEvent('track:start', {
            detail: {
                playback: this,
                stats,
                iterator
            }
        }));
    }

    endTrackPlayback(trackID) {
        const [stats, iterator] = this.subTracks[trackID];
        this.subTracks.splice(trackID, 1);
        const trackEndDelaySeconds = (iterator.endPositionSeconds + stats.startTime) - this.audioContext.currentTime;
        setTimeout(() => {
            console.log('track:end', stats.trackName, iterator.endPositionSeconds);
            this.song.dispatchEvent(new CustomEvent('track:end', {
                detail: {
                    playback: this,
                    stats,
                    iterator
                }
            }));
            if(this.subTracks.length === 0) {
                this.onended();
            }
        }, trackEndDelaySeconds)
    }

    async awaitPlaybackReachedEnd() {
        await new Promise((resolve, reject) => {
            const oldCallback = this.onended;
            this.onended = () => {
                resolve();
                oldCallback && oldCallback();
            };
        })
    }

    async wait(waitTimeInSeconds) {
//             console.info("Waiting... ", waitTimeInSeconds);
        return await new Promise((resolve, reject) => {
            setTimeout(() => resolve(true), waitTimeInSeconds * 1000);
        });
    }

    renderPlayback() {
        const audioContext = this.audioContext;
        for(let i=0; i<this.subTracks.length; i++) {
            const [stats, iterator] = this.subTracks[i];
            const currentPositionSeconds = audioContext.currentTime - stats.startTime;

            while(true) {
                if (iterator.positionSeconds > currentPositionSeconds + this.seekLength)
                    break;


                if (iterator.hasReachedEnd()) {
                    this.endTrackPlayback(i);
                    i--;
                    break;
                }

                const instruction = iterator.nextInstruction();
                const noteStartTime = stats.startTime + iterator.positionSeconds; // Track start time equals current track's start + playback times
                if (instruction instanceof TrackInstruction) {
                    if (instruction.getTrackName() === iterator.trackName) { // TODO track stack
                        console.error(`Recursive track call. Skipping track '${instruction.getTrackName()}'`);
                        continue;
                    }

                    const subStats = Object.assign({}, stats, {
                        startTime: noteStartTime,
                        trackName: instruction.getTrackName()
                    });
                    this.startTrackPlayback(subStats);

                } else {
                    // TODO: get instruction ID
                    this.song.playInstruction(stats.destination, instruction, 0, noteStartTime, iterator.trackName);
                }
            }
        }
    }
}

export default InstructionPlayback;
