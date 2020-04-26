import Instruction from "./Instruction";
import ProgramLoader from "../program/ProgramLoader";

class CommandInstruction extends Instruction {

    getCommandName() {
        return typeof this.data[1] === "string" ? this.data[1].substr(1) : undefined;
    }

    setCommandName(newCommandName) {
        this.data[1] = `!${newCommandName}`;
    }

    getParams() {
        return this.data.slice(2);
    }

    get durationTicks() {
        return undefined;
    }

    get velocity() {
        return undefined;
    }


    /**
     * @param {CommandInstruction} song
     * @param trackStats
     */
    processCommandInstruction(song, trackStats) {
        const command = this.getCommandName().toLowerCase();
        switch(command) {
            case 'program':      // Set Program (can be changed many times per track)
            case 'p':
                let programInstance = this.loadProgramFromParams(trackStats.program, song);
                trackStats.program = programInstance;

                // getDestination allows for audio processing (i.e. effects)
                if(typeof programInstance.getDestination !== 'function') {
                    trackStats.destination = programInstance.getDestination(trackStats.destination);
                }
                break;

            // case 'destination':     // Append destination (does not handle note processing)
            // case 'd':
            //     // if(!trackStats.originalDestination)
            //     //     trackStats.originalDestination = trackStats.destination;
            //     trackStats.destination = instruction.loadDestinationFromParams(trackStats.destination, this.song);
            //
            //     // this.song.programLoadInstance()
            //     break;

            default:
                return console.error("Unknown command instruction: " + command);
        }
    }


    loadProgramFromParams(song) {
        const params = this.getParams();
        let program;
        if(typeof params[0] === "string") {
            program = ProgramLoader.loadInstance(params[0], params[1]);
        } else {
            program = song.programLoadInstanceFromID(params[0]);
        }
        return program;
    }


    clone() {
        return new CommandInstruction(this.data.slice());
    }
}

export default CommandInstruction;
