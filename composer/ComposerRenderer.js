import React from "react";

import Div from "../components/div/Div";
import Icon from "../components/icon/Icon";
import {Menu, MenuButton, Button, InputRange} from "../components";

// import Storage from "../song/Storage";

import Header from "./header/Header";
import Panel from "./panel/Panel";
import Form from "./form/Form";
import Footer from "./footer/Footer";
import InstrumentRenderer from "./instrument/InstrumentRenderer";
// import InputSelect from "../components/input-select/InputSelect";
import Tracker from "./tracker/Tracker";
import InstrumentLoader from "../instrument/InstrumentLoader";

import "./assets/Composer.css";
import TrackerGroupsPanel from "./tracker/panel/TrackerGroupsPanel";
import TrackerRowSegmentsPanel from "./tracker/panel/TrackerRowSegmentsPanel";
import MenuOverlayContainer from "../components/menu/MenuOverlayContainer";

class ComposerRenderer extends React.Component {
    constructor(state = {}, props = {}) {
        super(state, props);
        // this.state.trackerSegmentLength = null;
        // this.state.trackerRowLength = null;

        this.state = {
            status: "[No Song Loaded]",
            version: require('../package.json').version,
            menuKey: 'root',

            songLength: 0,
            songLengthInTicks: 0,
            playing: false,
            paused: false,

            portrait: false,
            fullscreen: false,
            showPanelSong: true,
            showPanelPlaylist: true,

            selectedGroup: 'root',
            selectedIndices: [],
            cursorIndex: 0,

            quantizationInTicks: 96*4,
            segmentLengthInTicks: 96*4*16,
            trackerCurrentOctave: 3,
            filterByInstrumentID: null,

            // trackerSegmentCount: 10,
            trackerRowOffset: 0,
            trackerRowCount: 32,
        };

        this.shadowDOM = null;

    }


    /** Song rendering **/
    getSong() { return this.song; }

    async setCurrentSong(song) {
        if(this.song) {
            this.setStatus("Unloading song: " + this.song.getTitle());
            if(this.song.isPlaying) {
                this.song.stopPlayback();
            }
            this.song.removeEventListener('*', this.onSongEventCallback);
            // TODO: unload song?
        }
        this.song = song;
        const timeDivision = song.getTimeDivision();
        // this.state.tracker.segmentLengthInTicks = null;


        // this.song.setVolume(this.state.volume);
        this.song.addEventListener('*', this.onSongEventCallback);
        this.setStatus("Initializing song: " + song.getTitle());
        await this.song.init(this.getAudioContext());
        this.setStatus("Loaded song: " + song.getTitle());
        this.setState({
            songLengthInTicks: song.getSongLengthInTicks(),
            songLength: song.getSongLengthInSeconds(),
            selectedGroup: song.getRootGroup() || 'root',
            trackerRowOffset: 0,
            quantizationInTicks: timeDivision,
            segmentLengthInTicks: timeDivision * 16,
            filterByInstrumentID: null,
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


    render() {
        return (
            <MenuOverlayContainer
                ref = {ref => this.menu = ref}
                >
                <Div className="asc-container">
                    <Header
                        key="header"
                        menuContent={() => this.getMenuRoot()}
                    />
                    <Div className="asc-panel-container">
                        <Panel className="song" title="Song">
                            <Form className="playback" title="Playback">
                                <Button
                                    className="song-play"
                                    onAction={e => this.playlistPlay(e)}
                                >
                                    <Icon className="play"/>
                                </Button>
                                <Button
                                    className="song-pause"
                                    onAction={e => this.playlistPause(e)}
                                >
                                    <Icon className="pause"/>
                                </Button>
                                <Button
                                    className="song-stop"
                                    onAction={e => this.playlistStop(e)}
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
                                    max={Math.ceil(this.state.songLength)}
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
                                    children={this.song ? this.song.getTitle() : "no song loaded"}
                                />
                            </Form>

                            <Form className="version" title="Version">
                                <Button
                                    className="version"
                                    onAction={(e, newSongVersion) => this.setSongVersion(e, newSongVersion)}
                                    ref={ref => this.fieldSongVersion = ref}
                                    title="Song Version"
                                    children={this.song ? this.song.getVersion() : "0.0.0"}
                                />
                            </Form>
                        </Panel>

                        <Panel className="instruments" title="Instruments"
                               ref={ref=>this.panelInstruments = ref}
                               children={() => (<>
                                   {this.song.getInstrumentList().map((instrumentConfig, instrumentID) =>
                                       <InstrumentRenderer
                                           key={instrumentID}
                                           song={this.song}
                                           openMenu={e => this.openMenu(e)}
                                           props={instrumentConfig}
                                           instrumentID={instrumentID}
                                       />
                                   )}
                                   <Form className="instrument-add" title="Add Instrument">
                                       <Button
                                           className="instrument-add"
                                           onAction={e => this.openMenuSelectAvailableInstrument(e, instrumentClass => {
                                               this.instrumentAdd(instrumentClass)
                                           }, 'Add instrument ')}
                                           title="Add Instrument"
                                       >Select...</Button>
                                   </Form>
                               </>)} />

                        <Panel className="instructions" title="Instructions"
                               ref={ref=>this.panelInstructions = ref}
                        >
                            <Form className="instruction-command" title="Command">
                                <Button
                                    // className="command"
                                    onAction={e => this.openMenuEditInsert(e)}
                                    // // TODO: filter by selected instrument
                                >C4</Button>
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

                            <Form className="instruction-instrument" title="Instrument">
                                <Button
                                    // className="instrument-instrument"
                                    onAction={e => this.openMenuEditSetInstrument(e)}
                                    title="Song Instruments"
                                >Select</Button>
                            </Form>

                            <Form className="instruction-velocity" title="Velocity">
                                <InputRange
                                    // className="velocity"
                                    onAction={(e, newVelocity) => this.instructionReplaceVelocity(newVelocity)}
                                    // value={this.state.volume}
                                    min={1}
                                    max={127}
                                    ref={ref => this.fieldInstrumentVelocity = ref}
                                    title="Instrument Velocity"
                                >Max</InputRange>
                            </Form>


                            <Form className="instruction-duration" title="Duration">
                                <Button
                                    // className="instruction-duration"
                                    onAction={e => this.openMenuEditSetDuration(e)}
                                    title="Load Song from File"
                                >1B</Button>
                            </Form>
                        </Panel>

                        <Panel className="tracker" title="Tracker">
                            <Form className="tracker-row-length" title="Row &#120491;">
                                <Button
                                    // className="tracker-row-length"
                                    onAction={e => this.openMenuTrackerSetQuantization(e)}
                                >1B</Button>
                            </Form>

                            <Form className="tracker-segment-length" title="Seg &#120491;">
                                <Button
                                    // className="tracker-segment-length"
                                    onAction={e => this.openMenuTrackerSetSegmentLength(e)}
                                    title="Select Tracker Segment Length"
                                >16B</Button>
                            </Form>

                            <Form className="tracker-instrument" title="Instrument">
                                <Button
                                    // className="tracker-instrument"
                                    onAction={e => this.openMenuTrackerSetInstrumentFilter(e)}
                                    title="Filter by Tracker Instrument"
                                >Any</Button>
                            </Form>

                            <Form className="tracker-selection" title="Selection">
                                <Button
                                    // className="tracker-selection"
                                    onAction={(e) => this.trackerChangeSelection(e)}
                                    title="Tracker Note Selection"
                                    children="No selection"
                                />
                            </Form>

                            <Form className="tracker-octave" title="Octave">
                                <Button
                                    className="tracker-selection"
                                    onAction={e => this.openMenuTrackerSetOctave(e)}
                                    title="Tracker Change Octave"
                                >4</Button>
                            </Form>
                        </Panel>

                        <TrackerGroupsPanel composer={this} />
                        <TrackerRowSegmentsPanel composer={this} />

                    </Div>
                    <Div className="asc-tracker-container">
                        <Tracker
                            ref={ref => this.tracker = ref}
                            composer={this}
                        />
                    </Div>
                    <Footer composer={this} ref={ref => this.footer = ref} />
                </Div>
            </MenuOverlayContainer>
        )
    }


    setStatus(newStatus) {
        console.info.apply(null, arguments); // (newStatus);
        this.footer && this.footer.setStatus(newStatus);
    }
    setError(newStatus) {
        console.error.apply(null, arguments); // (newStatus);
        this.footer && this.footer.setError(newStatus);
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
        this.fieldSongName.value = this.song.getTitle();
        this.fieldSongVersion.value = this.song.getVersion();
        this.fieldSongBPM.value = this.song.getStartingBeatsPerMinute();

        this.fieldSongVolume.value = this.song.getVolumeValue();

        // let timeDivision = this.rowLengthInTicks || this.song.getSongTimeDivision();
        const cursorInstruction = this.song.instructionFind(this.state.selectedGroup, this.state.selectedIndices[0]);


        if (cursorInstruction) {
            this.fieldInstructionCommand.value = cursorInstruction.command; // , "Unknown Instrument");
            this.fieldInstructionInstrument.addOrSetValue(cursorInstruction.instrument, cursorInstruction.instrument + ": Unknown Instrument");
            this.fieldInstructionVelocity.value = cursorInstruction.velocity;
            this.fieldInstructionDuration.value = cursorInstruction.duration;
        }

        this.fieldInstructionDelete.disabled = this.state.selectedIndices.length === 0;
        if (!this.fieldTrackerRowLength.value)
            this.fieldTrackerRowLength.setValue(this.song.getTimeDivision());
        // this.fieldTrackerRowLength.value = this.fieldTrackerRowLength.value; // this.song.getSongTimeDivision();
        if (!this.fieldInstructionDuration.value && this.fieldTrackerRowLength.value)
            this.fieldInstructionDuration.setValue(parseInt(this.fieldTrackerRowLength.value));


    }

}


export default ComposerRenderer
