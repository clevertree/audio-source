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


    loadDestinationFromParams(oldDestination, song) {
        const params = this.getParams();
        let program;
        if(typeof params[0] === "string") {
            program = ProgramLoader.loadInstance(params[0], params[1]);
        } else {
            program = song.programLoadInstanceFromID(params[0]);
        }

        if(typeof program.getDestination !== 'function')
            throw new Error("Program " + program.constructor.name + " has no function 'getDestination'");

        const destination = program.getDestination(oldDestination);
        return destination;
    }


    clone() {
        return new CommandInstruction(this.data.slice());
    }
}

export default CommandInstruction;
