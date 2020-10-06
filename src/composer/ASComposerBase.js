import React from "react";
import {PresetLibrary, Song} from "../song";

class ASComposerBase extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            title: "Audio Source Composer",
            statusText: "[No Song Loaded]",
            statusType: 'log',
            version: require('../../package.json').version,

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
            showModal: null,

            // User Session
            session: {loggedIn: false},

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
            selectedInstructionData: [0, 'C4', 96],


            // Track Playback
            playbackOnChange: true,
            playbackOnSelect: true,

            // Programs
            programStates: [],

            // View Modes
            viewModes: {
                "panel:session": "none"
            },
            // selectedViewKey: null,

            /** UI **/

            // Keyboard
            keyboardOctave: 4,
        };
        // if(this.props.fullscreen)
        //     this.state.fullscreen = true;

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
            renderRootMenu: () => this.renderRootMenu(this.ref.menu)
        }
        this.ref = {
            container: React.createRef(),
            // menuContextContainer: React.createRef(),
            panelSong: React.createRef(),
            panelTrack: React.createRef(),
            panelProgram: React.createRef(),
            panelSession: React.createRef(),
            activeTracks: [],
            activePrograms: [],
            menu: {
                contextContainer: React.createRef(),
                file: React.createRef(),
                edit: React.createRef(),
                track: React.createRef(),
                program: React.createRef(),
                view: React.createRef(),
                options: React.createRef(),
                server: React.createRef(),
                           // playback: React.createRef(),
            }
        }

        this.songStats = {
            position: 0
        }

        this.timeouts = {
            saveSongToMemory: null,
            saveState: null,
            renderPrograms: null,
            render: null
        };
        this.autoSaveTimeout = 4000;

        // this.keyboard = new Keyboard();

        this.library = PresetLibrary.loadDefault();
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

    // get values() { return new SongValues(this.song); }

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

        this.loadMIDIInterface(this.cb.onInput);

        // if(this.props.location && this.props.location.hash) {
        //     let hashString = null;
        //     hashString = this.props.location.hash || '';
        //     const hashSplit = hashString.substr(1).split('&');
        //     for (let i = 0; i < hashSplit.length; i++) {
        //         let pair = hashSplit[i].split('=');
        //         const param = decodeURIComponent(pair[0]);
        //         params[param] = decodeURIComponent(pair[1]);
        //     }
        //     console.log('hash', params, hashString, hashSplit);
        // }
        const songURL = this.props.url || this.props.src;
        if(songURL) {
            this.loadSongFromURL(songURL);
        } else if(!this.props.skipAutoLoadSong) {
            this.loadState();
        }

        // TODO: get default library url from composer?
        this.sessionRefresh();
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

}


export default ASComposerBase
