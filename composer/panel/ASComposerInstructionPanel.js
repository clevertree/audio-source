import React from "react";

import {ASUIIcon, ASUIForm, ASUIPanel, ASUIInputRange, ASUIButton, ASUIButtonDropDown} from "../../components";
import ActiveTrackState from "../track/state/ActiveTrackState";

export default class ASComposerInstructionPanel extends React.Component {


    render() {
        const composer = this.props.composer;
        const selectedTrackName = composer.state.selectedTrack;
        const trackState = new ActiveTrackState(composer, selectedTrackName);
        // console.log('trackState', trackState);
        const selectedIndices = trackState.selectedIndices;


        return (
            <ASUIPanel
                className="instructions"
                header={`Instruction${selectedIndices.length !== 1 ? 's' : ''}`}>

                <ASUIForm className="instruction-command" header="Command">
                    <ASUIButtonDropDown
                        arrow={'▼'}
                        // className="command"
                        options={() => selectedIndices.length > 0 ? this.renderMenuEditSetCommand() : this.renderMenuSelectCommand()}
                    >{trackState.currentCommand}</ASUIButtonDropDown>
                </ASUIForm>

                {trackState.currentInstructionType === 'note' ? [
                    <ASUIForm key="instruction-velocity" header="Velocity">
                        <ASUIInputRange
                            // className="velocity"
                            onChange={(newVelocity) => this.instructionReplaceVelocitySelected(newVelocity)}
                            value={trackState.currentVelocity || 0}
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
                        >{trackState.currentDuration}</ASUIButtonDropDown>
                    </ASUIForm>
                ] : [
                    <ASUIForm key="instruction-arguments" header="Arguments">
                        <ASUIButton
                            onAction={() => this.renderMenuEditSetDuration()}
                            title="Program Duration"
                            disabled={selectedIndices.length === 0}
                        >{trackState.currentArguments.join(', ')}</ASUIButton>
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

