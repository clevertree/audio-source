import {SongValues} from "../values";

class Instruction {
    constructor(instructionData = [0], index=null) {
        /** @deprecated **/
        this.index = index;
        this.data = instructionData;
    }

    get command() {
        return this.data[1];
    }

    set command(newCommand) {
        this.data[1] = newCommand;
    }


    get deltaDurationTicks() {
        return this.data[0];
    }

    set deltaDurationTicks(newDeltaDuration) {
        this.data[0] = newDeltaDuration;
    }

    getDurationString(timeDivision) {
        const durationTicks = this.durationTicks;
        if(durationTicks === null)
            return 'N/A';
        return SongValues.formatDuration(durationTicks, timeDivision);
    }
    set durationTicks(newDuration)  { throw new Error("TODO: Implement for " + this.constructor.name);}
    get durationTicks()             { throw new Error("TODO: Implement for " + this.constructor.name);}
    get clone()          { throw new Error("TODO: Implement for " + this.constructor.name);}

    /** @deprecated **/
    set velocity(velocity)  { throw new Error("TODO: Implement for " + this.constructor.name);}
    /** @deprecated **/
    get velocity()          { throw new Error("TODO: Implement for " + this.constructor.name);}
}


export default Instruction;



