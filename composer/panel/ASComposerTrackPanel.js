import React from "react";

import {ASUIIcon, ASUIForm, ASUIPanel, ASUIButton, ASUIButtonDropDown} from "../../components";

export default class ASComposerTrackPanel extends React.Component {

    constructor(props) {
        super(props);
        const composer = props.composer;
        this.cb = {
            renderMenuSelectTrack: () => this.renderMenuSelectTrack(),
            trackSelectIndicesPrompt: () => composer.trackSelectIndicesPrompt(),
            instructionInsertAtCursor: () => composer.instructionInsertAtCursor(),
            instructionDeleteSelected: () => composer.instructionDeleteSelected(),
        }
    }

    getSelectedIndicesString() {
        const composer = this.props.composer;
        const selectedIndices = composer.state.selectedTrackIndices;
        if(selectedIndices.length <= 8) {
            return selectedIndices.join(',');
        }
        return selectedIndices
            .slice(0, 8)
            .join(',')
            + ' ...';
    }

    render() {
        const composer = this.props.composer;
        const selectedIndices = composer.state.selectedTrackIndices;
        // const activeTrack = composer.trackHasActive(selectedTrackName) ? composer.trackGetActive(selectedTrackName) : null;
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
                        onAction={this.cb.trackSelectIndicesPrompt}
                        title="Selected Track Notes"
                        children={selectedIndices.length > 0 ? this.getSelectedIndicesString() : "None"}
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
            composer.trackSelectActive(trackName)
        }, null, composer.state.selectedTrack)
    }
}
