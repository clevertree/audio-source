import InstructionIterator from "../instruction/iterator/InstructionIterator";
import InstructionProcessor from "../../common/program/InstructionProcessor";
import {ArgType, Values} from "../../common";


export default class TrackIterator {
    constructor(song, startingTrackName, startingStats= {}, filterProgramCommand=null) {
        this.song = song;
        if (!this.song.hasTrack(startingTrackName))
            throw new Error("Invalid instruction track: " + startingTrackName);

        this.filterProgramCommand = filterProgramCommand || function() { return true; };
        this.activeIterators = [];

        // program: trackStats.program,            // Current program which all notes route through
        // destination: trackStats.destination,    // Current destination sent to all playFrequency calls

        startingStats.startTime = 0;
        startingStats.startPosition = 0;            // Necessary for position calculations
        startingStats.trackName = startingTrackName;
        if(!startingStats.beatsPerMinute)
            startingStats.beatsPerMinute = song.data.beatsPerMinute;
        if(!startingStats.timeDivision)
            startingStats.timeDivision = song.data.timeDivision; // Time division is passed to sub-groups

        this.processCommandInstructionCallback = (instructionData, stats) => this.processCommandInstruction(instructionData, stats);

        // Start Track iteration
        this.startTrackIteration(startingStats);
    }

    onLoadProgram(trackStats, program) {
        trackStats.program = null; // TODO: use dummy program here?
    }

    onExecuteProgram(trackStats, commandString, params) {
        // console.log("onExecuteProgram", trackStats.trackName, commandString, params);
    }

    /** Actions **/

    startTrackIteration(trackStats) {
        trackStats.endPositionTicks = 0;
        trackStats.endPositionSeconds = 0;
        const iterator = this.instructionGetIterator(trackStats, this.processCommandInstructionCallback);
        this.activeIterators.push(iterator);
        return trackStats;
    }


    processCommandInstruction(instructionData, stats) {
        const processor = new InstructionProcessor(instructionData);
        const [commandString, argTypeList] = processor.processInstructionArgs();

        switch(commandString) {
            case 'program':      // Set Program (can be changed many times per track)
                const program = instructionData[2];
                this.onLoadProgram(stats, program); // TODO: support OTG program
                break;

            case 'playTrack':
                if(!this.filterProgramCommand(commandString, stats))
                    break;
                // case 't':

                if(instructionData[1][0] === '@') {
                } else {
                    instructionData = instructionData.slice().splice(1, 1);
                }
                let trackArgs = this.processArgList(stats, instructionData, InstructionProcessor.trackCommand);

                this.onPlayTrack(stats, ...trackArgs)
                break;

            default:
                if(!this.filterProgramCommand(commandString, stats))
                    break;

                let programArgs;
                if(argTypeList) {
                    programArgs = this.processArgList(stats, instructionData, argTypeList);
                } else {
                    programArgs = instructionData.slice(1);
                }

                // TODO: calculate bpm changes

                // Execute command:
                this.onExecuteProgram(stats, commandString, programArgs);
                break;


            // case 'destination':     // TODO: Append destination? (does not handle note processing)
            // case 'd':
            //     // if(!trackStats.originalDestination)
            //     //     trackStats.originalDestination = trackStats.destination;
            //     trackStats.destination = instruction.loadDestinationFromParams(trackStats.destination, this.song);
            //
            //     // this.song.programLoadInstance()
            //     break;

            // default:
        }

    }

    onPlayTrack(parentStats, trackName, trackDuration=null, trackStartTime=0, trackFrequency=null) {
        if(parentStats.trackName === trackName) {
            console.warn("Skipping recursive track name: " + trackName);
            return;
        }
        const subTrackStats = {
            // program: trackStats.program,            // Current program which all notes route through
            // destination: trackStats.destination,    // Current destination sent to all playFrequency calls
            // parentStats: trackStats,
            startTime: parentStats.startTime + parentStats.positionSeconds,
            startPosition: trackStartTime, // trackStats.positionSeconds,
            trackName,
            beatsPerMinute: parentStats.beatsPerMinute,
            timeDivision: parentStats.timeDivision, // Time division is passed to sub-groups
        };
        if(trackFrequency !== null)
            subTrackStats.transpose = Values.FREQ_A4 / trackFrequency;
        if(trackDuration !== null)
            subTrackStats.duration = trackDuration;
        if(parentStats.program)
            subTrackStats.program = parentStats.program;
        if(parentStats.destination)
            subTrackStats.destination = parentStats.destination;

        // console.log("onPlayTrack", trackName, trackDuration, trackStartTime, trackFrequency, subTrackStats);
        // TODO: process track instruction parameters
        this.startTrackIteration(subTrackStats);
        return subTrackStats;
    }


    processArgList(stats, instructionData, argTypeList) {
        let newArgs = [];
        let argIndex = 1;
        for (let i = 0; i < argTypeList.length; i++) {
            const argType = argTypeList[i];
            if (argType.consumesArgument) {
                if(typeof instructionData[argIndex] !== "undefined") {
                    const arg = argType.process(instructionData[argIndex], stats);
                    newArgs.push(arg);
                    if (argType === ArgType.duration)
                        this.processDuration(instructionData[argIndex], newArgs[i], stats);
                    argIndex++
                }
            } else {
                const arg = argType.process(null, stats);
                newArgs.push(arg);
            }
        }
        return newArgs;
    }


    processDuration(durationTicks, durationSeconds, stats) {
        const trackEndPositionInTicks = stats.positionTicks + durationTicks;
        if (trackEndPositionInTicks > stats.endPositionTicks)
            stats.endPositionTicks = trackEndPositionInTicks;
        const trackPlaybackEndTime = stats.positionSeconds + durationSeconds;
        if (trackPlaybackEndTime > stats.endPositionSeconds)
            stats.endPositionSeconds = trackPlaybackEndTime;
    }


    instructionGetIterator(trackStats, instructionCallback=null) {
        if(!trackStats.trackName)
            throw new Error("Invalid trackStats.trackName");
        return InstructionIterator.getIteratorFromSong(
            this.song,
            trackStats.trackName,
            trackStats,
            instructionCallback
        )
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

    seekToPosition(positionSeconds) {
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
                const endPositionSeconds = stats.startPosition + stats.endPositionSeconds;
                console.log("Track ends: ", i, stats.trackName, "in", endPositionSeconds);
            }
        }
        return finished;
    }

}
