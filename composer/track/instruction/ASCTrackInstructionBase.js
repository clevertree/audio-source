import * as React from "react";
import PropTypes from "prop-types";
import {ArgType, InstructionProcessor} from "../../../common/";
import {Instruction} from "../../../song";

export default class ASCTrackInstructionBase extends React.Component {
    /** Default Properties **/
    static defaultProps = {
    };

    /** Property validation **/
    static propTypes = {
        index: PropTypes.number.isRequired,
        instruction: PropTypes.any.isRequired,
        tracker: PropTypes.any.isRequired,
        cursorPosition: PropTypes.number.isRequired,
        selected: PropTypes.bool.isRequired,
        cursor: PropTypes.bool.isRequired
    };

    constructor(props) {
        super(props);

        this.state = {
            menuOpen: false
        }
    }


    // play() {
    //     const composer = this.props.composer;
    //     composer.song.playInstructionAtIndex(destination, this.state.track.currentGroup, this.index, composer.song.getAudioContext().currentTime);
    //     return this;
    getTracker() { return this.props.tracker; }
    getTrackName() { return this.getTracker().getTrackName(); }
    getComposer() { return this.getTracker().props.composer; }
    getSong() { return this.getComposer().getSong(); }
    getInstructionData() { return this.props.instruction; }
    getInstructionCommand() { return this.getInstructionData()[1]; }
    getInstructionIndex() { return this.props.index; }

    render() {
        // throw new Error("Unimplemented");
        return null;
    }

    renderParameter(i, param, className) {
        throw new Error("Unimplemented");
    }

    renderParameters() {
        const instructionData = this.getInstructionData();
        const params = [];
        const [commandString, argTypeList] = InstructionProcessor.processInstructionArgs(instructionData);
        let paramPosition = 1;
        for(let i=0; i<argTypeList.length; i++) {
            const argType = argTypeList[i];
            if(!argType.consumesArgument)
                continue;
            let className = 'asct-parameter';
            let param = instructionData[paramPosition++];
            switch(argType) {
                case ArgType.frequency:
                    className += ' frequency';
                    break;

                case ArgType.trackOffset:
                    className += ' offset';
                    param = this.formatDuration(param);
                    break;

                case ArgType.trackDuration:
                case ArgType.duration:
                    className += ' duration';
                    param = this.formatDuration(param);
                    break;

                case ArgType.velocity:
                    className += ' velocity';
                    break;

                default:
                    className += ' unknown';
                    break;
            }
            params.push(this.renderParameter(i, param, className));
        }

        return params;
    }

    formatDuration(param) {
        return param === null ? 'N/A'
            : this.getComposer().values.formatSongDuration(param);
    }

    /** Actions **/

    toggleDropDownMenu(menuOpen = !this.state.menuOpen) {
        this.setState({menuOpen});
    }

    playInstruction(destination=null) {
        // this.getTracker().getTrackInfo().updateCurrentInstruction(); // Hack
        return this.getTracker().playInstructions(this.getInstructionIndex(), destination);
    }

    selectInstruction(clearSelection=true, toggleValue = null) {
        // const trackName = this.getTracker().getTrackName();
        const selectedIndices = clearSelection ? [] : this.getTracker().getSelectedIndices();
        // console.log('selectInstruction', clearSelection, selectedIndices);
        // const instruction = this.getInstruction();
        const i = selectedIndices.indexOf(this.props.index);
        if(toggleValue === true || i === -1) {
            if(i === -1)
                selectedIndices.push(this.props.index);
        } else {
            if(i !== -1)
                selectedIndices.splice(i, 1);
        }
        // this.getComposer().trackerSelectIndices(trackName, selectedIndices, this.props.cursorPosition)
        // this.getTracker().selectIndices(selectedIndices); // , this.props.cursorPosition);
        this.getTracker().selectIndices(selectedIndices);
        this.getTracker().setCursorPositionOffset(this.props.cursorPosition);
        return selectedIndices;
    }

    selectInstructionWithAction(clearSelection=true, toggleValue = null) {
//         console.log('selectInstructionWithAction', clearSelection, toggleValue);
        const selectedIndices = this.selectInstruction(clearSelection, toggleValue);
        // const instructionData = this.getInstructionData();
        // if(InstructionProcessor.isTrackCommand(instructionData[1])) {
        //     this.getComposer().trackSelect(
        //         InstructionProcessor.getTrackNameFromInstructionData(instructionData),
        //         [],
        //         {
        //             destinationList: this.getTracker().getDestinationList().concat(this.getTracker().getTrackName())
        //         }
        //     );
        // } else {
            this.getTracker().playInstructions(selectedIndices);
        // }

    }


    /** Menus **/



    renderMenuEditSet() {
        const selectedIndices = this.getTracker().getSelectedIndices();
        return this.getComposer().renderMenuEdit(this.getInstructionCommand(), selectedIndices);
    }

    // }
    renderMenuSelectCommand() {
        return this.getComposer().values.renderMenuSelectCommand((command) => {
                this.instructionReplaceCommand(command);
            },
            this.props.instruction.command,
        );
    }


    renderMenuSelectVelocity() {
        return this.getComposer().values.renderMenuSelectVelocity(velocity => {
            this.instructionReplaceVelocity(velocity);
        }, this.props.instruction.velocity);
    }

    renderMenuSelectDuration() {
        return this.getComposer().values.renderMenuSelectDuration(duration => {
                this.instructionReplaceDuration(duration);
            },
            this.getSong().data.timeDivision,
            this.props.instruction.duration,
        );
    }

    /** Actions **/


    instructionReplaceCommand(command) {
        this.getComposer().instructionReplaceCommand(
            this.getTrackName(),
            this.props.index,
            command,
        )
    }

    // instructionReplaceProgram(programID) {
    //     this.getSong().instructionReplaceProgram(
    //         this.getComposer().state.selectedTrack,
    //         this.props.index,
    //         programID);
    //     this.forceUpdate();
    //
    // }

    instructionReplaceVelocity(velocity) {
        this.getComposer().instructionReplaceVelocity(
            this.getTrackName(),
            this.props.index,
            velocity);
        this.playInstruction();
    }

    instructionReplaceDuration(duration) {
        this.getComposer().instructionReplaceDuration(
            this.getTrackName(),
            this.props.index,
            duration);
        this.playInstruction();
    }
}
