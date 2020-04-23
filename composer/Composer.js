import {
    Song,
    SongValues,
    Storage,
    Keyboard,
    Library}          from "../song";
import ComposerActions from "./ComposerActions";

export default class Composer extends ComposerActions {
    constructor(props={}) {
        super(props);

        this.timeouts = {
            saveSongToMemory: null,
            renderPrograms: null
        };
        this.autoSaveTimeout = 4000;

        this.keyboard = new Keyboard();

        this.library = Library.loadDefault();
        console.log('library', this.library);

        this.song = new Song(this.getAudioContext());

        // this.onSongEvent = (e) => this.onSongEvent(e);
        window.addEventListener('unload', e => this.saveState(e));

        this.onResizeCallback = e => this.onResize(e);
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

        if(window)
            window.addEventListener('resize', this.onResizeCallback);
        this.onResize();
        // TODO: get default library url from composer?
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


    /** State **/

    loadState() {
        const storage = new Storage();
        const state = storage.loadState('audio-source-composer-state');
        console.log('Loading State: ', state);


        if (state) {
            if (typeof state.volume !== "undefined")
                this.setVolume(state.volume);
            delete state.volume;
            // if(state.songUUID)
            this.loadDefaultSong(state.songUUID);
            delete state.songUUID;
            this.setState(state);
            this.updateCurrentSong();
            // this.setCurrentSong(this.song); // Hack: resetting current song after setting state, bad idea

        } else {
            this.loadDefaultSong();
        }
    }


    saveState(e) {
        const storage = new Storage();
        storage.saveState(this.state, 'audio-source-composer-state');
        console.log('Saving State: ', this.state);
    }



    /** Input **/

    onInput(e) {
        // console.log(e.type);
        if (e.defaultPrevented)
            return;

        switch (e.type) {
            case 'focus':
                break;

            // case 'click':
            //     this.closeAllMenus(true);
            //     break;

            case 'dragover':
                e.stopPropagation();
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                break;

            case 'drop':
                e.stopPropagation();
                e.preventDefault();
                let files = e.dataTransfer.files; // Array of all files
                this.loadSongFromFileInput(files[0]);
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


    /** Song Events **/

    async onSongEvent(e) {
//         console.log("Song Event: ", e.type);
        switch (e.type) {
            case 'log':
                this.setStatus(e.detail);
                break;

            case 'song:seek':
                this.updateSongPositionValue(e.position);
                break;

            case 'song:volume':
                this.fieldSongVolume.value = e.detail.volume;
                break;

            case 'song:loaded':
                // this.trackerElm.renderDuration = this.song.data.timeDivision;
                break;

            case 'song:play':
                this.setState({playing: true});
                // this.fieldSongPlaybackPause.disabled = false;
                const updateSongPositionInterval = setInterval(e => {
                    if (!this.song.isPlaying()) {
                        clearInterval(updateSongPositionInterval);
                        // this.fieldSongPlaybackPause.disabled = true;
                        this.setState({playing: false, paused: false});
                    }
                    this.updateSongPositionValue(this.song.getSongPlaybackPosition());
                }, 10);
                break;

            case 'song:pause':
                this.setState({paused: true});
                break;

            case 'song:end':
                this.setState({playing: false, paused: false});
                break;

            case 'programs:instance':
            case 'programs:added':
            case 'programs:removed':
                this.panelPrograms && this.panelPrograms.forceUpdate();
                break;

            case 'programs:modified':
                this.panelPrograms && this.panelPrograms.forceUpdate();
                // this.renderProgram(e.detail.programID);

                clearTimeout(this.timeouts.saveSongToMemory);
                this.timeouts.saveSongToMemory = setTimeout(e => this.saveSongToMemory(e), this.autoSaveTimeout);
                break;

            case 'song:modified':
                // console.log(e.type);
                this.forceUpdate();  // TODO: might be inefficient
                // TODO: auto save toggle
                clearTimeout(this.timeouts.saveSongToMemory);
                this.timeouts.saveSongToMemory = setTimeout(e => this.saveSongToMemory(e), this.autoSaveTimeout);
                break;

            case 'programs:library':
//                 console.log(e.type);
                // TODO: this.programs.render();
                // this.renderPrograms();
                this.updateForms();
                break;

            default:
                console.warn("Unknown song event: ", e.type);

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
        }
    }


}
