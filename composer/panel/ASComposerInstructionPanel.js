import React from "react";

import {ASUIIcon, ASUIForm, ASUIPanel, ASUIInputRange, ASUIButton, ASUIButtonDropDown} from "../../components";
import {ArgType, InstructionProcessor} from "../../common";

export default class ASComposerInstructionPanel extends React.Component {



    // TODO
    // getCurrentInstructionType() { return this.state.currentInstructionType || 'custom'; }
    // getCurrentCommand() { return this.state.currentCommand || 'C4'; }
    // getCurrentDuration() { return this.state.currentDuration || '1B'; }
    // getCurrentVelocity() { return this.state.currentVelocity || null; }
    // getCurrentArguments() { return this.state.currentArguments || []; }


    // TODO: combine with InstructionBase?
    renderInstructionForms() {
        const composer = this.props.composer;
        // const params = composer.state.currentInstructionArgs;
        const instructionData = [0].concat(composer.state.currentInstructionArgs);
        // let [commandString, ...params] = composer.state.currentInstructionArgs;
        // let commandString = params.shift();
        const [commandString, argTypeList] = InstructionProcessor.processInstructionArgs(instructionData);
        // commandString = InstructionProcessor.getCommandStringFromInstruction(commandString, params);
        // console.log('commandString', commandString, params);
        let paramPosition = 1;
        return argTypeList.map((argType, i) => {
            if(!argType.consumesArgument)
                return;
            let param = instructionData[paramPosition++];
            switch(argType) {
                case ArgType.command: // TODO: resolve conflict?
                case ArgType.frequency:
                    return <ASUIForm key="arg-command" header="Command">
                        <ASUIButtonDropDown
                            arrow={'▼'}
                            // className="command"
                            // options={() => selectedIndices.length > 0 ? composer.renderMenuEditSetCommand() : composer.renderMenuSelectCommand()}
                            options={() => composer.renderMenuSelectCommand()}
                        >{param}</ASUIButtonDropDown>
                    </ASUIForm>

                case ArgType.duration:
                    const durationString = param === null ? 'N/A'
                        : composer.values.formatSongDuration(param);
                    return <ASUIForm key="arg-duration" header="Duration">
                        <ASUIButtonDropDown
                            arrow={'▼'}
                            // className="instruction-duration"
                            options={() => composer.renderMenuEditSetDuration()}
                            title="Instruction Duration"
                        >{durationString}</ASUIButtonDropDown>
                    </ASUIForm>

                case ArgType.velocity:
                    return <ASUIForm key="arg-velocity" header="Velocity">
                        <ASUIInputRange
                            // className="velocity"
                            onChange={(newVelocity) => composer.instructionReplaceVelocityPrompt(null, null, newVelocity, false)}
                            value={param || 0}
                            min={1}
                            max={127}
                            // ref={ref => this.fieldProgramVelocity = ref}
                            title="Instruction Velocity"
                            // disabled={selectedIndices.length === 0}
                        />
                    </ASUIForm>;


                default:
                    return <ASUIForm key="arg-unknown" header={`Arg ${i}`}>
                        <ASUIButton
                            onAction={() => composer.renderMenuEditSetDuration()}
                            title={`Instruction Argument ${i}`}
                            // disabled={selectedIndices.length === 0}
                        >{param}</ASUIButton>
                    </ASUIForm>
            }
        });
    }


    render() {
        const composer = this.props.composer;
        const selectedIndices = composer.state.currentSelectedIndices;
        // const activeTrack = composer.hasActiveTrack(selectedTrackName) ? composer.getActiveTrack(selectedTrackName) : null;
        // const selectedIndices = activeTrack ? activeTrack.getSelectedIndices() : [];


        return (
            <ASUIPanel
                className="instructions"
                header={`Instruction${selectedIndices.length !== 1 ? 's' : ''}`}>

                {this.renderInstructionForms()}


                <ASUIForm className="tracker-selection" header="Selection">
                    <ASUIButton
                        // className="track-selection"
                        onAction={() => composer.trackerSelectIndicesPrompt()}
                        title="Tracker Note Selection"
                        children={selectedIndices.length > 0 ? selectedIndices.join(',') : "None"}
                    />
                </ASUIForm>

                <ASUIForm className="instruction-insert" header="Add">
                    <ASUIButton
                        // className="instruction-insert"
                        onAction={e => composer.instructionInsertAtCursorPrompt(null, null, false)}
                        title="Insert Instruction"
                        // disabled={selectedIndices.length > 0}
                    >
                        <ASUIIcon source="insert"/>
                    </ASUIButton>
                </ASUIForm>
                <ASUIForm className="instruction-delete" header="Rem">
                    <ASUIButton
                        // className="instruction-delete"
                        onAction={e => composer.instructionDeleteSelected()}
                        title="Delete Instruction"
                        disabled={selectedIndices.length === 0}
                    >
                        <ASUIIcon source="remove"/>
                    </ASUIButton>
                </ASUIForm>


            </ASUIPanel>
        );
    }
}

