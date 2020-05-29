import React from "react";

import {ASUIIcon, ASUIForm, ASUIPanel, ASUIButton, ASUIButtonDropDown} from "../../components";

export default class ASComposerTrackPanel extends React.Component {

    render() {
        const composer = this.props.composer;
        const selectedIndices = composer.state.currentSelectedIndices;
        // const activeTrack = composer.hasActiveTrack(selectedTrackName) ? composer.getActiveTrack(selectedTrackName) : null;
        // const selectedIndices = activeTrack ? activeTrack.getSelectedIndices() : [];


        return (
            <ASUIPanel
                className="track"
                header={`Track`}>
                <ASUIForm className="track-name" header="Current">
                    <ASUIButtonDropDown
                        // className="track-selection"
                        title="Current Track"
                        children={composer.state.selectedTrack || "N/A"}
                    />
                </ASUIForm>
                <ASUIForm className="track-selection" header="Selection">
                    <ASUIButton
                        // className="track-selection"
                        onAction={() => composer.trackerSelectIndicesPrompt()}
                        title="Selected Track Notes"
                        children={selectedIndices.length > 0 ? selectedIndices.join(',') : "None"}
                    />
                </ASUIForm>

                <ASUIForm className="track-insert" header="Add">
                    <ASUIButton
                        // className="instruction-insert"
                        onAction={e => composer.instructionInsertAtCursor()}
                        title="Insert Instruction"
                        // disabled={selectedIndices.length > 0}
                    >
                        <ASUIIcon source="insert"/>
                    </ASUIButton>
                </ASUIForm>
                <ASUIForm className="track-delete" header="Rem">
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
