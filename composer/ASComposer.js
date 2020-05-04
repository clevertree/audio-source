import {
    Song,
    SongValues,
    Storage,
    Keyboard,
    Library}          from "../song";
import ActiveTrackState from "./track/state/ActiveTrackState";
import ASComposerInput from "./ASComposerInput";

export default class ASComposer extends ASComposerInput {
    constructor(props={}) {
        super(props);
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
            // songLengthTicks: 0,
            songLength: 0,
            songPosition: 0,

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

        this.timeouts = {
            saveSongToMemory: null,
            renderPrograms: null
        };
        this.autoSaveTimeout = 4000;

        this.keyboard = new Keyboard();

        this.library = Library.loadDefault();
        console.log('library', this.library);

        this.song = new Song();

        // this.onSongEvent = (e) => this.onSongEvent(e);

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
        super.componentDidMount();
        this.loadState();
        this.onResize();
        // TODO: get default library url from composer?
    }


    /** Song Events **/

    async onSongEvent(e) {
        // console.log("Song Event: ", e.type);
        switch (e.type) {
            case 'log':
                this.setStatus(e.detail);
                break;

            case 'track:start':
            case 'track:end':
                break;

            case 'instruction:play':
            case 'instruction:stop':
                // console.log(e.type, e.playingIndices);
                const trackState = new ActiveTrackState(this, e.trackStats.trackName);
                await trackState.update(state => {
                    state.playingIndices = e.playingIndices;
                })
                // this.forceUpdate();
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
