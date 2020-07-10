import React from "react";
import {Keyboard, Library, Song, SongValues} from "../song";

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
            showPanelSong: true,
            showPanelProgram: true,
            showPanelInstruction: true,
            showPanelTrack: true,
            showPanelKeyboard: true,
            showPanelPresetBrowser: true,
            showTrackRowPositionInTicks: false,
            showTrackRowDurationInTicks: false,


            // Playback
            volume: Song.DEFAULT_VOLUME,
            playing: false,
            paused: false,

            // Song Information
            songUUID: null,
            songLength: 0,

            // Tracks
            activeTracks: {},
            selectedTrack: 'root',

            // Track Playback
            playbackOnChange: true,
            playbackOnSelect: true,

            // Track instruction selection
            selectedTrackIndices: [],
            selectedInstructionData: [0, 'C4', '1B'],

            // Programs
            programStates: [],
            selectedProgramID: 0,

            /** UI **/

            // Keyboard
            keyboardOctave: 4,


        };

        this.cb = {
            songPlay: () => this.songPlay(),
            songPause: () => this.songPause(),
            songStop: () => this.songStop(),
            loadSongFromFileInput: this.loadSongFromFileInput.bind(this),
            saveSongToFile: this.saveSongToFile.bind(this),
        }
        this.ref = {
            container: React.createRef(),
            panelSong: React.createRef(),
            activeTracks: {}
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

        this.library = Library.loadDefault();
        // console.log('library', this.library, this.library.getLibraries(), this.library.getPresets());

        this.song = new Song();
        this.audioContext = null;
        this.lastVolumeGain = null;

        this.onSongEventCallback = (e) => this.onSongEvent(e);
    }


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
        // TODO: get default library url from composer?
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
