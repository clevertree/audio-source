import {Song, SongValues}          from "../song";
import Storage       from "../song/Storage";

import ComposerActions from "./ComposerActions";
import Keyboard from "../song/Keyboard"
import Library from "../song/Library"

class Composer extends ComposerActions {
    constructor(props={}) {
        super(props);

        // this.versionString = '-1';
        // this.eventHandlers = [];
        this.timeouts = {
            saveSongToMemory: null,
            renderInstruments: null
        };
        // this.instrumentLibrary = null;

        this.longPressTimeout = null;
        this.doubleClickTimeout = 500;
        this.autoSaveTimeout = 4000;

        this.keyboard = new Keyboard();

        // this.song = new Song({}, this);
        // this.player = null;
        // this.status = {
        //     groupHistory: [],
        //     // previewInstructionsOnSelect: false,
        //     longPressTimeout: 500,
        //     doubleClickTimeout: 500,
        //     autoSaveTimeout: 4000,
        // };
        // this.trackerElm = new AudioSourceComposerTracker(this);
        this.library = new Library(require('../default.library')); // TODO: get default library url from composer?

        this.song = new Song(this.getAudioContext());
        this.song.loadSongData({});
        // this.setCurrentSong(this.song);
        // this.values = new SongValues(this.song);
        // Util.loadLibrary(defaultLibraryURL);

        // this.onSongEvent = (e) => this.onSongEvent(e);
        window.addEventListener('unload', e => this.saveState(e));

        this.onResizeCallback = e => this.onResize(e);
    }


    // get isPlaylistActive()      { return this.props.playlistActive; }
    // set isPlaylistActive(value) { this.setProps({playlistActive: value}); }
    // get isPlaying()             { return this.props.playing; }
    // set isPlaying(value)        { this.setProps({playing: value}); }
    // get isPaused()              { return this.props.paused; }
    // set isPaused(value)         { this.setProps({paused: value}); }

    get values() { return new SongValues(this.song); }

    async connectedCallback() {
        this.shadowDOM = this.attachShadow({mode: 'closed'});

        // this.loadCSS();
        super.connectedCallback(false);

        // this.addEventHandler(['dragover', 'drop'], e => this.onInput(e), this.shadowDOM, true);
        // this.addEventHandler(['focus', 'click'], e => this.onInput(e), this.shadowDOM);
        // 'change', 'submit',

        // this.addEventHandler([
        //     'song:loaded', 'song:play', 'song:end', 'song:stop', 'song:modified', 'song:seek',
        //     'group:play', 'group:seek',
        //     'note:start', 'note:end',
        //     'log'
        // ], this.onSongEvent);
        // this.addEventHandler([
        //         'instruments:instance',
        //         'instruments:library',
        //         'instruments:modified',
        //         'instruments:added',
        //         'instruments:removed'],
        //     e => this.onSongEvent(e), document);

        this.focus();

        this.forceUpdate();
        this.loadState();

        this.loadMIDIInterface(e => this.onInput(e));        // TODO: wait for user input

    }
    componentDidMount() {
        // const url = this.props.src || this.props.url;
        // if(url)
        //     this.loadURLAsPlaylist(url);
        // else
            this.loadState();

        if(window)
            window.addEventListener('resize', this.onResizeCallback);
        this.onResize();
        // this.loadPackageInfo()
        //     .then(packageInfo => this.setVersion(packageInfo.version));
    }

    componentWillUnmount() {

        if(window)
            window.removeEventListener('resize', this.onResizeCallback);
    }

    /** Portrait Mode **/

    onResize() {
        const aspectRatio = window.innerWidth / window.innerHeight;
        const portrait = aspectRatio < 14/16;
        if(!this.state.portrait === portrait) {
            console.log("Setting portrait mode to ", portrait, ". Aspect ratio: ", aspectRatio);
            this.setState({portrait});
        }
    }

    // get trackerElm() { return this.shadowDOM.querySelector('asc-tracker'); }
    // get containerElm() { return this.shadowDOM.querySelector('.asc-container'); }

    get defaultLibraryURL() {
        return this.getAttribute('defaultLibraryURL') || new URL('../default.library.json', document.location);
    }

    set defaultLibraryURL(url) {
        this.setAttribute('defaultLibraryURL', url);
    }


    async loadState(e = null) {
        const storage = new Storage();
        const state = storage.loadState('audio-source-composer-state');
        console.log('Loading State: ', state);


        if (state) {
            await this.loadDefaultSong(state.songUUID);
            if (typeof state.volume !== "undefined")
                this.setVolume(state.volume);
            this.setState(state);

        } else {
            await this.loadDefaultSong();
        }
    }


    saveState(e) {
        // await this.saveSongToMemory(e);
        const storage = new Storage();
        storage.saveState(this.state, 'audio-source-composer-state');
        console.log('Saving State: ', this.state);
    }


    async loadDefaultSong(recentSongUUID = null) {

        const src = this.props.src || this.props.url;
        if (src) {
            await this.loadSongFromURL(src);
            return true;
        }


        if (recentSongUUID) {
            try {
                await this.loadSongFromMemory(recentSongUUID);
                return;
            } catch (e) {
                console.error(e);
                this.setError("Error: " + e.message)
            }
        }

        this.loadNewSongData();


        // if(await this.loadRecentSongData())
        //     return true;

        return false;
    }


    // Input

    onInput(e) {
        console.log(e.type);
        if (e.defaultPrevented)
            return;

        // switch (e.type) {
        //     case 'focus':
        //         break;
        //     default:
        //         this.song.getAudioContext();
        // }

        switch (e.type) {
            case 'focus':
                break;

            case 'click':
                this.closeAllMenus(true);
                break;
            //     const divElmFormElm = e.path[0].closest('asui-div');
            //     if(divElmFormElm) {
            //         divElmFormElm.getRootNode().querySelectorAll('asui-div.focus')
            //             .forEach(formElm => formElm.classList.remove('focus'));
            //         divElmFormElm.classList.add('focus');
            //     }
            //     break;

            case 'dragover':
                e.stopPropagation();
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                break;
            case 'drop':
                e.stopPropagation();
                e.preventDefault();
                var files = e.dataTransfer.files; // Array of all files
                this.loadSongFromFileInput(files[0]);
                console.log(files);
                break;

            case 'midimessage':
                // console.log("MIDI", e.data, e);
                switch (e.data[0]) {
                    case 144:   // Note On
                        // TODO: refactor
                        e.preventDefault();
                        throw new Error("TODO: Implement");
                        // const midiImport = new MIDIImport();
                        // let newMIDICommand = midiImport.getCommandFromMIDINote(e.data[1]);
                        // let newMIDIVelocity = Math.round((e.data[2] / 128) * 100);
                        // console.log("MIDI ", newMIDICommand, newMIDIVelocity);

                        // this.instructionInsertOrUpdate(e, newMIDICommand);
                        // this.playSelectedInstructions(e);
                        // this.focus();
                    case 128:   // Note Off
                        // TODO: turn off playing note, optionally set duration of note
                        break;

                    default:
                        break;
                }
                break;

            default:
                throw new Error("Unhandled type: " + e.type);
        }

    }

//     async onSongEvent(e) {
// //         console.log("onSongEvent", e.type);
//         switch (e.type) {
//
//             case 'song:seek':
//                 this.setPlaybackPositionInTicks(e.detail.positionInTicks);
//                 break;
//
//             case 'group:seek':
// //                 console.log(e.type, e.detail);
//                 if (e.detail.trackName === this.getTrackName())
//                     this.setPlaybackPositionInTicks(e.detail.positionInTicks);
//
//                 break;
//
//             case 'group:play':
//                 break;
//
//             case 'note:start':
//                 if (e.detail.trackName === this.getTrackName()) {
//                     let instructionElm = this.findInstructionElement(e.detail.instruction.index);
//                     if (instructionElm) {
//                         instructionElm.classList.add('playing');
//                     }
//                 }
//                 break;
//             case 'note:end':
//                 if (e.detail.trackName === this.getTrackName()) {
//                     let instructionElm = this.findInstructionElement(e.detail.instruction.index);
//                     if (instructionElm) {
//                         instructionElm.classList.remove('playing');
//                     }
//                 }
//                 break;
//
//             default:
//                 console.warn("Unknown song event: ", e.type);
//         }
//     }

    async onSongEvent(e) {
        console.log("Song Event: ", e.type);
        switch (e.type) {
            case 'log':
                this.setStatus(e.detail);
                break;
            case 'song:seek':
                this.updateSongPositionValue(e.detail.position);

                break;

            case 'song:volume':
                this.fieldSongVolume.value = e.detail.volume;
                break;

            case 'song:loaded':
                // this.trackerElm.renderDuration = this.song.data.timeDivision;
                break;
            case 'song:play':
                this.setProps({playing: true});
                this.fieldSongPlaybackPause.disabled = false;
                const updateSongPositionInterval = setInterval(e => {
                    if (!this.song.isPlaying) {
                        clearInterval(updateSongPositionInterval);
                        this.fieldSongPlaybackPause.disabled = true;
                        this.setProps({playing: false, paused: false});
                    }
                    this.updateSongPositionValue(this.song.songPlaybackPosition);
                }, 10);
                break;

            case 'song:pause':
                this.setProps({paused: true});
                break;
            case 'song:end':
                this.setProps({playing: false, paused: false});
                break;

            case 'instruments:instance':
            case 'instruments:added':
            case 'instruments:removed':
                this.panelInstruments && this.panelInstruments.forceUpdate();
                break;

            case 'instruments:modified':
                this.panelInstruments && this.panelInstruments.forceUpdate();
                // this.renderInstrument(e.detail.instrumentID);

                clearTimeout(this.timeouts.saveSongToMemory);
                this.timeouts.saveSongToMemory = setTimeout(e => this.saveSongToMemory(e), this.autoSaveTimeout);
                break;
            case 'song:modified':
                this.forceUpdate();
                // TODO: auto save toggle
                clearTimeout(this.timeouts.saveSongToMemory);
                this.timeouts.saveSongToMemory = setTimeout(e => this.saveSongToMemory(e), this.autoSaveTimeout);
                break;
            case 'instruments:library':
//                 console.log(e.type);
                // TODO: this.instruments.render();
                // this.renderInstruments();
                this.updateForms();
                break;

            default:
                console.warn("Unknown song event: ", e.type);
        }
    }

    closeAllMenus() {
        this.shadowDOM.querySelector(`asui-menu`)
            .closeAllMenus();
    }


    /** Load External CSS **/
    // loadCSS() {
    //     const CSS_PATH = 'composer/assets/audio-source-composer.css';
    //     const targetDOM = this.shadowDOM || document.head;
    //     if (targetDOM.querySelector(`link[href$="${CSS_PATH}"]`))
    //         return;
    //
    //     const Util = new AudioSourceUtilities();
    //     const linkHRef = Util.getScriptDirectory(CSS_PATH);
    //     let cssLink = document.createElement("link");
    //     cssLink.setAttribute("rel", "stylesheet");
    //     cssLink.setAttribute("type", "text/css");
    //     cssLink.setAttribute("href", linkHRef);
    //     targetDOM.appendChild(cssLink);
    // }

}


export default Composer
