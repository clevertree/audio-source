import {ArgType} from "../index";

export default class InstructionProcessor {


    constructor(onLoadProgram=null, onExecuteProgram=null, onPlayTrack=null, filterProgramCommand=null) {
        this.onLoadProgram = onLoadProgram || function(){};
        this.onExecuteProgram = onExecuteProgram || function(){};
        this.onPlayTrack = onPlayTrack || function(){};
        this.filterProgramCommand = filterProgramCommand || function(){ return true; };
    }


    /**
     * @param {[]} instructionData
     * @param {object} stats
     * @deprecated
     */
    processCommandInstruction(instructionData, stats) {
        // const song = this.song;
        let [deltaDurationTicks, commandString, ...params] = instructionData;

        commandString = InstructionProcessor.getCommandStringFromInstruction(commandString);

        switch(commandString) {
            case 'program':      // Set Program (can be changed many times per track)
                this.onLoadProgram(stats, params)
                break;

            case 'playTrack':
            // case 't':
                this.onPlayTrack(stats, params)
                break;

            // case 'playFrequency':
            // case 'pf':
            //     break;

            default:
                if(!this.filterProgramCommand(commandString, stats))
                    break;
                const program = stats.program || new DummyProgram();
                const argTypes = program.constructor.argTypes || DummyProgram.argTypes;
                const commandAliases = program.constructor.commandAliases || DummyProgram.commandAliases;
                if(commandAliases[commandString])
                    commandString = commandAliases[commandString];

                if(typeof program[commandString] !== "function")
                    return console.error(`Program ${program.constructor.name} does not have method: ${commandString}`);


                let newParams = params;
                const argTypeList = argTypes[commandString];
                if(argTypeList) {
                    newParams = this.processArgList(argTypeList, params, stats);
                }

                // TODO: calculate bpm changes

                // Execute command:
                this.onExecuteProgram(stats, commandString, newParams);
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

    /** Static **/

    static processArgList(argTypeList, params, stats) {
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

    static processDuration(durationTicks, durationSeconds, stats) {
        const trackEndPositionInTicks = stats.positionTicks + durationTicks;
        if (trackEndPositionInTicks > stats.endPositionTicks)
            stats.endPositionTicks = trackEndPositionInTicks;
        const trackPlaybackEndTime = stats.positionSeconds + durationSeconds;
        if (trackPlaybackEndTime > stats.endPositionSeconds)
            stats.endPositionSeconds = trackPlaybackEndTime;
    }



    static processInstructionArgs(instructionData, programClass=DummyProgram) {
        const argTypes = programClass.argTypes;
        const commandAliases = programClass.commandAliases;
        // let argOffset = 1;
        let prependList = [];

        let commandString = instructionData[1];
        if(commandString[0] === '!') {
            commandString = commandString.substr(1);
            switch(commandString) {
                case 'playTrack':
                    return [commandString, [ArgType.command, ArgType.trackName]];
                case 'p':
                case 'program':
                    return [commandString, [ArgType.command, ArgType.program]];
            }
            prependList.push(ArgType.command);

        } else if(commandString[0] === '@') {
            return ['playTrack', [ArgType.trackName]];

        } else {
            commandString = 'playFrequency';
        }
        if(commandAliases[commandString])
            commandString = commandAliases[commandString];

        const argTypeList = argTypes[commandString];
        if(!argTypeList)
            throw new Error(`Program ${programClass.name} does not have method: ${commandString}`);

        return [commandString, prependList.concat(argTypeList)];
    }

    static getCommandStringFromInstruction(commandString) {
        if(commandString[0] === '!') {
            return commandString.substr(1);

        } else if(commandString[0] === '@') {
            return 'playTrack';

        } else {
            return 'playFrequency';
        }
    }

    static isTrackCommand(commandString) {
        return (
            commandString[0] === '@'
            || commandString === 't'
            || commandString === 'playTrack')

    }

    static getTrackNameFromInstructionData(instructionData) {
        const commandString = instructionData[1]; // .getCommandString();
        if(!this.isTrackCommand(commandString))
            throw new Error("Invalid Track command: " + commandString);
        if(commandString[0] === '@')
            return commandString.substr(1);
        return instructionData[2];
    }

}

class DummyProgram {
    /** Command Args **/
    static argTypes = {
        playFrequency: [ArgType.destination, ArgType.frequency, ArgType.startTime, ArgType.duration, ArgType.velocity],
        playTrack: [ArgType.trackName, ArgType.duration],
    };

    /** Command Aliases **/
    static commandAliases = {
        pf: "playFrequency",
    }

    playFrequency(...args) {
        console.log('DummyProgram.playFrequency', ...args);
    }
}
