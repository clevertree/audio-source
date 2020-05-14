import React from "react";

import {ASUIIcon, ASUIForm, ASUIPanel, ASUIInputRange, ASUIButton, ASUIButtonDropDown} from "../components";
import ASCProgramRenderer from "./program/ASCProgramRenderer";
import ASComposerContainer from "./container/ASComposerContainer";
import ASCTracksContainer from "./track/container/ASCTracksContainer";
import ActiveTrackState from "./track/state/ActiveTrackState";

class ASComposerRenderer extends React.Component {
    constructor(props) {
        super(props);
        this.containerRef = React.createRef();
        this.cb = {
            songPlay: this.songPlay.bind(this),
            songPause: this.songPause.bind(this),
            songStop: this.songStop.bind(this),
            loadSongFromFileInput: this.loadSongFromFileInput.bind(this),
            saveSongToFile: this.saveSongToFile.bind(this),
        }
    }


    render() {
        console.log('ASComposerRenderer.render()');
        const selectedTrackName = this.state.selectedTrack;
        const trackState = new ActiveTrackState(this, selectedTrackName);
        // console.log('trackState', trackState);
        const selectedIndices = trackState.selectedIndices;


        return <ASComposerContainer
                    containerRef={this.containerRef}
                    composer={this}
                    >
                    {this.state.showPanelSong ? <ASUIPanel className="song" header="Song">
                        <ASUIForm className="playback" header="Playback">
                            <ASUIButton
                                className="song-play"
                                onAction={this.cb.songPlay}
                            >
                                <ASUIIcon source="play"/>
                            </ASUIButton>
                            <ASUIButton
                                className="song-pause"
                                onAction={this.cb.songPause}
                            >
                                <ASUIIcon source="pause"/>
                            </ASUIButton>
                            <ASUIButton
                                className="song-stop"
                                onAction={this.cb.songStop}
                            >
                                <ASUIIcon source="stop"/>
                            </ASUIButton>
                        </ASUIForm>

                        {this.state.portrait ? null : <ASUIForm className="file" header="File">
                            <ASUIButton
                                className="file-load"
                                onAction={this.cb.loadSongFromFileInput}
                                accept=".json,.mid,.midi"
                                ref={ref => this.fieldSongFileLoad = ref}
                                title="Load Song from File"
                            >
                                <ASUIIcon source="file-load"/>
                            </ASUIButton>
                            <ASUIButton
                                className="file-save"
                                onAction={this.cb.saveSongToFile}
                                title="Save Song to File"
                            >
                                <ASUIIcon source="file-save"/>
                            </ASUIButton>
                        </ASUIForm>}

                        <ASUIForm className="volume" header="Volume">
                            <ASUIInputRange
                                className="volume"
                                onChange={(newVolume) => this.setVolume(newVolume)}
                                value={this.state.volume}
                                min={0}
                                max={1}
                                step={0.02}
                                title="Song Volume"
                            />
                        </ASUIForm>

                        <ASUIForm className="position" header="Position">
                            <ASUIInputRange
                                className="position"
                                onChange={(pos) => this.setSongPositionPercentage(pos)}
                                value={Math.floor(this.state.songPosition / (this.state.songLength || 1) * 100)}
                                min={0}
                                max={100}
                                // ref={ref => this.fieldSongPosition = ref}
                                title="Song Position"
                            />
                        </ASUIForm>

                        <ASUIForm className="timing" header="Timing">
                            <ASUIButton
                                onAction={(e, timingString) => this.setSongPositionPrompt(timingString)}
                                title="Song Timing"
                                children={this.values.formatPlaybackPosition(this.state.songPosition)}
                            />
                        </ASUIForm>

                        {this.state.portrait ? null : <ASUIForm className="name" header="Name">
                            <ASUIButton
                                className="name"
                                onAction={(e) => this.setSongNamePrompt()}
                                title="Song Name"
                                children={this.song ? this.song.data.title : "no song loaded"}
                            />
                        </ASUIForm>}

                        <ASUIForm className="version" header="Version">
                            <ASUIButton
                                className="version"
                                onAction={(e) => this.setSongVersionPrompt()}
                                title="Song Version"
                                children={this.song ? this.song.data.version : "0.0.0"}
                            />
                        </ASUIForm>
                    </ASUIPanel> : null}


                    {this.state.showPanelProgram ? <ASUIPanel
                        className="programs"
                        header="Programs">
                       {this.song.programEach((programID, programClass, programConfig) =>
                           <ASCProgramRenderer
                               key={programID}
                               composer={this}
                               // openMenu={(e, options) => this.renderMenu(e, options)}
                               // programClass={programClass}
                               // programConfig={programConfig}
                               programID={programID}
                           />
                       )}
                       <ASUIButtonDropDown
                           arrow={false}
                           vertical={false}
                           className="program-add"
                           options={() => this.renderMenuProgramAdd()}
                           title="Add New Program"
                       >Add</ASUIButtonDropDown>
                    </ASUIPanel> : null }

                    {this.state.showPanelInstruction ? <ASUIPanel
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


                    </ASUIPanel> : null}

                    {this.state.showPanelKeyboard ? <ASUIPanel
                        className="keyboard"
                        header="Keyboard">
                        <ASUIForm className="keyboard-octave" header="Octave">
                            <ASUIButtonDropDown
                                arrow={'▼'}
                                className="keyboard-octave"
                                options={() => this.renderMenuKeyboardSetOctave()}
                                title="Change Keyboard Octave"
                            >{this.state.keyboardOctave}</ASUIButtonDropDown>
                        </ASUIForm>
                    </ASUIPanel> : null}


                    <ASCTracksContainer
                        composer={this}
                        selectedTrackName={selectedTrackName}
                        />
                    {this.renderWebViewProxy()}
                </ASComposerContainer>;
    }


    /** Render WebView Proxy **/
    renderWebViewProxy() {
        return null;
    }

}


export default ASComposerRenderer
