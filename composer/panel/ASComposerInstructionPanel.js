import React from "react";

import {ASUIIcon, ASUIForm, ASUIPanel, ASUIInputRange, ASUIButton, ASUIButtonDropDown} from "../../components";

export default class ASComposerInstructionPanel extends React.Component {



    // TODO
    // getCurrentInstructionType() { return this.state.currentInstructionType || 'custom'; }
    // getCurrentCommand() { return this.state.currentCommand || 'C4'; }
    // getCurrentDuration() { return this.state.currentDuration || '1B'; }
    // getCurrentVelocity() { return this.state.currentVelocity || null; }
    // getCurrentArguments() { return this.state.currentArguments || []; }

    render() {
        const composer = this.props.composer;
        const selectedTrackName = composer.state.selectedTrack;
        const activeTrack = composer.hasActiveTrack(selectedTrackName) ? composer.getActiveTrack(selectedTrackName) : null;
        const selectedIndices = activeTrack ? activeTrack.getSelectedIndices() : [];


        return (
            <ASUIPanel
                className="instructions"
                header={`Instruction${selectedIndices.length !== 1 ? 's' : ''}`}>

                <ASUIForm className="instruction-command" header="Command">
                    <ASUIButtonDropDown
                        arrow={'▼'}
                        // className="command"
                        options={() => selectedIndices.length > 0 ? this.renderMenuEditSetCommand() : this.renderMenuSelectCommand()}
                    >{composer.state.currentCommand}</ASUIButtonDropDown>
                </ASUIForm>

                {composer.state.currentInstructionType === 'note' ? [
                    <ASUIForm key="instruction-velocity" header="Velocity">
                        <ASUIInputRange
                            // className="velocity"
                            onChange={(newVelocity) => this.instructionReplaceVelocitySelected(newVelocity)}
                            value={composer.state.currentVelocity || 0}
                            min={1}
                            max={127}
                            // ref={ref => this.fieldProgramVelocity = ref}
                            title="Program Velocity"
                            disabled={selectedIndices.length === 0}
                        />
                    </ASUIForm>,

                    <ASUIForm key="instruction-duration" header="Duration">
                        <ASUIButtonDropDown
                            arrow={'▼'}
                            // className="instruction-duration"
                            options={() => this.renderMenuEditSetDuration()}
                            title="Program Duration"
                            disabled={selectedIndices.length === 0}
                        >{composer.state.currentDuration}</ASUIButtonDropDown>
                    </ASUIForm>
                ] : [
                    <ASUIForm key="instruction-arguments" header="Arguments">
                        <ASUIButton
                            onAction={() => this.renderMenuEditSetDuration()}
                            title="Program Duration"
                            disabled={selectedIndices.length === 0}
                        >{composer.state.currentArguments.join(', ')}</ASUIButton>
                    </ASUIForm>
                ]}






                <ASUIForm className="tracker-selection" header="Selection">
                    <ASUIButton
                        // className="track-selection"
                        onAction={() => this.trackerSelectIndicesPrompt()}
                        title="Tracker Note Selection"
                        children={selectedIndices.length > 0 ? selectedIndices.join(',') : "None"}
                    />
                </ASUIForm>

                <ASUIForm className="instruction-insert" header="Add">
                    <ASUIButton
                        // className="instruction-insert"
                        onAction={e => this.instructionInsert()}
                        title="Insert Instruction"
                        disabled={selectedIndices.length > 0}
                    >
                        <ASUIIcon source="insert"/>
                    </ASUIButton>
                </ASUIForm>
                <ASUIForm className="instruction-delete" header="Rem">
                    <ASUIButton
                        // className="instruction-delete"
                        onAction={e => this.instructionDeleteSelected()}
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

