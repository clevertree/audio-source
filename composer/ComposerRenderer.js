import React from "react";
import InstrumentRenderer from "./instrument/InstrumentRenderer";
import Tracker from "./tracker/Tracker";
import MenuOverlayContainer from "../components/menu/MenuOverlayContainer";
import {Div, Icon, Form, Panel, InputRange, Button, ButtonDropDown, MenuDropDown} from "../components";

import "./assets/Composer.css";

class ComposerRenderer extends React.Component {
    constructor(state = {}, props = {}) {
        super(state, props);
        // this.state.trackerSegmentLength = null;
        // this.state.trackerRowLength = null;

        this.state = {
            status: "[No Song Loaded]",
            version: require('../package.json').version,
            menuKey: 'root',


            portrait: false,
            fullscreen: false,
            showPanelSong: true,
            showPanelPlaylist: true,

            // Playback
            playing: false,
            paused: false,

            // Global selected note(s)
            songLengthTicks: 0,
            songLengthSeconds: 0,

            // Trackers
            selectedTrack: 'root',
            activeTracks: {
                root:{
                    cursorIndex: 0,
                    selectedIndices: [0]
                }
            },

            // Keyboard
            keyboardOctave: 4

        };

        // this.shadowDOM = null;
    }


    render() {
        const {selectedTrackName, selectedIndices, cursorIndex, cursorInstruction} = this.trackerGetSelectedInfo();
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
                        <Panel className="song" title="Song">
                            <Form className="playback" title="Playback">
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

                            <Form className="file" title="File">
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

                            <Form className="volume" title="Volume">
                                <InputRange
                                    className="volume"
                                    onChange={(e, newVolume) => this.setVolume(newVolume / 100)}
                                    value={this.state.volume}
                                    min={1}
                                    max={100}
                                    ref={ref => this.fieldSongVolume = ref}
                                    title="Song Volume"
                                />
                            </Form>

                            <Form className="position" title="Position">
                                <InputRange
                                    className="position"
                                    onChange={(e, pos) => this.setSongPosition(pos)}
                                    value={0}
                                    min={0}
                                    max={Math.ceil(this.state.songLengthSeconds)}
                                    ref={ref => this.fieldSongPosition = ref}
                                    title="Song Position"
                                />
                            </Form>

                            <Form className="timing" title="Timing">
                                <Button
                                    className="timing"
                                    onAction={(e, timingString) => this.setSongPosition(timingString)}
                                    ref={ref => this.fieldSongTiming = ref}
                                    title="Song Timing"
                                    children="00:00:000"
                                />
                            </Form>

                            <Form className="name" title="Name">
                                <Button
                                    className="name"
                                    onAction={(e) => this.setSongName(e)}
                                    ref={ref => this.fieldSongVersion = ref}
                                    title="Song Name"
                                    children={this.song ? this.song.data.title : "no song loaded"}
                                />
                            </Form>

                            <Form className="version" title="Version">
                                <Button
                                    className="version"
                                    onAction={(e, newSongVersion) => this.setSongVersion(e, newSongVersion)}
                                    ref={ref => this.fieldSongVersion = ref}
                                    title="Song Version"
                                    children={this.song ? this.song.data.version : "0.0.0"}
                                />
                            </Form>
                        </Panel>

                        <Panel className="keyboard" title={`Keyboard`}
                            >
                            <Form className="keyboard-octave" title="Octave">
                                <ButtonDropDown
                                    arrow={'▼'}
                                    className="keyboard-octave"
                                    options={() => this.renderMenuTrackerSetOctave()}
                                    title="Change Keyboard Octave"
                                >{this.state.keyboardOctave}</ButtonDropDown>
                            </Form>
                        </Panel>

                        <Panel className="instruments" title="Instruments"
                               ref={ref=>this.panelInstruments = ref}
                               children={() => (<>
                                   {this.song.getInstrumentList().map((instrumentConfig, instrumentID) =>
                                       <InstrumentRenderer
                                           key={instrumentID}
                                           composer={this}
                                           // openMenu={(e, options) => this.renderMenu(e, options)}
                                           props={instrumentConfig}
                                           instrumentID={instrumentID}
                                       />
                                   )}
                                   <Form className="instrument-add" title="Add Instrument">
                                       <MenuDropDown
                                           arrow={'▼'}
                                           className="instrument-add"
                                           options={() => this.renderMenuSelectAvailableInstrument(instrumentClass =>
                                                   this.instrumentAdd(instrumentClass)
                                               , 'Add New Instrument')}
                                           title="Add Instrument"
                                       >Select...</MenuDropDown>
                                   </Form>
                               </>)} />

                        <Panel className="instructions" title={`Instruction${selectedIndices.length !== 1 ? 's' : ''}`}
                               ref={ref=>this.panelInstructions = ref}
                        >
                            <Form className="instruction-command" title="Command">
                                <ButtonDropDown
                                    arrow={'▼'}
                                    // className="command"
                                    options={() => this.renderMenuEditInsert()}
                                >{cursorInstruction ? cursorInstruction.command : 'C4'}</ButtonDropDown>
                            </Form>
                            <Form className="instruction-insert" title="Add">
                                <Button
                                    // className="instruction-insert"
                                    onAction={e => this.instructionInsert()}
                                    title="Insert Instruction"
                                >
                                    <Icon className="insert"/>
                                </Button>
                            </Form>
                            <Form className="instruction-delete" title="Rem">
                                <Button
                                    // className="instruction-delete"
                                    onAction={e => this.instructionDelete(e)}
                                    title="Delete Instruction"
                                >
                                    <Icon className="remove"/>
                                </Button>
                            </Form>

                            {/*<Form className="instruction-instrument" title="Instrument">*/}
                            {/*    <ButtonDropDown*/}
                            {/*        arrow={'▼'}*/}
                            {/*        // className="instruments-instruments"*/}
                            {/*        options={() => this.renderMenuEditSetInstrument()}*/}
                            {/*        title="Song Instruments"*/}
                            {/*    >Select</ButtonDropDown>*/}
                            {/*</Form>*/}

                            <Form className="instruction-velocity" title="Velocity">
                                <InputRange
                                    // className="velocity"
                                    onAction={(e, newVelocity) => this.instructionReplaceVelocity(newVelocity)}
                                    value={cursorInstruction ? cursorInstruction.velocity : 127}
                                    min={1}
                                    max={127}
                                    ref={ref => this.fieldInstrumentVelocity = ref}
                                    title="Instrument Velocity"
                                >{cursorInstruction ? cursorInstruction.velocity : 'N/A'}</InputRange>
                            </Form>


                            <Form className="instruction-duration" title="Duration">
                                <ButtonDropDown
                                    arrow={'▼'}
                                    // className="instruction-duration"
                                    options={e => this.renderMenuEditSetDuration(e)}
                                    title="Instrument Duration"
                                >1B</ButtonDropDown>
                            </Form>

                            <Form className="tracker-selection" title="Selection">
                                <Button
                                    // className="tracker-selection"
                                    onAction={(e) => this.trackerChangeSelection(e)}
                                    title="Tracker Note Selection"
                                    children={selectedIndices.length > 0 ? selectedIndices.join(',') : "No Selection"}
                                />
                            </Form>

                            {/*<Form className="tracker-octave" title="Octave">*/}
                            {/*    <Button*/}
                            {/*        arrow={'▼'}*/}
                            {/*        className="tracker-selection"*/}
                            {/*        onAction={e => this.renderMenuTrackerSetOctave(e)}*/}
                            {/*        title="Tracker Change Octave"*/}
                            {/*    >4</Button>*/}
                            {/*</Form>*/}
                        </Panel>

                        {/*<TrackerGroupsPane -w
                        l composer={this} />*/}
                        {/*<TrackerRowSegmentsPanel composer={this} />*/}

                        {/*<Panel className="tracker" title="Tracker">*/}
                        {/*    <Form className="tracker-row-length" title="Row &#120491;">*/}
                        {/*        <Button*/}
                        {/*            arrow={'▼'}*/}
                        {/*            // className="tracker-row-length"*/}
                        {/*            onAction={e => this.renderMenuTrackerSetQuantization(e)}*/}
                        {/*        >1B</Button>*/}
                        {/*    </Form>*/}

                        {/*    <Form className="tracker-segment-length" title="Seg &#120491;">*/}
                        {/*        <Button*/}
                        {/*            arrow={'▼'}*/}
                        {/*            // className="tracker-segment-length"*/}
                        {/*            onAction={e => this.renderMenuTrackerSetSegmentLength(e)}*/}
                        {/*            title="Select Tracker Segment Length"*/}
                        {/*        >16B</Button>*/}
                        {/*    </Form>*/}

                        {/*    /!*<Form className="tracker-instrument" title="Instrument">*!/*/}
                        {/*    /!*    <Button*!/*/}
                        {/*    /!*        arrow={'▼'}*!/*/}
                        {/*    /!*        // className="tracker-instruments"*!/*/}
                        {/*    /!*        onAction={e => this.renderMenuTrackerSetInstrumentFilter(e)}*!/*/}
                        {/*    /!*        title="Filter by Tracker Instrument"*!/*/}
                        {/*    /!*    >Any</Button>*!/*/}
                        {/*    /!*</Form>*!/*/}
                        {/*</Panel>*/}


                    </Div>
                    <Div className="asc-tracker-container">
                        {Object.keys(this.state.activeTracks).map(trackName => (
                            <Tracker
                                key={trackName}
                                selected={trackName === selectedTrackName}
                                {...this.state.activeTracks[trackName]}
                                trackName={trackName}
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
        if(this.song) {
            this.setStatus("Unloading song: " + this.song.data.title);
            if(this.song.isPlaying) {
                this.song.stopPlayback();
            }
            this.song.removeEventListener('*', this.onSongEventCallback);
            // TODO: unload song?
        }
        this.song = song;
        // const timeDivision = song.data.timeDivision;
        // this.state.tracker.trackerSegmentLengthInTicks = null;

        const activeTracks = {
            'root': {},
            'track0': {},
            'track1': {},
        };
        activeTracks[song.getStartGroup()] = {
            cursorIndex: 0,
            selectedIndices: [0]
        };

        // this.song.setVolume(this.state.volume);
        this.song.addEventListener('*', this.onSongEventCallback);
        this.setStatus("Initializing song: " + song.data.title);
        this.song.connect(this.getAudioContext());
        this.setStatus("Loaded song: " + song.data.title);
        this.setState({
            songLengthTicks: song.getsongLengthTicks(),
            songLengthSeconds: song.getSongLengthInSeconds(),
            selectedGroup: song.getStartGroup() || 'root',
            // trackerRowOffset: 0,
            // trackerQuantizationInTicks: timeDivision,
            // trackerSegmentLengthInTicks: timeDivision * 16,
            // trackerFilterByInstrumentID: null,
            activeTracks
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


    // get fieldinstrumentAdd()
    // TODO: AudioSourceComposerSongFormRenderer()
    /** @deprecated **/
    updateForms() {
        this.fieldSongName.value = this.song.data.title;
        this.fieldSongVersion.value = this.song.data.version;
        this.fieldSongBPM.value = this.song.data.bpm;

        this.fieldSongVolume.value = this.song.getVolumeValue();

        // let timeDivision = this.rowLengthInTicks || this.song.getSongTimeDivision();
        const cursorInstruction = this.song.instructionFind(this.state.selectedGroup, this.state.selectedIndices[0]);


        if (cursorInstruction) {
            this.fieldInstructionCommand.value = cursorInstruction.command; // , "Unknown Instrument");
            this.fieldInstructionInstrument.addOrSetValue(cursorInstruction.instrument, cursorInstruction.instrument + ": Unknown Instrument");
            this.fieldInstructionVelocity.value = cursorInstruction.velocity;
            this.fieldInstructionDuration.value = cursorInstruction.durationInTicksn;
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
