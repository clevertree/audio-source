import React from "react";
import {Keyboard, LibraryProcessor, Song, SongValues} from "../song";

class ASComposerBase extends React.Component {
    constructor(props) {
        // console.log('ASComposerRenderer.constructor', props);
        super(props);
        this.state = {
            title: "Audio Source Composer",
            statusText: "[No Song Loaded]",
            statusType: 'log',
            version: require('../package.json').version,

            clipboard: null,

            portrait: true,
            fullscreen: !!this.props.fullscreen,
            // showPanelSong: true,
            // showPanelProgram: true,
            // showPanelInstruction: true,
            // showPanelTrack: true,
            // showPanelKeyboard: true,
            showTrackRowPositionInTicks: false,
            showTrackRowDurationInTicks: false,


            // Playback
            volume: Song.DEFAULT_VOLUME,
            playing: false,
            paused: false,

            // Song Information
            songUUID: null,
            songLength: 0,

            // Selected Component
            selectedComponent: ['track', 'root'],

            // Tracks
            activeTracks: {},
            // selectedIndices: [],
            selectedInstructionData: [0, 'C4'],


            // Track Playback
            playbackOnChange: true,
            playbackOnSelect: true,

            // Programs
            programStates: [],
            selectedProgramID: 0,

            // View Modes
            viewModes: {},
            // selectedViewKey: null,

            /** UI **/

            // Keyboard
            keyboardOctave: 4,


        };

        // this.globalState = {};

        this.cb = {
            songPlay: () => this.songPlay(),
            songPause: () => this.songPause(),
            songStop: () => this.songStop(),
            openSongFromFileDialog: this.openSongFromFileDialog.bind(this),
            saveSongToFile: this.saveSongToFile.bind(this),
            saveSongToMemory: this.saveSongToMemory.bind(this),
            onInput: e => this.onInput(e),
            onSongEventCallback: (e) => this.onSongEvent(e),
            global: {
                addLogEntry: (text, type) => this.setStatus(text, type),
                setViewMode: (viewKey, mode) => this.setViewMode(viewKey, mode),
                getViewMode: (viewKey) => this.getViewMode(viewKey),
                renderMenuViewOptions: (viewKey) => this.renderMenuViewOptions(viewKey),
                isPortraitMode: () => this.state.portrait
                // getGlobalKey: key => this.globalState.getKey(key),
                // setGlobalKey: (key,  value) => this.globalState.setKey(key,  value),
            },
        }
        this.ref = {
            container: React.createRef(),
            panelSong: React.createRef(),
            panelTrack: React.createRef(),
            activeTracks: [],
            activePrograms: [],
        }

        this.songStats = {
            position: 0
        }

        this.timeouts = {
            saveSongToMemory: null,
            saveState: null,
            renderPrograms: null
        };
        this.autoSaveTimeout = 4000;

        this.keyboard = new Keyboard();

        this.library = LibraryProcessor.loadDefault();
        // console.log('library', this.library, this.library.getLibraries(), this.library.getPresets());

        this.song = new Song();
        this.audioContext = null;
        this.lastVolumeGain = null;



        // setTimeout(async () => {
        //     const midiFilePath = require('../../assets/files/midi/amarbule.mid');
        //     const response = await fetch(midiFilePath);
        //     const midiFileBuffer = await response.arrayBuffer();
        //     console.log('midiFilePath', midiFilePath, midiFileBuffer);
        //     await this.loadSongFromBuffer(midiFileBuffer, 'test.mid');
        //
        // }, 1000);

    }

    /** @returns {object} **/
    // getGlobalState() {
    //     return this.globalState;
    // }
    // setGlobalState(globalState) {
    //     Object.apply(this.globalState, globalState);
    // }

    get values() { return new SongValues(this.song); }

    // async connectedCallback() {
    //     this.shadowDOM = this.attachShadow({mode: 'closed'});
    //
    //     super.connectedCallback(false);
    //
    //     this.focus();
    //
    //     this.forceUpdate();
    //     this.loadState();
    //
    //     this.loadMIDIInterface(e => this.onInput(e));        // TODO: wait for user input
    //
    // }

    componentDidMount() {
        this.loadState();

        this.loadMIDIInterface(this.cb.onInput);
        // TODO: get default library url from composer?
    }

    componentWillUnmount() {
        this.unloadMIDIInterface(this.cb.onInput);
    }


    /** TODO: Error Handling **/

    // static getDerivedStateFromError(error) {
    //     console.log('getDerivedStateFromError', error);
    //     this.setError(error);
    //     // Update state so the next render will show the fallback UI.
    //     return { hasError: false };
    // }
    // componentDidCatch(error, errorInfo) {
    //     console.log('componentDidCatch', error, errorInfo);
    //     this.setError(error);
    // }

    openMenuByKey(menuName) {
        this.ref.container.current.openMenuByKey(menuName);
    }


    /** Render WebView Proxy **/
    renderWebViewProxy() {
        return null;
    }

}


export default ASComposerBase
