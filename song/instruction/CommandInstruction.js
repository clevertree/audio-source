import Instruction from "./Instruction";
import {SongValues} from "../values";

class CommandInstruction extends Instruction {

    getDurationString(timeDivision) {
        const durationTicks = this.durationTicks;
        if(durationTicks === null)
            return 'N/A';
        return SongValues.formatDuration(durationTicks, timeDivision);
    }

    get durationTicks() {
        return typeof this.data[2] !== "undefined" ? this.data[2] : undefined;
    }

    set durationTicks(newDuration) {
        newDuration = parseFloat(newDuration);
        if (Number.isNaN(newDuration))
            throw new Error("Invalid Duration");
        this.data[2] = newDuration;
    }

    get velocity() {
        return typeof this.data[3] !== "undefined" ? this.data[3] : undefined;
    }

    set velocity(newVelocity) {
        newVelocity = parseFloat(newVelocity);
        if (Number.isNaN(newVelocity))
            throw new Error("Invalid Velocity");
        this.data[3] = newVelocity;
    }


    clone() {
        return new CommandInstruction(this.data.slice());
    }
}

export default CommandInstruction;
