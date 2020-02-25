import Values        from "../song/Values";
import Song          from "../song/Song";
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

        this.song = new Song();
        this.song.loadSongData({});
        // this.setCurrentSong(this.song);
        // this.values = new Values(this.song);
        // Util.loadLibrary(defaultLibraryURL);

        // this.onSongEvent = (e) => this.onSongEvent(e);
        window.addEventListener('unload', e => this.saveState(e));
        this.ui = {};
    }


    // get isPlaylistActive()      { return this.props.playlistActive; }
    // set isPlaylistActive(value) { this.setProps({playlistActive: value}); }
    // get isPlaying()             { return this.props.playing; }
    // set isPlaying(value)        { this.setProps({playing: value}); }
    // get isPaused()              { return this.props.paused; }
    // set isPaused(value)         { this.setProps({paused: value}); }

    get values() { return new Values(this.song); }

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
        //         'instrument:instance',
        //         'instrument:library',
        //         'instrument:modified',
        //         'instrument:added',
        //         'instrument:removed'],
        //     e => this.onSongEvent(e), document);

        this.focus();

        this.forceUpdate();
        this.loadState();

        this.loadMIDIInterface(e => this.onInput(e));        // TODO: wait for user input

    }

    componentDidMount() {
        this.loadState();
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
        console.log('loadState', state);


        if (state) {
            await this.loadDefaultSong(state.songUUID);
            if (typeof state.volume !== "undefined") this.setVolume(state.volume);
            // if (typeof state.trackerSegmentLength !== "undefined") await this.fieldTrackerSegmentLength.setValue(state.trackerSegmentLength);
            // if (typeof state.trackerRowLength !== "undefined") await this.fieldTrackerRowLength.setValue(state.trackerRowLength);
            // if (typeof state.trackerInstrument !== "undefined") await this.fieldTrackerFilterInstrument.setValue(state.trackerInstrument);
            // if (typeof state.trackerOctave !== "undefined") await this.fieldTrackerOctave.setValue(state.trackerOctave);

            // if (typeof state.groupName !== "undefined") await this.trackerChangeGroup(state.groupName);
            // if (typeof state.trackerRowOffset !== "undefined") await this.trackerChangeSegment(state.trackerRowOffset);

            // if (typeof state.selectedIndices !== "undefined") this.selectIndicies(state.selectedIndices);
            // this.trackerElm.render(); // TODO: too many renders
            console.log('todo load state');

        } else {
            await this.loadDefaultSong();
        }
    }


    async saveState(e) {
        // await this.saveSongToMemory(e);
        const state = {// TODO: auto-state form fields
            songUUID: this.song.getUUID(),
            // groupName: this.state.tracker.currentGroup,
            // currentRowSegmentID: this.trackerElm.currentRowSegmentID,
            volume: this.state.volume,
            // trackerSegmentLength: this.fieldTrackerSegmentLength.value,
            // trackerRowLength: this.fieldTrackerRowLength.value,
            // trackerInstrument: this.fieldTrackerFilterInstrument.value,
            // trackerOctave: this.fieldTrackerOctave.value,
            tracker: this.state.tracker
        };
        const storage = new Storage();
        storage.saveState(state, 'audio-source-composer-state');
        console.log('saveState', state);
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

        await this.loadNewSongData();


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
                // this.trackerElm.renderDuration = this.song.getTimeDivision();
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

            case 'instrument:instance':
            case 'instrument:added':
            case 'instrument:removed':
                this.panelInstruments && this.panelInstruments.forceUpdate();
                break;

            case 'instrument:modified':
                this.panelInstruments && this.panelInstruments.forceUpdate();
                // this.renderInstrument(e.detail.instrumentID);

                clearTimeout(this.timeouts.saveSongToMemory);
                this.timeouts.saveSongToMemory = setTimeout(e => this.saveSongToMemory(e), this.autoSaveTimeout);
                break;
            case 'song:modified':
                // TODO: auto save toggle
                clearTimeout(this.timeouts.saveSongToMemory);
                this.timeouts.saveSongToMemory = setTimeout(e => this.saveSongToMemory(e), this.autoSaveTimeout);
                break;
            case 'instrument:library':
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
