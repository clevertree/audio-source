import Instruction from "./Instruction";

class GroupInstruction extends Instruction {

    getGroupName() {
        return typeof this.data[1] === "string" ? this.data[1].substr(1) : null;
    }

    setGroupName(newGroupName) {
        this.data[1] = `@${newGroupName}`;
    }

}

export default GroupInstruction;
