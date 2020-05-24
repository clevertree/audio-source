import ProgramLoader from "../../../common/program/ProgramLoader";

export default class CommandProcessor {

    /**
     * @param {Song} song
     * @param {CommandInstruction} commandInstruction
     * @param {object} trackStats
     */
    static processCommandInstruction(song, commandInstruction, trackStats) {
        let commandName = commandInstruction.getCommandName().toLowerCase();
        const params = commandInstruction.getParams();
        switch(commandName) {
            case 'program':      // Set Program (can be changed many times per track)
            case 'p':
                const oldProgram = trackStats.program;
                const oldDestination = trackStats.destination;
                let programInstance;
                if(typeof params[0] === "string") {
                    programInstance = ProgramLoader.loadInstance(params[0], params[1]);
                } else {
                    programInstance = song.programLoadInstanceFromID(params[0]);
                }
                trackStats.program = programInstance;

                // useDestination allows for audio processing (i.e. effects)
                if(typeof programInstance.useDestination === 'function')
                    trackStats.destination = programInstance.useDestination(oldDestination);

                // useProgram allows for both note processing and audio processing effects
                if(typeof programInstance.useProgram === 'function')
                    programInstance.useProgram(oldProgram);

                break;

            default:
                const program = trackStats.program;
                const argTypes = program.constructor.argTypes;
                const commandAliases = program.constructor.commandAliases;
                if(commandAliases[commandName])
                    commandName = commandAliases[commandName];

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
                program[commandName].apply(program, newParams);



            // case 'destination':     // Append destination (does not handle note processing)
            // case 'd':
            //     // if(!trackStats.originalDestination)
            //     //     trackStats.originalDestination = trackStats.destination;
            //     trackStats.destination = instruction.loadDestinationFromParams(trackStats.destination, this.song);
            //
            //     // this.song.programLoadInstance()
            //     break;

            // default:
                return console.error("Unknown command instruction: " + commandName);
        }
    }


    static loadProgramFromParams(song, command) {
        const params = command.getParams();
        let program;
        if(typeof params[0] === "string") {
            program = ProgramLoader.loadInstance(params[0], params[1]);
        } else {
            program = song.programLoadInstanceFromID(params[0]);
        }
        return program;
    }
}

