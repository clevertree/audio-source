import * as React from "react";
import PropTypes from "prop-types";
import {ArgType, InstructionProcessor} from "../../../common/";

export default class ASCTrackInstructionBase extends React.Component {
    static TIMEOUT_LONGPRESS = 800;

    /** Default Properties **/
    static defaultProps = {
    };

    /** Property validation **/
    static propTypes = {
        index: PropTypes.number.isRequired,
        instruction: PropTypes.any.isRequired,
        track: PropTypes.any.isRequired,
        cursorPosition: PropTypes.number.isRequired,
        // selected: PropTypes.bool.isRequired,
        // cursor: PropTypes.bool.isRequired
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
    getTrack() { return this.props.track; }
    getTrackName() { return this.getTrack().getTrackName(); }
    getComposer() { return this.getTrack().props.composer; }
    getSong() { return this.getComposer().getSong(); }
    getInstructionData() { return this.props.instruction; }
    getInstructionCommand() { return this.getInstructionData()[1]; }
    getInstructionIndex() { return this.props.index; }

    render() {
        // throw new Error("Unimplemented");
        return null;
    }

    renderParameter(argIndex, param, className) {
        throw new Error("Unimplemented");
    }

    renderParameters() {
        const instructionData = this.getInstructionData();
        const params = [];
        const processor = new InstructionProcessor(instructionData);
        const [, argTypeList] = processor.processInstructionArgs();
        let argIndex = 0;
        for(let i=0; i<argTypeList.length; i++) {
            const argType = argTypeList[i];
            if(!argType.consumesArgument)
                continue;
            argIndex++;
            let className = 'asct-parameter';
            if(argIndex >= instructionData.length)
                break;
            let param = instructionData[argIndex];
            switch(argType) {
                case ArgType.frequency:
                    className += ' frequency';
                    break;

                case ArgType.offset:
                    className += ' offset';
                    param = this.formatDuration(param);
                    break;

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
            params.push(this.renderParameter(argIndex, param, className));
        }

        return params;
    }

    formatDuration(param) {
        return param === null ? 'N/A'
            : this.getComposer().values.formatSongDuration(param);
    }

    /** Actions **/

    // toggleDropDownMenu(menuOpen = !this.state.menuOpen) {
    //     this.setState({menuOpen});
    // }

    playInstruction(destination=null) {
        // this.getTrack().getTrackInfo().updateCurrentInstruction(); // Hack
        return this.getTrack().playInstructions(this.getInstructionIndex(), destination);
    }

    selectInstruction(clearSelection=true, toggleValue = null, playback=true) {
        const track = this.getTrack();
        // const trackName = this.getTrack().getTrackName();
        // const selectedIndices = clearSelection ? [] : this.getTrack().getSelectedIndices();
        // const instruction = this.getInstruction();
        // const i = selectedIndices.indexOf(this.props.index);
        // if(toggleValue === true || i === -1) {
        //     if(i === -1)
        //         selectedIndices.push(this.props.index);
        // } else {
        //     if(i !== -1)
        //         selectedIndices.splice(i, 1);
        // }
        // console.log('selectInstruction', clearSelection, selectedIndices, toggleValue);
        // this.getComposer().trackSelectIndices(trackName, selectedIndices, this.props.cursorPosition)
        // this.getTrack().selectIndices(selectedIndices); // , this.props.cursorPosition);
        const selectedIndices = track.selectIndices([this.props.index], clearSelection, playback);
        track.setCursorOffset(this.props.cursorPosition);
        return selectedIndices;
    }

}
