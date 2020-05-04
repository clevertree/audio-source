import React from "react";

import ASUIMenuOverlayContainer from "../components/menu/ASUIMenuOverlayContainer";
import {ASUIDiv, ASUIIcon, ASUIForm, ASUIPanel, ASUIInputRange, ASUIButton, ASUIButtonDropDown, ASUIMenuDropDown} from "../components";
import ASCProgramRenderer from "./program/ASCProgramRenderer";
import {ASCTrack} from "./track";
import {Values} from "../song/";
// import "./assets/ASComposer.css";
import style from "./ASComposerRenderer.style";

class ASComposerRenderer extends React.Component {

    render() {
        const selectedTrackName = this.state.selectedTrack;
        const trackState = this.state.activeTracks[selectedTrackName];
        // console.log('trackState', trackState);
        const selectedIndices = trackState.selectedIndices || [];
        return (
            <ASUIDiv className={["asc-container", this.state.portrait ? 'portrait' : 'landscape'].join(' ')}>
                <ASUIMenuOverlayContainer
                    isActive={this.state.portrait}
                    >
                    <ASUIDiv key="header" className="asc-title-container">
                        <ASUIDiv className="asc-title-text">{this.state.title}</ASUIDiv>
                        {this.state.portrait
                            ? <ASUIMenuDropDown
                                arrow={false}
                                className="asc-menu-button-toggle"
                                options={(p) => this.renderRootMenu(p)}
                                >
                                <ASUIIcon source="menu" />
                            </ASUIMenuDropDown>
                            : <ASUIDiv className="asc-menu-container">{(p) => this.renderRootMenu(p)}</ASUIDiv>}
                    </ASUIDiv>
                    <ASUIDiv className="asc-panel-container">
                        <ASUIPanel className="song" header="Song">
                            <ASUIForm className="playback" header="Playback">
                                <ASUIButton
                                    className="song-play"
                                    onAction={e => this.songPlay(e)}
                                >
                                    <ASUIIcon source="play"/>
                                </ASUIButton>
                                <ASUIButton
                                    className="song-pause"
                                    onAction={e => this.songPause(e)}
                                >
                                    <ASUIIcon source="pause"/>
                                </ASUIButton>
                                <ASUIButton
                                    className="song-stop"
                                    onAction={e => this.songStop(e)}
                                >
                                    <ASUIIcon source="stop"/>
                                </ASUIButton>
                            </ASUIForm>

                            <ASUIForm className="file" header="File">
                                <ASUIButton
                                    className="file-load"
                                    onAction={(e) => this.loadSongFromFileInput(e)}
                                    accept=".json,.mid,.midi"
                                    ref={ref => this.fieldSongFileLoad = ref}
                                    title="Load Song from File"
                                >
                                    <ASUIIcon source="file-load"/>
                                </ASUIButton>
                                <ASUIButton
                                    className="file-save"
                                    onAction={e => this.saveSongToFile(e)}
                                    title="Save Song to File"
                                >
                                    <ASUIIcon source="file-save"/>
                                </ASUIButton>
                            </ASUIForm>

                            <ASUIForm className="volume" header="Volume">
                                <ASUIInputRange
                                    className="volume"
                                    onChange={(e, newVolume) => this.setVolume(newVolume)}
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
                                    onChange={(e, pos) => this.setSongPositionPercentage(pos)}
                                    value={Math.floor(this.state.songPosition / (this.state.songLength || 1) * 100)}
                                    min={0}
                                    max={100}
                                    // ref={ref => this.fieldSongPosition = ref}
                                    title="Song Position"
                                />
                            </ASUIForm>

                            <ASUIForm className="timing" header="Timing">
                                <ASUIButton
                                    className="timing"
                                    onAction={(e, timingString) => this.setSongPositionPrompt(timingString)}
                                    title="Song Timing"
                                    children={Values.formatPlaybackPosition(this.state.songPosition)}
                                />
                            </ASUIForm>

                            <ASUIForm className="name" header="Name">
                                <ASUIButton
                                    className="name"
                                    onAction={(e) => this.setSongNamePrompt()}
                                    title="Song Name"
                                    children={this.song ? this.song.data.title : "no song loaded"}
                                />
                            </ASUIForm>

                            <ASUIForm className="version" header="Version">
                                <ASUIButton
                                    className="version"
                                    onAction={(e) => this.setSongVersionPrompt()}
                                    title="Song Version"
                                    children={this.song ? this.song.data.version : "0.0.0"}
                                />
                            </ASUIForm>
                        </ASUIPanel>


                        <ASUIPanel className="programs" header="Programs"
                                   ref={ref=>this.panelPrograms = ref}
                                   children={() => (<>
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
                                   <ASUIForm className="program-add" header="Add Program">
                                       <ASUIMenuDropDown
                                           arrow={'▼'}
                                           className="program-add"
                                           options={() => this.renderMenuSelectAvailableProgram(programClass =>
                                                   this.programAdd(programClass)
                                               , 'Add New Program')}
                                           title="Add Program"
                                       >Select...</ASUIMenuDropDown>
                                   </ASUIForm>
                               </>)} />

                        <ASUIPanel className="instructions" header={`Instruction${selectedIndices.length !== 1 ? 's' : ''}`}
                                   ref={ref=>this.panelInstructions = ref}
                        >
                            <ASUIForm className="instruction-command" header="Command">
                                <ASUIButtonDropDown
                                    arrow={'▼'}
                                    // className="command"
                                    options={() => selectedIndices.length > 0 ? this.renderMenuEditSetCommand() : this.renderMenuEditInsert()}
                                >{trackState.currentCommand}</ASUIButtonDropDown>
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
                                    onAction={e => this.instructionDeleteSelected(e)}
                                    title="Delete Instruction"
                                    disabled={selectedIndices.length === 0}
                                >
                                    <ASUIIcon source="remove"/>
                                </ASUIButton>
                            </ASUIForm>

                            {/*<Form className="instruction-program" header="Program">*/}
                            {/*    <ButtonDropDown*/}
                            {/*        arrow={'▼'}*/}
                            {/*        // className="programs-programs"*/}
                            {/*        options={() => this.renderMenuEditSetProgram()}*/}
                            {/*        header="Song Programs"*/}
                            {/*    >Select</ButtonDropDown>*/}
                            {/*</Form>*/}

                            <ASUIForm className="instruction-velocity" header="Velocity">
                                <ASUIInputRange
                                    // className="velocity"
                                    onChange={(e, newVelocity) => this.instructionReplaceVelocity(newVelocity)}
                                    value={trackState.currentVelocity || 0}
                                    min={1}
                                    max={127}
                                    // ref={ref => this.fieldProgramVelocity = ref}
                                    title="Program Velocity"
                                    disabled={selectedIndices.length === 0}
                                    />
                            </ASUIForm>


                            <ASUIForm className="instruction-duration" header="Duration">
                                <ASUIButtonDropDown
                                    arrow={'▼'}
                                    // className="instruction-duration"
                                    options={() => this.renderMenuEditSetDuration()}
                                    title="Program Duration"
                                    disabled={selectedIndices.length === 0}
                                >{trackState.currentDuration}</ASUIButtonDropDown>
                            </ASUIForm>

                            <ASUIForm className="tracker-selection" header="Selection">
                                <ASUIButton
                                    // className="track-selection"
                                    onAction={(e) => this.trackerSelectIndicesPrompt()}
                                    title="Tracker Note Selection"
                                    children={selectedIndices.length > 0 ? selectedIndices.join(',') : "None"}
                                />
                            </ASUIForm>

                            <ASUIForm className="keyboard-octave" header="Octave">
                                <ASUIButtonDropDown
                                    arrow={'▼'}
                                    className="keyboard-octave"
                                    options={() => this.renderMenuKeyboardSetOctave()}
                                    title="Change Keyboard Octave"
                                >{this.state.keyboardOctave}</ASUIButtonDropDown>
                            </ASUIForm>

                            {/*<Form className="track-octave" header="Octave">*/}
                            {/*    <Button*/}
                            {/*        arrow={'▼'}*/}
                            {/*        className="track-selection"*/}
                            {/*        onAction={e => this.renderMenuKeyboardSetOctave(e)}*/}
                            {/*        title="ASCTrack Change Octave"*/}
                            {/*    >4</Button>*/}
                            {/*</Form>*/}
                        </ASUIPanel>

                        {/*<TrackerGroupsPane -w
                        l composer={this} />*/}
                        {/*<TrackerRowSegmentsPanel composer={this} />*/}

                        {/*<ASUIPanel className="track" header="ASCTrack">*/}
                        {/*    <Form className="track-row-length" title="Row &#120491;">*/}
                        {/*        <Button*/}
                        {/*            arrow={'▼'}*/}
                        {/*            // className="track-row-length"*/}
                        {/*            onAction={e => this.renderMenuTrackerSetQuantization(e)}*/}
                        {/*        >1B</Button>*/}
                        {/*    </Form>*/}

                        {/*    <Form className="track-segment-length" header="Seg &#120491;">*/}
                        {/*        <Button*/}
                        {/*            arrow={'▼'}*/}
                        {/*            // className="track-segment-length"*/}
                        {/*            onAction={e => this.renderMenuTrackerSetSegmentLength(e)}*/}
                        {/*            title="Select ASCTrack Segment Length"*/}
                        {/*        >16B</Button>*/}
                        {/*    </Form>*/}

                        {/*    /!*<Form className="track-program" header="Program">*!/*/}
                        {/*    /!*    <Button*!/*/}
                        {/*    /!*        arrow={'▼'}*!/*/}
                        {/*    /!*        // className="track-programs"*!/*/}
                        {/*    /!*        onAction={e => this.renderMenuTrackerSetProgramFilter(e)}*!/*/}
                        {/*    /!*        title="Filter by ASCTrack Program"*!/*/}
                        {/*    /!*    >Any</Button>*!/*/}
                        {/*    /!*</Form>*!/*/}
                        {/*</ASUIPanel>*/}


                    </ASUIDiv>
                    <ASUIDiv className="asc-tracks-container">
                        {Object.keys(this.state.activeTracks).map(trackName => (
                            <ASCTrack
                                key={trackName}
                                trackName={trackName}
                                trackState={this.state.activeTracks[trackName]}
                                selected={trackName === selectedTrackName}
                                // TODO bad idea? {...this.state.activeTracks[trackName]}
                                // destination={this.getAudioContext()}
                                composer={this}
                            />
                        ))}
                    </ASUIDiv>
                    <ASUIDiv key="footer" className="asp-footer-container">
                        <ASUIDiv className="asp-status-text">{this.state.status}</ASUIDiv>
                        <ASUIDiv className="asp-version-text"
                             ref={this.footerVersionText}
                        >{this.state.version}</ASUIDiv>
                    </ASUIDiv>
                </ASUIMenuOverlayContainer>
            </ASUIDiv>
        )
    }

}


export default ASComposerRenderer
