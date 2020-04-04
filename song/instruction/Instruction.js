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


    get deltadurationTicks() {
        return this.data[0];
    }

    set deltadurationTicks(newDeltaDuration) {
        this.data[0] = newDeltaDuration;
    }




    /** @deprecated **/
    clone() {
        return new Instruction(
            Object.assign({}, this.data),
            this.index,
        )
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



