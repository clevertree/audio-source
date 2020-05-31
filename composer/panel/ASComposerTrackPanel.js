import React from "react";

import {ASUIIcon, ASUIForm, ASUIPanel, ASUIButton, ASUIButtonDropDown} from "../../components";

export default class ASComposerTrackPanel extends React.Component {

    constructor(props) {
        super(props);
        const composer = props.composer;
        this.cb = {
            renderMenuSelectTrack: () => this.renderMenuSelectTrack(),
            trackerSelectIndicesPrompt: () => composer.trackerSelectIndicesPrompt(),
            instructionInsertAtCursor: () => composer.instructionInsertAtCursor(),
            instructionDeleteSelected: () => composer.instructionDeleteSelected(),
        }
    }


    render() {
        const composer = this.props.composer;
        const selectedIndices = composer.state.selectedTrackIndices;
        // const activeTrack = composer.hasActiveTrack(selectedTrackName) ? composer.getActiveTrack(selectedTrackName) : null;
        // const selectedIndices = activeTrack ? activeTrack.getSelectedIndices() : [];


        return (
            <ASUIPanel
                className="track"
                header={`Track`}>
                <ASUIForm className="track-name" header="Current">
                    <ASUIButtonDropDown
                        // className="track-selection"
                        options={this.cb.renderMenuSelectTrack}
                        title="Current Track"
                        children={composer.state.selectedTrack || "N/A"}
                    />
                </ASUIForm>
                <ASUIForm className="track-selection" header="Selection">
                    <ASUIButton
                        // className="track-selection"
                        onAction={this.cb.trackerSelectIndicesPrompt}
                        title="Selected Track Notes"
                        children={selectedIndices.length > 0 ? selectedIndices.join(',') : "None"}
                    />
                </ASUIForm>

                <ASUIForm className="track-insert" header="Add">
                    <ASUIButton
                        // className="instruction-insert"
                        onAction={this.cb.instructionInsertAtCursor}
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


            </ASUIPanel>
        );
    }

    renderMenuSelectTrack() {
        const composer = this.props.composer;
        return composer.values.renderMenuSelectTrack(trackName => {
            composer.trackSelect(trackName)
        }, null, composer.state.selectedTrack)
    }
}
