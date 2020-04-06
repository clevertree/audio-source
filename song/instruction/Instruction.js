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

    set velocity(velocity)  { console.error("TODO: Implement for " + this.constructor.name);}
    get velocity()          { console.error("TODO: Implement for " + this.constructor.name);}
    set durationTicks(velocity)  { console.error("TODO: Implement for " + this.constructor.name);}
    get durationTicks()          { console.error("TODO: Implement for " + this.constructor.name);}
    set duration(velocity)  { console.error("TODO: Implement for " + this.constructor.name);}
    get duration()          { console.error("TODO: Implement for " + this.constructor.name);}
    get clone()          { throw new Error("TODO: Implement for " + this.constructor.name);}

}


export default Instruction;



