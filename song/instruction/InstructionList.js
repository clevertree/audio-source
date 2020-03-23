
export class InstructionList {
    constructor(instructionList) {
        this.instructionList = instructionList;
    }

    processInstructions() {
        let lastDurationNotes = [];
        let nextDeltaDuration = 0;
        for (let i = 0; i < this.instructionList.length; i++) {
            let instruction = this.instructionList[i];
            switch(typeof instruction) {
                case 'string':
                    instruction = [instruction, nextDeltaDuration];
                    lastDurationNotes.push(instruction);
                    break;

                case 'number':
                    lastDurationNotes.forEach(lastDurationNote => lastDurationNote[1] = instruction);
                    lastDurationNotes = [];
                    break;
            }
            this.instructionList[i] = instruction;
        }
        console.log('this.instructionList', this.instructionList);
    }

}


export default InstructionList;
