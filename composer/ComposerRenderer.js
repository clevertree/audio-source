import React from "react";

import MenuOverlayContainer from "../components/menu/MenuOverlayContainer";
import {Div, Icon, Form, Panel, InputRange, Button, ButtonDropDown, MenuDropDown} from "../components";
import ProgramRenderer from "./program/ProgramRenderer";
import Tracker from "./tracker/Tracker";
import {Song, Values} from "../song/";
import "./assets/Composer.css";

class ComposerRenderer extends React.Component {
    constructor(state = {}, props = {}) {
        super(state, props);
        // this.state.trackerSegmentLength = null;
        // this.state.trackerRowLength = null;

        this.state = {
            title: "Audio Source Composer",
            status: "[No Song Loaded]",
            version: require('../package.json').version,
            menuKey: 'root',


            portrait: false,
            fullscreen: false,
            showPanelSong: true,
            showPanelPlaylist: true,

            // Playback
            volume: Song.DEFAULT_VOLUME,
            playing: false,
            paused: false,

            // Song Information
            songUUID: null,
            songPosition: 0,
            // songLengthTicks: 0,
            songLength: 0,

            // Trackers
            selectedTrack: 'root',
            activeTracks: {
                root:{
                    destination: this.getAudioContext(),
                    currentCommand: 'C4',
                    currentVelocity: null,
                    currentDuration: '1B',
                }
            },


            /** UI **/

            // Keyboard
            keyboardOctave: 4,


        };

        // this.shadowDOM = null;
    }

    // getSelectedTrack() { return this.state.selectedTrack; }

    render() {
        const selectedTrackName = this.state.selectedTrack;
        const trackState = this.state.activeTracks[selectedTrackName];
        const selectedIndices = trackState.selectedIndices || [];
        // console.log('trackState', trackState);
        return (
            <Div className={["asc-container", this.state.portrait ? 'portrait' : 'landscape'].join(' ')}>
                <MenuOverlayContainer
                    isActive={this.state.portrait}
                    >
                    <Div key="header" className="asc-title-container">
                        <Div className="asc-title-text">{this.state.title}</Div>
                        {this.state.portrait
                            ? <MenuDropDown
                                arrow={false}
                                className="asc-menu-button-toggle"
                                options={(p) => this.renderRootMenu(p)}
                                >
                                <Icon className="menu" />
                            </MenuDropDown>
                            : <Div className="asc-menu-container">{(p) => this.renderRootMenu(p)}</Div>}
                    </Div>
                    <Div className="asc-panel-container">
                        <Panel className="song" header="Song">
                            <Form className="playback" header="Playback">
                                <Button
                                    className="song-play"
                                    onAction={e => this.songPlay(e)}
                                >
                                    <Icon className="play"/>
                                </Button>
                                <Button
                                    className="song-pause"
                                    onAction={e => this.songPause(e)}
                                >
                                    <Icon className="pause"/>
                                </Button>
                                <Button
                                    className="song-stop"
                                    onAction={e => this.songStop(e)}
                                >
                                    <Icon className="stop"/>
                                </Button>
                            </Form>

                            <Form className="file" header="File">
                                <Button
                                    className="file-load"
                                    onAction={(e) => this.loadSongFromFileInput(e)}
                                    accept=".json,.mid,.midi"
                                    ref={ref => this.fieldSongFileLoad = ref}
                                    title="Load Song from File"
                                >
                                    <Icon className="file-load"/>
                                </Button>
                                <Button
                                    className="file-save"
                                    onAction={e => this.saveSongToFile(e)}
                                    title="Save Song to File"
                                >
                                    <Icon className="file-save"/>
                                </Button>
                            </Form>

                            <Form className="volume" header="Volume">
                                <InputRange
                                    className="volume"
                                    onChange={(e, newVolume) => this.setVolume(newVolume)}
                                    value={this.state.volume}
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    title="Song Volume"
                                />
                            </Form>

                            <Form className="position" header="Position">
                                <InputRange
                                    className="position"
                                    onChange={(e, pos) => this.setSongPositionPercentage(pos)}
                                    value={Math.floor(this.state.songPosition / this.state.songLength * 100)}
                                    min={0}
                                    max={100}
                                    // ref={ref => this.fieldSongPosition = ref}
                                    title="Song Position"
                                />
                            </Form>

                            <Form className="timing" header="Timing">
                                <Button
                                    className="timing"
                                    onAction={(e, timingString) => this.setSongPositionPrompt(timingString)}
                                    title="Song Timing"
                                    children={Values.formatPlaybackPosition(this.state.songPosition)}
                                />
                            </Form>

                            <Form className="name" header="Name">
                                <Button
                                    className="name"
                                    onAction={(e) => this.setSongNamePrompt()}
                                    title="Song Name"
                                    children={this.song ? this.song.data.title : "no song loaded"}
                                />
                            </Form>

                            <Form className="version" header="Version">
                                <Button
                                    className="version"
                                    onAction={(e) => this.setSongVersionPrompt()}
                                    title="Song Version"
                                    children={this.song ? this.song.data.version : "0.0.0"}
                                />
                            </Form>
                        </Panel>


                        <Panel className="programs" header="Programs"
                               ref={ref=>this.panelPrograms = ref}
                               children={() => (<>
                                   {this.song.programEach((programID, programClass, programConfig) =>
                                       <ProgramRenderer
                                           key={programID}
                                           composer={this}
                                           // openMenu={(e, options) => this.renderMenu(e, options)}
                                           // programClass={programClass}
                                           // programConfig={programConfig}
                                           programID={programID}
                                       />
                                   )}
                                   <Form className="program-add" header="Add Program">
                                       <MenuDropDown
                                           arrow={'▼'}
                                           className="program-add"
                                           options={() => this.renderMenuSelectAvailableProgram(programClass =>
                                                   this.programAdd(programClass)
                                               , 'Add New Program')}
                                           title="Add Program"
                                       >Select...</MenuDropDown>
                                   </Form>
                               </>)} />

                        <Panel className="instructions" header={`Instruction${selectedIndices.length !== 1 ? 's' : ''}`}
                               ref={ref=>this.panelInstructions = ref}
                        >
                            <Form className="instruction-command" header="Command">
                                <ButtonDropDown
                                    arrow={'▼'}
                                    // className="command"
                                    options={() => selectedIndices.length > 0 ? this.renderMenuEditSetCommand() : this.renderMenuEditInsert()}
                                >{trackState.currentCommand}</ButtonDropDown>
                            </Form>
                            <Form className="instruction-insert" header="Add">
                                <Button
                                    // className="instruction-insert"
                                    onAction={e => this.instructionInsert()}
                                    title="Insert Instruction"
                                    disabled={selectedIndices.length > 0}
                                >
                                    <Icon className="insert"/>
                                </Button>
                            </Form>
                            <Form className="instruction-delete" header="Rem">
                                <Button
                                    // className="instruction-delete"
                                    onAction={e => this.instructionDelete(e)}
                                    title="Delete Instruction"
                                    disabled={selectedIndices.length === 0}
                                >
                                    <Icon className="remove"/>
                                </Button>
                            </Form>

                            {/*<Form className="instruction-program" header="Program">*/}
                            {/*    <ButtonDropDown*/}
                            {/*        arrow={'▼'}*/}
                            {/*        // className="programs-programs"*/}
                            {/*        options={() => this.renderMenuEditSetProgram()}*/}
                            {/*        header="Song Programs"*/}
                            {/*    >Select</ButtonDropDown>*/}
                            {/*</Form>*/}

                            <Form className="instruction-velocity" header="Velocity">
                                <InputRange
                                    // className="velocity"
                                    onChange={(e, newVelocity) => this.instructionReplaceVelocity(newVelocity)}
                                    value={trackState.currentVelocity || 0}
                                    min={1}
                                    max={127}
                                    // ref={ref => this.fieldProgramVelocity = ref}
                                    title="Program Velocity"
                                    disabled={selectedIndices.length === 0}
                                    />
                            </Form>


                            <Form className="instruction-duration" header="Duration">
                                <ButtonDropDown
                                    arrow={'▼'}
                                    // className="instruction-duration"
                                    options={() => this.renderMenuEditSetDuration()}
                                    title="Program Duration"
                                    disabled={selectedIndices.length === 0}
                                >{trackState.currentDuration}</ButtonDropDown>
                            </Form>

                            <Form className="tracker-selection" header="Selection">
                                <Button
                                    // className="tracker-selection"
                                    onAction={(e) => this.trackerSelectIndicesPrompt()}
                                    title="Tracker Note Selection"
                                    children={selectedIndices.length > 0 ? selectedIndices.join(',') : "None"}
                                />
                            </Form>

                            <Form className="keyboard-octave" header="Octave">
                                <ButtonDropDown
                                    arrow={'▼'}
                                    className="keyboard-octave"
                                    options={() => this.renderMenuKeyboardSetOctave()}
                                    title="Change Keyboard Octave"
                                >{this.state.keyboardOctave}</ButtonDropDown>
                            </Form>

                            {/*<Form className="tracker-octave" header="Octave">*/}
                            {/*    <Button*/}
                            {/*        arrow={'▼'}*/}
                            {/*        className="tracker-selection"*/}
                            {/*        onAction={e => this.renderMenuKeyboardSetOctave(e)}*/}
                            {/*        title="Tracker Change Octave"*/}
                            {/*    >4</Button>*/}
                            {/*</Form>*/}
                        </Panel>

                        {/*<TrackerGroupsPane -w
                        l composer={this} />*/}
                        {/*<TrackerRowSegmentsPanel composer={this} />*/}

                        {/*<Panel className="tracker" header="Tracker">*/}
                        {/*    <Form className="tracker-row-length" title="Row &#120491;">*/}
                        {/*        <Button*/}
                        {/*            arrow={'▼'}*/}
                        {/*            // className="tracker-row-length"*/}
                        {/*            onAction={e => this.renderMenuTrackerSetQuantization(e)}*/}
                        {/*        >1B</Button>*/}
                        {/*    </Form>*/}

                        {/*    <Form className="tracker-segment-length" header="Seg &#120491;">*/}
                        {/*        <Button*/}
                        {/*            arrow={'▼'}*/}
                        {/*            // className="tracker-segment-length"*/}
                        {/*            onAction={e => this.renderMenuTrackerSetSegmentLength(e)}*/}
                        {/*            title="Select Tracker Segment Length"*/}
                        {/*        >16B</Button>*/}
                        {/*    </Form>*/}

                        {/*    /!*<Form className="tracker-program" header="Program">*!/*/}
                        {/*    /!*    <Button*!/*/}
                        {/*    /!*        arrow={'▼'}*!/*/}
                        {/*    /!*        // className="tracker-programs"*!/*/}
                        {/*    /!*        onAction={e => this.renderMenuTrackerSetProgramFilter(e)}*!/*/}
                        {/*    /!*        title="Filter by Tracker Program"*!/*/}
                        {/*    /!*    >Any</Button>*!/*/}
                        {/*    /!*</Form>*!/*/}
                        {/*</Panel>*/}


                    </Div>
                    <Div className="asc-trackers-container">
                        {Object.keys(this.state.activeTracks).map(trackName => (
                            <Tracker
                                key={trackName}
                                trackName={trackName}
                                trackState={this.state.activeTracks[trackName]}
                                selected={trackName === selectedTrackName}
                                // TODO bad idea? {...this.state.activeTracks[trackName]}
                                // destination={this.getAudioContext()}
                                composer={this}
                            />
                        ))}
                    </Div>
                    <Div key="footer" className="asp-footer-container">
                        <Div className="asp-status-text">{this.state.status}</Div>
                        <Div className="asp-version-text"
                             ref={this.footerVersionText}
                        >{this.state.version}</Div>
                    </Div>
                </MenuOverlayContainer>
            </Div>
        )
    }

    /** Song rendering **/
    getSong() { return this.song; }

    setCurrentSong(song) {
        if(!song instanceof Song)
            throw new Error("Invalid current song");
        if(this.song) {
            this.setStatus("Unloading song: " + this.song.data.title);
            if(this.song.isPlaying) {
                this.song.stopPlayback();
            }
            this.song.removeEventListener('*', this.onSongEventCallback);
            this.song.unloadAll();
        }
        this.song = song;
        // console.log("Current Song: ", song);
        // const timeDivision = song.data.timeDivision;
        // this.state.tracker.trackerSegmentLengthInTicks = null;

        const activeTracks = {
            'root': {
                // destination: this.getAudioContext()
            },
        };
        // activeTracks[song.getStartTrackName()] = {
        //     cursorOffset: 4,
        //     selectedIndices: [0]
        // };

        // this.song.setVolume(this.state.volume);
        this.song.addEventListener('*', this.onSongEventCallback);
        // this.setStatus("Initializing song: " + song.data.title);
        this.song.connect(this.getAudioContext());
        // this.setStatus("Loaded song: " + song.data.title);
        this.setState({
            status: "Loaded song: " + song.data.title,
            title: song.data.title,
            songUUID: song.data.uuid,
            // songLengthTicks: song.getSongLengthTicks(),
            songLength: song.getSongLengthInSeconds(),
            selectedTrack: song.getStartTrackName() || 'root',
            // trackerRowOffset: 0,
            // trackerQuantizationInTicks: timeDivision,
            // trackerSegmentLengthInTicks: timeDivision * 16,
            // trackerFilterByProgramID: null,
            activeTracks
        });
    }

    updateCurrentSong() {
        this.setState({
            songLength: this.song.getSongLengthInSeconds(),
        });
    }

    // createStyleSheetLink(stylePath, scriptElm=null) {
    //     const linkHRef = new URL(stylePath, (scriptElm || thisModule).src);
    //     const link = document.createElement('link');
    //     link.setAttribute('rel', 'stylesheet');
    //     link.href = linkHRef;
    //     return link;
    // }


    loadMIDIInterface(callback) {
        // TODO: wait for user input
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess().then(
                (MIDI) => {
                    console.info("MIDI initialized", MIDI);
                    const inputDevices = [];
                    MIDI.inputs.forEach(
                        (inputDevice) => {
                            inputDevices.push(inputDevice);
                            inputDevice.addEventListener('midimessage', callback);
                        }
                    );
                    console.log("MIDI input devices detected: " + inputDevices.map(d => d.name).join(', '));
                },
                (err) => {
                    throw new Error("error initializing MIDI: " + err);
                }
            );
        }
    }


    // setVersion(versionString) {
    //     this.state.version = versionString;
    //     if(this.textVersion)
    //         this.textVersion.forceUpdate();
    // }


    // get fieldprogramAdd()
    // TODO: AudioSourceComposerSongFormRenderer()
    /** @deprecated **/
    updateForms() {
        this.fieldSongName.value = this.song.data.title;
        this.fieldSongVersion.value = this.song.data.version;
        this.fieldSongBPM.value = this.song.data.bpm;

        this.fieldSongVolume.value = this.song.getVolumeValue();

        // let timeDivision = this.rowLengthInTicks || this.song.getSongTimeDivision();
        const cursorInstruction = this.song.instructionFind(this.state.selectedTrack, this.state.selectedIndices[0]);


        if (cursorInstruction) {
            this.fieldInstructionCommand.value = cursorInstruction.command; // , "Unknown Program");
            this.fieldInstructionProgram.addOrSetValue(cursorInstruction.program, cursorInstruction.program + ": Unknown Program");
            this.fieldInstructionVelocity.value = cursorInstruction.velocity;
            this.fieldInstructionDuration.value = cursorInstruction.durationTicksn;
        }

        this.fieldInstructionDelete.disabled = this.state.selectedIndices.length === 0;
        if (!this.fieldTrackerRowLength.value)
            this.fieldTrackerRowLength.setValue(this.song.data.timeDivision);
        // this.fieldTrackerRowLength.value = this.fieldTrackerRowLength.value; // this.song.getSongTimeDivision();
        if (!this.fieldInstructionDuration.value && this.fieldTrackerRowLength.value)
            this.fieldInstructionDuration.setValue(parseInt(this.fieldTrackerRowLength.value));


    }

}


export default ComposerRenderer
