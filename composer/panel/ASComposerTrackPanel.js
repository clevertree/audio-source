import React from "react";

import {ASUIIcon, ASUIForm, ASUIPanel, ASUIButton, ASUIButtonDropDown} from "../../components";
import {ArgType, InstructionProcessor, Values} from "../../common";

export default class ASComposerTrackPanel extends React.Component {

    constructor(props) {
        super(props);
        const composer = props.composer;
        this.cb = {
            renderMenuSelectTrack: () => this.renderMenuSelectTrack(),
            trackSelectIndicesPrompt: () => composer.trackSelectIndicesPrompt(),
            instructionInsertAtSelectedTrackCursor: () => composer.instructionInsertAtSelectedTrackCursor(),
            instructionDeleteSelected: () => composer.instructionDeleteIndices(),
            renderMenuKeyboardSetOctave: () => composer.renderMenuKeyboardSetOctave(),
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
                <ASUIForm className="track-name" header="Current">
                    <ASUIButtonDropDown
                        // className="track-selection"
                        options={this.cb.renderMenuSelectTrack}
                        title="Current Track"
                        children={this.state.selectedTrackName || "N/A"}
                    />
                </ASUIForm>
                <ASUIForm className="track-selection" header="Selection">
                    <ASUIButton
                        // className="track-selection"
                        onAction={this.cb.trackSelectIndicesPrompt}
                        title="Selected Track Notes"
                        children={selectedIndices.length > 0 ? getSelectedIndicesString(selectedIndices) : "None"}
                    />
                </ASUIForm>

                <ASUIForm className="track-insert" header="Add">
                    <ASUIButton
                        // className="instruction-insert"
                        onAction={this.cb.instructionInsertAtSelectedTrackCursor}
                        title="Insert Instruction"
                        // disabled={selectedIndices.length > 0}
                    >
                        <ASUIIcon source="insert"/>
                    </ASUIButton>
                </ASUIForm>
                <ASUIForm className="track-delete" header="Rem">
                    <ASUIButton
                        // className="instruction-delete"
                        onAction={this.cb.instructionDeleteSelected}
                        title="Delete Instruction"
                        disabled={selectedIndices.length === 0}
                    >
                        <ASUIIcon source="remove"/>
                    </ASUIButton>
                </ASUIForm>

                <ASUIForm className="keyboard-octave" header="Octave">
                    <ASUIButtonDropDown
                        arrow={'▼'}
                        className="keyboard-octave"
                        options={this.cb.renderMenuKeyboardSetOctave}
                        title="Change Keyboard Octave"
                    >{this.state.keyboardOctave}</ASUIButtonDropDown>
                </ASUIForm>
            </ASUIPanel>,
            <ASUIPanel
                key="instruction"
                viewKey="instruction"
                header={`Selected Instruction`}>
                {this.renderInstructionForms()}
            </ASUIPanel>
        ];
    }

    /** Forms **/

    renderInstructionForms() {
        const instructionData = this.state.selectedInstructionData;
        const processor = new InstructionProcessor(instructionData);
        const [, argTypeList] = processor.processInstructionArgList();

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
                    return this.renderDropDownForm(instructionData, argType, argIndex, paramValue);

                case ArgType.velocity:
                    return this.renderVelocityForm(instructionData, argType, argIndex, paramValue);
            }
        });
    }

    renderDropDownForm(instructionData, argType, argIndex, paramValue) {
        let header = argType.title.split(' ').pop(); // Long text hack
        const composer = this.props.composer;
        return <ASUIForm key={argIndex} header={header}>
            <ASUIButtonDropDown
                arrow={'▼'}
                title={`Change ${argType.title}`}
                options={() => composer.renderMenuEditInstructionArgOptions(instructionData, argType, argIndex, paramValue)}
            >{argType.format(paramValue, composer.getSong().values)}</ASUIButtonDropDown>
        </ASUIForm>
    }

    renderVelocityForm(instructionData, argType, argIndex, paramValue, header="Velocity", title="Instruction Velocity") {
        const composer = this.props.composer;

        return <ASUIForm key={argIndex} header={header}>
            {Values.instance.renderInputVelocity((newVelocity) => {
                composer.instructionReplaceArgByType(composer.getSelectedTrackName(), this.state.selectedIndices, argType, newVelocity);
            }, paramValue, title)}
        </ASUIForm>;
    }

    /** Menu **/

    renderMenuSelectTrack() {
        const composer = this.props.composer;
        return composer.values.renderMenuSelectTrack(trackName => {
            composer.trackSelect(trackName)
        }, null, composer.getSelectedTrackName())
    }
}



function getSelectedIndicesString(selectedIndices) {
    if(selectedIndices.length <= 8)
        return selectedIndices.join(',');
    return `[${selectedIndices.length} selected]`;
}
