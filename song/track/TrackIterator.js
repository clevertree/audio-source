import InstructionIterator from "../instruction/iterator/InstructionIterator";
import InstructionProcessor from "../../common/program/InstructionProcessor";
import {ArgType} from "../../common";


export default class TrackIterator {
    constructor(song, startingTrackName, startingStats= {}, filterProgramCommand=null) {
        this.song = song;
        if (!this.song.hasTrack(startingTrackName))
            throw new Error("Invalid instruction track: " + startingTrackName);

        this.filterProgramCommand = filterProgramCommand || function() { return true; };
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

        // this.processor = new InstructionProcessor(
        //     (trackStats, params) => this.onLoadProgram(trackStats, params),
        //     (trackStats, commandString, params) => this.onExecuteProgram(trackStats, commandString, params),
        //     (trackStats, params) => this.onPlayTrack(trackStats, params),
        //     filterProgramCommand
        // )

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


    onPlayTrack(trackStats, trackName) {
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


    processCommandInstruction(instructionData, stats) {
        // let [deltaDurationTicks, commandString, ...params] = instructionData;

        const [commandString, argTypeList] = InstructionProcessor.processInstructionArgs(instructionData);

        switch(commandString) {
            case 'program':      // Set Program (can be changed many times per track)
                const program = instructionData[2];
                this.onLoadProgram(stats, program); // TODO: support OTG program
                break;

            case 'playTrack':
                // case 't':
                let trackName = instructionData[1][0] === '@'
                    ? instructionData[1].substr(1)
                    : instructionData[2];
                this.onPlayTrack(stats, trackName)
                break;

            // case 'playFrequency':
            // case 'pf':
            //     break;

            default:
                if(!this.filterProgramCommand(commandString, stats))
                    break;
                // const program = stats.program || new DummyProgram();
                // const argTypes = program.constructor.argTypes || DummyProgram.argTypes;
                // const commandAliases = program.constructor.commandAliases || DummyProgram.commandAliases;
                // if(commandAliases[commandString])
                //     commandString = commandAliases[commandString];

                // if(typeof program[commandString] !== "function")
                //     return console.error(`Program ${program.constructor.name} does not have method: ${commandString}`);


                let newArgs = [];
                let argPosition = 2;
                if(argTypeList) {
                    for (let i = 0; i < argTypeList.length; i++) {
                        const argType = argTypeList[i];
                        if (argType.consumesArgument) {
                            if(typeof instructionData[argPosition] !== "undefined") {
                                const arg = argType.processArgument(instructionData[argPosition], stats);
                                newArgs.push(arg);
                                if (argType === ArgType.duration)
                                    this.processDuration(instructionData[argPosition], newArgs[i], stats);
                                argPosition++
                            }
                        } else {
                            const arg = argType.processArgument(null, stats);
                            newArgs.push(arg);
                        }
                    }
                } else {
                    newArgs = instructionData.slice(1);
                }

                // TODO: calculate bpm changes

                // Execute command:
                this.onExecuteProgram(stats, commandString, newArgs);
                break;


            // case 'destination':     // Append destination (does not handle note processing)
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



    processArgList(argTypeList, params, stats) {
        let paramPosition = 0;

        let newParams = [];
        for (let i = 0; i < argTypeList.length; i++) {
            const argType = argTypeList[i];
            if (argType.consumesArgument) {
                if(typeof params[paramPosition] !== "undefined") {
                    const arg = argType.processArgument(params[paramPosition], stats);
                    newParams.push(arg);
                    if (argType === ArgType.duration)
                        this.processDuration(params[paramPosition], newParams[i], stats);
                    paramPosition++
                }
            } else {
                const arg = argType.processArgument(null, stats);
                newParams.push(arg);
            }
        }
        return newParams;
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
            // (instruction, stats) => this.processCommandInstruction(instruction, stats)
        )
    }


    startTrackIteration(trackStats) {
        trackStats.endPositionTicks = 0;
        trackStats.endPositionSeconds = 0;
        const iterator = this.instructionGetIterator(trackStats, this.processCommandInstructionCallback);
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
