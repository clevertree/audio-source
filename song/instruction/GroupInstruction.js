import Instruction from "./Instruction";

class GroupInstruction extends Instruction {

    get groupName() {
        return typeof this.data[1] === "string" ? this.data[1].substr(1) : null;
    }

    set groupName(newGroupName) {
        this.data[1] = `@${newGroupName}`;
    }

}

export default GroupInstruction;
