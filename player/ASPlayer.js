import ASPlayerActions from "./ASPlayerActions";

import {Song, SongValues}          from "../song";
import Storage       from "../common/storage/Storage";

/**
 * ASPlayer requires a modern browser
 */

// const fs = new AudioSourceFileService();
// setTimeout(async e => {
//     const torrentID = "005ff6b3e47f34ad254b301481561d3145187467";
//     const torrent = await fs.getTorrent(torrentID);
//     console.log(torrent.files);
//     torrent.files[50].getBuffer(async function(err, buffer) {
//         if(err) throw new Error(err);
//         const files = await fs.decompress7ZipArchive(buffer);
//         console.log(files);
//     });
// }, 1000);

class ASPlayer extends ASPlayerActions {
    constructor(props=null) {
        super(props);
        this.state.playlist = {
            entries: [],
            position: 0
        };
        this.state.volume = Song.DEFAULT_VOLUME;
        this.state.songLength = 0;
        this.state.playlistActive = false;
        this.state.playing = false;
        this.state.paused = false;
        // this.state.position = 0;

        this.audioContext = null;
        this.volumeGain = null;
        this.song = null;
        // this.shadowDOM = null;
        // this.props.playlistActive = false;
        // this.props.playing = false;
        // this.props.paused = false;

        this.onResizeCallback = e => this.onResize(e);
    }

    // static getDefaultProps() {
    //     return {
    //         onPress: e => this.onInput(e),
    //         onPressIn: e => this.onInput(e),
    //         onPressOut: e => this.onInput(e)
    //     };
    // }

    // get isPlaylistActive()      { return this.state.playlistActive; }
    // set isPlaylistActive(value) { this.setStatus({playlistActive: value}); }
    // get isPlaying()             { return this.state.playing; }
    // set isPlaying(value)        { this.setStatus({playing: value}); }
    // get isPaused()              { return this.state.paused; }
    // set isPaused(value)         { this.setStatus({paused: value}); }

    get values() { return new SongValues(this.song); }

    componentDidMount(e) {
        const url = this.props.src || this.props.url;
        if(url)
            this.loadURLAsPlaylist(url);
        else
            this.loadState();

        if(window)
            window.addEventListener('resize', this.onResizeCallback);
        // this.onResize(e);
        // this.loadPackageInfo()
        //     .then(packageInfo => this.setVersion(packageInfo.version));
    }

    componentWillUnmount() {

        if(window)
            window.removeEventListener('resize', this.onResizeCallback);
        this.saveState();
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

    disconnectedCallback() {
        super.disconnectedCallback();
        // if(isBrowser)
            this.saveState();
            // window.addEventListener('unload', e => this.saveState(e));
    }

    async loadState() {

        const storage = new Storage();
        const state = await storage.loadState('audio-source-player-state');
        console.log('loadState', state);


        if (state) {
            this.setState(state);
        }
    }


    async saveState() {
        // await this.saveSongToMemory(e);
        const state = this.state;
        const storage = new Storage();
        await storage.saveState(state, 'audio-source-player-state');
        console.log('saveState', state);
    }



    /** Package Info **/

    // async loadPackageInfo(force=false) {
    //     const url = new URL('files/package.json', document.location); // , thisModule.src);
    //
    //     let packageInfo = this.packageInfo;
    //     if (!force && packageInfo)
    //         return packageInfo;
    //
    //     const response = await fetch(url);
    //     packageInfo = await response.json();
    //     if(!packageInfo.version)
    //         throw new Error("Invalid package version: " + url);
    //
    //     console.log("Package Version: ", packageInfo.version, packageInfo);
    //     this.packageInfo = packageInfo;
    //     return packageInfo;
    // }


    // Rendering
    // get statusElm() { return this.shadowDOM.querySelector(`asui-div[key=asp-status-container] asui-div[key=status-text]`); }
    // get versionElm() { return this.shadowDOM.querySelector(`asui-div[key=asp-status-container] asui-div[key=version-text]`); }


    // toggleFullscreen(e) {
    //     const setFullScreen = !this.classList.contains('fullscreen');
    //     this.containerElm.classList.toggle('fullscreen', setFullScreen);
    //     this.classList.toggle('fullscreen', setFullScreen);
    // }

    async onSongEvent(e) {
        // console.log(e.type, e);
        switch(e.type) {
            case 'log':
                this.setStatus(e.detail);
                break;

            case 'song:seek':
                this.updateSongPositionValue(e.detail.position);

                break;

            case 'song:volume':
                this.fieldSongVolume.value = e.detail.volume;
                break;

            case 'song:play':
                this.containerElm.classList.add('playing');
                if(e.playback) {
                    await e.playback.waitForPlaybackToEnd();
                    this.containerElm.classList.remove('playing');
                }

                this.setState({playing: true, paused: false});
                // this.fieldSongPlaybackPause.disabled = false;
                this.updateSongPositionMaxLength(this.song.getSongLengthInSeconds());
                const updateSongPositionInterval = setInterval(e => {
                    if (!this.song.isPlaying) {
                        clearInterval(updateSongPositionInterval);
                        // this.fieldSongPlaybackPause.disabled = true;
                        this.setState({playing: false, paused: false});
                        // this.containerElm.classList.remove('playing');
                        // this.classList.remove('playing');
                    }
                    this.updateSongPositionValue(this.song.getSongPlaybackPosition());
                }, 10);
                break;

            case 'song:pause':
                this.setState({paused: true});
                // this.containerElm.classList.remove('playing');
                break;
            case 'song:end':
                this.setState({playing: false, paused: false});
                // this.containerElm.classList.remove('playing');
                break;

            default:
                console.log("Unknown song event: ", e.type);
                break;
        }
    }


    // Input

    onInput(e) {
        if(e.defaultPrevented)
            return;
        switch(e.type) {
            case 'click':
                break;
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

            default:
                console.log("Unknown input event: ", e.type);
                break;
        }
    }

}
ASPlayer.DEFAULT_VOLUME = 0.3;


export default ASPlayer;
