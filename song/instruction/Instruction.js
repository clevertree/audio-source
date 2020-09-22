import ArgType from "./argument/ArgType";

class Instruction {
    static trackCommand = [ArgType.trackName, ArgType.duration, ArgType.offset, ArgType.frequency, ArgType.velocity]

    constructor(instructionData, programClass=DummyProgram) {
        this.instructionData = instructionData;
        this.programClass = programClass;
    }

    processInstructionArgList() {
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
            argTypeList = Instruction.trackCommand;
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

    // validateInstructionArgs() {
    //     const [commandString, argTypeList] = this.processInstructionArgList();
    //     for(let i=0; i<argTypeList.length; i++) {
    //         if(!argTypeList[i].consumesArgument)
    //             continue;
    //         const argType = argTypeList[i];
    //
    // }

    isTrackCommand() {
        const [commandString, argTypeList] = this.processInstructionArgList();
        if(commandString !== 'playTrack')
            return false;
        let argIndex = this.findArgParameterIndex(ArgType.trackName, argTypeList);
        let trackName = this.instructionData[argIndex];
        if(trackName[0] === '@')
            trackName = trackName.substr(1);
        return trackName;
    }



    updateArg(argType, newArgValue) {
        // eslint-disable-next-line no-unused-vars
        const [commandString, argTypeList] = this.processInstructionArgList();
        let argIndex = this.findArgParameterIndex(argType, argTypeList);
        const oldValue = this.instructionData[argIndex];
        this.instructionData[argIndex] = newArgValue;
        // console.log("Arg updated: ", argIndex, newArgValue, argType);
        return oldValue;
    }

    findArgParameterIndex(argType, argTypeList) {
        let argIndex = 0;
        for(let i=0; i<argTypeList.length; i++) {
            if(!argTypeList[i].consumesArgument)
                continue;
            argIndex++;
            if(argTypeList[i] === argType)
                return argIndex;
        }
        throw new Error("Unable to find argType for " + argType.title);
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



    /** Static **/

    static processInstructionTracks(trackList) {
        Object.keys(trackList).forEach((trackName, i) =>
            this.processInstructionTrack(trackList[trackName]));
    }
    static processInstructionTrack(instructionList) {
        if(!Array.isArray(instructionList))
            throw new Error("Invalid ASCTrack instruction array");
        for(let i=0; i<instructionList.length; i++) {
            instructionList[i] = this.parseInstructionData(instructionList[i]);
        }
    }

    static parseInstructionData(instructionData) {
        // if (instructionData instanceof Instruction)
        //     instructionData = instructionData.data.slice();
        if(typeof instructionData === "number")
            instructionData = [instructionData];
        if(typeof instructionData === "string")
            instructionData = [0, instructionData];
        if(!Array.isArray(instructionData))
            throw new Error("Invalid instruction data");
        if(typeof instructionData[0] === "string")
            instructionData.unshift(0);
        // const processor = new InstructionProcessor(instructionData);
        // processor.updateArg(argType, newArgValue)
        return instructionData;
    }


    // static isTrackInstruction(instructionData) {
    //     return typeof instructionData[1] === "string" && instructionData[1][0] === '@';
    // }
    //
    // static isMIDIInstruction(instructionData) {
    //     return typeof instructionData[1] === "number";
    // }


}


export default Instruction;



class DummyProgram {
    /** Command Args **/
    static argTypes = {
        playFrequency: [ArgType.destination, ArgType.frequency, ArgType.startTime, ArgType.duration, ArgType.velocity, ArgType.onended],
        playTrack: [ArgType.trackName, ArgType.duration, ArgType.offset, ArgType.frequency, ArgType.velocity],
        program: [ArgType.program]
    }


    /** Command Aliases **/
    static commandAliases = {
        pf: "playFrequency",
    }

    playFrequency(...args) {
        console.log('DummyProgram.playFrequency', ...args);
    }
}

