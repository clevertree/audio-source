
class Instruction {
    constructor(instructionData = [0], index=null, instrumentID=null) {
        this.index = index;
        this.data = instructionData;
        this.instrumentID = instrumentID;
    }

    get deltaDurationInTicks() {
        return this.data[0];
    }

    set deltaDurationInTicks(newDeltaDuration) {
        this.data[0] = newDeltaDuration;
    }

    get command() {
        return this.data[1];
    }

    set command(newCommand) {
        this.data[1] = newCommand;
    }


    get durationInTicks() {
        return this.data[2];
    }

    set durationInTicks(newDuration) {
        newDuration = parseFloat(newDuration);
        if (Number.isNaN(newDuration))
            throw new Error("Invalid Duration");
        this.data[2] = newDuration;
    }

    /** @deprecated **/
    static parseDurationAsTicks(durationString, timeDivision) {
        if (typeof durationString !== 'string')
            return durationString;
        switch (durationString[durationString.length - 1].toLowerCase()) {
            case 't':
                return parseInt(durationString.substr(0, durationString.length - 1));
            case 'b':
                return timeDivision * parseFloat(durationString.substr(0, durationString.length - 1));
            default:
                throw new Error("Invalid Duration: " + durationString);
        }
    }
}


export default Instruction;
