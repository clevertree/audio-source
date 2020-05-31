import {ArgType} from "../index";

export default class InstructionProcessor {
    static trackCommand = [ArgType.trackCommand, ArgType.trackDuration, ArgType.trackOffset, ArgType.trackKey]

    constructor(instructionData, programClass=DummyProgram) {
        this.instructionData = instructionData;
        this.programClass = programClass;
    }

    processInstructionArgs() {
        const argTypes = this.programClass.argTypes;
        // let argOffset = 1;
        let prependList = null;
        let argTypeList = null;

        let commandString = this.instructionData[1];
        if(commandString[0] === '!') {
            commandString = commandString.substr(1);
            switch(commandString) {
                case 'p':
                    commandString = 'program';
                    break;
                default:
                // case '@': commandString = 'playTrack'; break;
            }
            prependList = [ArgType.command];

        } else if(commandString[0] === '@') {
            argTypeList = InstructionProcessor.trackCommand;
            commandString = 'playTrack';

        } else {
            commandString = 'playFrequency';
        }

        switch(commandString) {
            case 'playTrack':
                argTypeList = argTypeList || DummyProgram.argTypes.playTrack;
                break;
            case 'program':
                argTypeList = DummyProgram.argTypes.program; // [ArgType.program];
                break;
            default:
                const commandAliases = this.programClass.commandAliases;
                if(commandAliases[commandString])
                    commandString = commandAliases[commandString];
                argTypeList = argTypes[commandString];
                if(!argTypeList)
                    throw new Error(`Program ${this.programClass.name} does not have method: ${commandString}`);
        }


        return [commandString, prependList ? prependList.concat(argTypeList) : argTypeList];
    }





    updateArg(argType, newValue) {
        let paramPosition = this.findArgParameter(argType);
        const oldValue = this.instructionData[paramPosition];
        this.instructionData[paramPosition] = newValue;
        console.log("Arg updated: ", paramPosition, newValue, argType);
        return oldValue;
    }

    findArgParameter(argType) {
        const [commandString, argTypeList] = this.processInstructionArgs();
        let paramPosition = 1;
        for(let i=0; i<argTypeList.length; i++) {
            if(!argType.consumesArgument)
                continue;
            if(argTypeList[i] === argType)
                return paramPosition;
            paramPosition++;
        }
        throw new Error("Unable to find argType for " + commandString);
    }


    // getCommandStringFromInstruction(commandString) {
    //     if(commandString[0] === '!') {
    //         return commandString.substr(1);
    //
    //     } else if(commandString[0] === '@') {
    //         return 'playTrack';
    //
    //     } else {
    //         return 'playFrequency';
    //     }
    // }

    // isTrackCommand(commandString) {
    //     return (
    //         commandString[0] === '@'
    //         || commandString === 't'
    //         || commandString === 'playTrack')
    //
    // }

    // getTrackNameFromInstructionData(instructionData) {
    //     const commandString = instructionData[1]; // .getCommandString();
    //     if(!this.isTrackCommand(commandString))
    //         throw new Error("Invalid Track command: " + commandString);
    //     if(commandString[0] === '@')
    //         return commandString.substr(1);
    //     return instructionData[2];
    // }

}

class DummyProgram {
    /** Command Args **/
    static argTypes = {
        playFrequency: [ArgType.destination, ArgType.frequency, ArgType.startTime, ArgType.duration, ArgType.velocity],
        playTrack: [ArgType.trackName, ArgType.trackDuration, ArgType.trackOffset, ArgType.trackKey],
        program: [ArgType.command, ArgType.program]
    }


    /** Command Aliases **/
    static commandAliases = {
        pf: "playFrequency",
    }

    playFrequency(...args) {
        console.log('DummyProgram.playFrequency', ...args);
    }
}
