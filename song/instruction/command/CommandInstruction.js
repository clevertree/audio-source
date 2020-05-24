import Instruction from "../Instruction";
import CommandProcessor from "./CommandProcessor";

export default class CommandInstruction extends Instruction {

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
     * @param {Song} song
     * @param trackStats
     */
    processCommandInstruction(song, trackStats) {
        CommandProcessor.processCommandInstruction(song, this, trackStats)
    }


    clone() {
        return new CommandInstruction(this.data.slice());
    }
}

