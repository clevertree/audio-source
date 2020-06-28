import {
    Song,
    SongValues,
    Keyboard,
    Library}          from "../song";
import ASComposerInput from "./ASComposerInput";

export default class ASComposer extends ASComposerInput {
    constructor(props) {
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

            /** UI **/

            // Keyboard
            keyboardOctave: 4,


        };

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
        // console.log('library', this.library);

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
        super.componentDidMount();
        this.loadState();
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

            case 'instruction:start':
            case 'instruction:end':
                // console.log(e.type, e.playingIndices);
                if(this.trackHasActive(e.trackName)) {
                    this.trackUpdatePlayingIndices(e.trackName, e.playingIndices);
                }
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
                let updateCount = 0;
                const updateSongPositionInterval = setInterval(e => {
                    if (!this.song.isPlaying()) {
                        clearInterval(updateSongPositionInterval);
                        // this.fieldSongPlaybackPause.disabled = true;
                        this.setState({playing: false, paused: false});
                    }
                    this.updateSongPositionValue(this.song.getSongPlaybackPosition(), updateCount % 5 === 0);
                    updateCount++;
                }, 10);
                break;

            case 'song:pause':
                this.setState({paused: true});
                break;

            case 'song:end':
                this.setState({playing: false, paused: false});
                break;


            case 'song:modified':
                // console.log(e.type);
                this.forceUpdate();  // TODO: might be inefficient
                // TODO: auto save toggle
                this.saveSongToMemoryWithTimeout();
                break;


            default:
                console.warn("Unknown song event: ", e.type);

        }
    }


}
