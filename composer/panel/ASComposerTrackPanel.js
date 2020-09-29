import React from "react";

import {
    ASUIIcon,
    ASUIFormEntry,
    ASUIPanel,
    ASUIClickable,
    ASUIClickableDropDown,
    ASUIMenuAction
} from "../../components";
import Instruction from "../../song/instruction/Instruction";
import {ArgType, Values} from "../../song";

export default class ASComposerTrackPanel extends React.Component {

    constructor(props) {
        super(props);
        const composer = props.composer;
        this.cb = {
            renderMenuSelectTrack: () => this.renderMenuSelectTrack(),
            trackSelectIndicesPrompt: () => composer.trackSelectIndicesPrompt(),
            instructionInsertAtSelectedTrackCursor: () => composer.instructionInsertAtSelectedTrackCursor(),
            instructionDeleteSelected: () => composer.instructionDeleteIndices(),
            renderMenuKeyboardSetOctave: () => this.renderMenuKeyboardSetOctave(),
        }
        this.state = {
            selectedIndices: [],
            selectedInstructionData: [0, 'C4', '1B'],
            selectedTrackName: null,
            keyboardOctave: 4
        }
    }

    updateSelectedTrackIndices(selectedTrackName, selectedIndices=[]) {
        const composer = this.props.composer;
        const state = {
            selectedTrackName,
            selectedIndices,
        };

        if(selectedIndices.length > 0) {
            const instructionData = composer.getSong().instructionDataGetByIndex(selectedTrackName, selectedIndices[0]);
            state.selectedInstructionData = instructionData.slice();
            state.selectedInstructionData[0] = 0;
            // console.log('selectedInstructionData', state.selectedInstructionData);
        }
        this.setState(state);
    }

    render() {
        const selectedIndices = this.state.selectedIndices;
        // const activeTrack = composer.trackHasActive(selectedTrackName) ? composer.trackGetState(selectedTrackName) : null;
        // const selectedIndices = activeTrack ? activeTrack.getSelectedIndices() : [];


        return [
            <ASUIPanel
                key="track"
                viewKey="track"
                header={`Selected Track`}>
                <ASUIFormEntry className="track-name" header="Current">
                    <ASUIClickableDropDown
                        button wide
                        // className="track-selection"
                        options={this.cb.renderMenuSelectTrack}
                        title="Current Track"
                        children={this.state.selectedTrackName || "N/A"}
                    />
                </ASUIFormEntry>
                <ASUIFormEntry className="track-selection" header="Selection">
                    <ASUIClickable
                        button wide
                        // className="track-selection"
                        onAction={this.cb.trackSelectIndicesPrompt}
                        title="Selected Track Notes"
                        children={selectedIndices.length > 0 ? getSelectedIndicesString(selectedIndices) : "None"}
                    />
                </ASUIFormEntry>

                <ASUIFormEntry className="track-insert" header="Add">
                    <ASUIClickable
                        button wide
                        // className="instruction-insert"
                        onAction={this.cb.instructionInsertAtSelectedTrackCursor}
                        title="Insert Instruction"
                        // disabled={selectedIndices.length > 0}
                    >
                        <ASUIIcon source="insert"/>
                    </ASUIClickable>
                </ASUIFormEntry>
                <ASUIFormEntry className="track-delete" header="Rem">
                    <ASUIClickable
                        button wide
                        // className="instruction-delete"
                        onAction={this.cb.instructionDeleteSelected}
                        title="Delete Instruction"
                        disabled={selectedIndices.length === 0}
                    >
                        <ASUIIcon source="remove"/>
                    </ASUIClickable>
                </ASUIFormEntry>

                <ASUIFormEntry className="keyboard-octave" header="Octave">
                    <ASUIClickableDropDown
                        button wide
                        arrow={'▼'}
                        className="keyboard-octave"
                        options={this.cb.renderMenuKeyboardSetOctave}
                        title="Change Keyboard Octave"
                    >{this.state.keyboardOctave}</ASUIClickableDropDown>
                </ASUIFormEntry>
            </ASUIPanel>,
            <ASUIPanel
                key="instruction"
                viewKey="instruction"
                header={`Selected Instruction`}>
                {this.renderInstructionForms()}
            </ASUIPanel>
        ];
    }

    /** Keyboard Commands **/

    keyboardChangeOctave(keyboardOctave = null) {
        if (!Number.isInteger(keyboardOctave))
            throw new Error("Invalid segment ID");
        this.setState({keyboardOctave});
    }


    /** Forms **/

    renderInstructionForms() {
        const composer = this.props.composer;
        const instructionData = this.state.selectedInstructionData;
        const processor = new Instruction(instructionData);
        const [, argTypeList] = processor.processInstructionArgList();
        const formatStats = {
            timeDivision: composer.getSong().getTimeDivision()
        };

        // console.log('commandString', commandString, params);
        let argIndex = 0;
        return argTypeList.map((argType, i) => {
            if(!argType.consumesArgument)
                return null;
            argIndex++;
            let paramValue = instructionData[argIndex];
            switch(argType) {
                case ArgType.command:
                case ArgType.duration:
                case ArgType.frequency:
                case ArgType.offset:
                case ArgType.trackName:
                default:
                    return this.renderDropDownForm(instructionData, argType, argIndex, paramValue, formatStats);

                case ArgType.velocity:
                    return this.renderVelocityForm(instructionData, argType, argIndex, paramValue);
            }
        });
    }

    renderDropDownForm(instructionData, argType, argIndex, paramValue, formatStats={}) {
        let header = argType.title.split(' ').pop(); // Long text hack
        const composer = this.props.composer;
        return <ASUIFormEntry key={argIndex} header={header}>
            <ASUIClickableDropDown
                button wide
                arrow={'▼'}
                title={`Change ${argType.title}`}
                options={() => composer.renderMenuEditInstructionArgOptions(instructionData, argType, argIndex, paramValue)}
                // TODO: update state.selectedInstructionData
            >{argType.format(paramValue, formatStats)}</ASUIClickableDropDown>
        </ASUIFormEntry>
    }

    renderVelocityForm(instructionData, argType, argIndex, paramValue, header="Velocity", title="Instruction Velocity") {
        const composer = this.props.composer;

        return <ASUIFormEntry key={argIndex} header={header}>
            {Values.instance.renderInputVelocity((newVelocity) => {
                // TODO: update state.selectedInstructionData
                composer.instructionReplaceArgByType(composer.getSelectedTrackName(), this.state.selectedIndices, argType, newVelocity);
            }, paramValue, title)}
        </ASUIFormEntry>;
    }

    /** Menu **/

    renderMenuSelectTrack() {
        const composer = this.props.composer;
        return composer.renderMenuSelectTrack(trackName => {
            composer.trackSelect(trackName)
        }, null, composer.getSelectedTrackName())
    }
    renderMenuKeyboardSetOctave() {
        return Values.instance.getNoteOctaves(octave =>
            <ASUIMenuAction key={octave} onAction={(e) => this.keyboardChangeOctave(octave)}>{octave}</ASUIMenuAction>
        );
    }

}



function getSelectedIndicesString(selectedIndices) {
    if(selectedIndices.length <= 8)
        return selectedIndices.join(',');
    return `[${selectedIndices.length} selected]`;
}
