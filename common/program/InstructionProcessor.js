import ProgramLoader from "./ProgramLoader";

export default class InstructionProcessor {
    constructor(onLoadProgram=function(){}, onExecuteProgram=function(){}, onPlayTrack=function(){}) {
        this.onLoadProgram = onLoadProgram;
        this.onExecuteProgram = onExecuteProgram;
        this.onPlayTrack = onPlayTrack;
    }

    /**
     * @param {Instruction} instruction
     * @param {object} trackStats
     */
    processCommandInstruction(instruction, trackStats) {
        const song = this.song;
        let commandString = instruction.getCommandString();
        const params = instruction.getArgs();

        let commandName = null;
        if(commandString[0] === '!') {
            commandName = commandString.substr(1);
        } else if(commandString[0] === '@') {
            commandName = 'playTrack';
            params.unshift(commandString.substr(1));
        } else {
            commandName = 'playFrequency';
            params.unshift(commandString);
        }
        switch(commandName) {
            case 'program':      // Set Program (can be changed many times per track)
            case 'p':
                this.onLoadProgram(trackStats, params)
                break;

            case 'playTrack':
            case 't':
                this.onPlayTrack(trackStats, params)
                break;

            // case 'playFrequency':
            // case 'pf':
            //     break;

            default:
                const program = trackStats.program;
                const argTypes = program.constructor.argTypes;
                const commandAliases = program.constructor.commandAliases;
                if(commandAliases[commandString])
                    commandString = commandAliases[commandString];

                let newParams = [];
                let paramPosition = 0;
                if(argTypes) {
                    for (let i = 0; i < argTypes.length; i++) {
                        if (argTypes[i].consumesArgument) {
                            newParams[i] = argTypes[i].processArgument(params[paramPosition++], trackStats);
                        } else {
                            newParams[i] = argTypes[i].processArgument(null, trackStats);
                        }
                    }
                } else {
                    newParams = params;
                }

                // Execute command:
                this.onExecuteProgram(trackStats, commandString, newParams);


                // case 'destination':     // Append destination (does not handle note processing)
                // case 'd':
                //     // if(!trackStats.originalDestination)
                //     //     trackStats.originalDestination = trackStats.destination;
                //     trackStats.destination = instruction.loadDestinationFromParams(trackStats.destination, this.song);
                //
                //     // this.song.programLoadInstance()
                //     break;

                // default:
                return console.error("Unknown command instruction: " + commandString);
        }
    }


}

