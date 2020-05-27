import {ArgType} from "../index";

export default class InstructionProcessor {


    constructor(onLoadProgram=null, onExecuteProgram=null, onPlayTrack=null, filterProgramCommand=null) {
        this.onLoadProgram = onLoadProgram || function(){};
        this.onExecuteProgram = onExecuteProgram || function(){};
        this.onPlayTrack = onPlayTrack || function(){};
        this.filterProgramCommand = filterProgramCommand || function(){ return true; };
    }


    /**
     * @param {Instruction} instruction
     * @param {object} stats
     */
    processCommandInstruction(instruction, stats) {
        // const song = this.song;
        let commandString = instruction.getCommandString();
        const params = instruction.getArgs();

        commandString = InstructionProcessor.getCommandStringFromInstruction(commandString, params);

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

    /** Static **/

    static getCommandStringFromInstruction(commandString, params) {
        if(commandString[0] === '!') {
            commandString = commandString.substr(1);
            switch(commandString) {
                case 'p':
                    commandString = 'program';
                    break;
                default: break;
            }

        } else if(commandString[0] === '@') {
            params.unshift(commandString.substr(1));
            commandString = 'playTrack';

        } else {
            params.unshift(commandString);
            commandString = 'playFrequency';
        }
        return commandString;
    }

    static isTrackCommand(commandString) {
        return (
            commandString[0] === '@'
            || commandString === 't'
            || commandString === 'playTrack')

    }

    static getTrackNameFromInstruction(instruction) {
        const commandString = instruction.getCommandString();
        if(!this.isTrackCommand(commandString))
            throw new Error("Invalid Track command: " + commandString);
        if(commandString[0] === '@')
            return commandString.substr(1);
        return instruction.getArgs()[0];
    }

}

class DummyProgram {
    /** Command Args **/
    static argTypes = {
        playFrequency: [ArgType.destination, ArgType.frequency, ArgType.startTime, ArgType.duration, ArgType.velocity],
    };

    /** Command Aliases **/
    static commandAliases = {
        pf: "playFrequency",
    }

    playFrequency(...args) {
        console.log('DummyProgram.playFrequency', ...args);
    }
}
