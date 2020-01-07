{
    const isRN = typeof document === 'undefined';

    /** Required Modules **/
    if(isRN) {
        window.customElements = require('../../app/support/customElements.js').default;
        // console.log(ASUIComponentBase);
    } else {
        window.require = customElements.get('audio-source-loader').require;
    }


    const {AudioSourcePlayerActions} = require('../player/audio-source-player-actions.js');
    const {AudioSourceValues} = require('../common/audio-source-values.js');
    // const {AudioSourceFileService} = require('../common/audio-source-file-service.js');
    const {AudioSourceUtilities} = require('../common/audio-source-utilities.js');
    const {AudioSourceSong} = require('../common/audio-source-song.js');
    const {AudioSourceStorage} = require('../common/audio-source-storage.js');
    /**
     * Player requires a modern browser
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

    class AudioSourcePlayerElement extends AudioSourcePlayerActions {
        constructor(props=null) {
            super(props, {
                playlist: {
                    entries: []
                },
                volume: AudioSourceSong.DEFAULT_VOLUME,
                version: -1,
                songLength: 0,

                playlistActive: false,
                playing: false,
                paused: false,

                fullscreen: false,
                showPanelSong: true,
                showPanelPlaylist: true,
            });

            this.audioContext = null;
            this.volumeGain = null;
            this.song = null;
            // this.props.playlistActive = false;
            // this.props.playing = false;
            // this.props.paused = false;

        }

        // static getDefaultProps() {
        //     return {
        //         onPress: e => this.onInput(e),
        //         onPressIn: e => this.onInput(e),
        //         onPressOut: e => this.onInput(e)
        //     };
        // }

        get isPlaylistActive()      { return this.state.playlistActive; }
        set isPlaylistActive(value) { this.setStatus({playlistActive: value}); }
        get isPlaying()             { return this.state.playing; }
        set isPlaying(value)        { this.setStatus({playing: value}); }
        get isPaused()              { return this.state.paused; }
        set isPaused(value)         { this.setStatus({paused: value}); }

        get values() { return new AudioSourceValues(this.song); }



        connectedCallback() {
            this.shadowDOM = this.attachShadow({mode: 'closed'});


            // this.addEventHandler([ // TODO: listen directly to song emitter
            //     'song:loaded','song:play','song:end','song:stop','song:modified', 'song:seek',
            //     'group:play', 'group:seek',
            //     'note:start', 'note:end',
            //     'log'
            // ], this.onSongEvent);
            // document.addEventListener('instrument:loaded', e => this.onSongEvent(e));

            // this.addEventHandler(['keyup', 'keydown', 'click', 'dragover', 'drop'], e => this.onInput(e), this.shadowDOM, true);

            // this.loadCSS();
            // Render (with promise)
            super.connectedCallback();

            const url = this.getAttribute('src') || this.getAttribute('url');
            if(url)
                this.addSongURLToPlaylist(url);
            else
                this.loadState();

            const Util = new AudioSourceUtilities;
            Util.loadPackageInfo()
                .then(packageInfo => this.setVersion(packageInfo.version));
        }

        disconnectedCallback() {
            super.disconnectedCallback();
            if(!isRN)
                this.saveState(e); // TODO: save state on state change, not page unload
                // window.addEventListener('unload', e => this.saveState(e));
        }

        loadState() {

            const storage = new AudioSourceStorage();
            const state = storage.loadState('audio-source-player-state');
            console.log('loadState', state);


            if (state) {
                this.setState(state);
            }
        }


        async saveState() {
            // await this.saveSongToMemory(e);
            const state = this.state;
            const storage = new AudioSourceStorage();
            storage.saveState(state, 'audio-source-player-state');
            console.log('saveState', state);
        }



        // Rendering
        // get statusElm() { return this.shadowDOM.querySelector(`asui-div[key=asp-status-container] asui-div[key=status-text]`); }
        // get versionElm() { return this.shadowDOM.querySelector(`asui-div[key=asp-status-container] asui-div[key=version-text]`); }


        toggleFullscreen(e) {
            const setFullScreen = !this.classList.contains('fullscreen');
            this.containerElm.classList.toggle('fullscreen', setFullScreen);
            this.classList.toggle('fullscreen', setFullScreen);
        }

        async onSongEvent(e) {
            // console.log(e.type, e);
            switch(e.type) {
                case 'log':
                    await this.setStatus(e.detail);
                    break;

                case 'song:seek':
                    this.updateSongPositionValue(e.detail.position);

                    break;

                case 'song:volume':
                    this.fieldSongVolume.value = e.detail.volume;
                    break;

                case 'song:play':
                    this.containerElm.classList.add('playing');
                    if(e.detail.promise) {
                        await e.detail.promise;
                        this.containerElm.classList.remove('playing');
                    }

                    this.fieldSongPlaybackPause.disabled = false;
                    this.updateSongPositionMaxLength(this.song.getSongLengthInSeconds());
                    const updateSongPositionInterval = setInterval(e => {
                        if (!this.song.isPlaying) {
                            clearInterval(updateSongPositionInterval);
                            this.fieldSongPlaybackPause.disabled = true;
                            this.containerElm.classList.remove('playing');
                            this.classList.remove('playing');
                        }
                        this.updateSongPositionValue(this.song.songPlaybackPosition);
                    }, 10);
                    break;

                case 'song:end':
                case 'song:pause':
                    this.containerElm.classList.remove('playing');
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
            }
        }

    }
    AudioSourcePlayerElement.DEFAULT_VOLUME = 0.3;

    // Define custom elements
    customElements.define('audio-source-player', AudioSourcePlayerElement);

    // MusicPlayerElement.loadStylesheet('client/player/audio-source-player.css');



    /** Export this script **/
    const thisScriptPath = 'player/audio-source-player.js';
    let thisModule = isRN ? module : customElements.get('audio-source-loader').findScript(thisScriptPath);
    thisModule.exports = {
        AudioSourcePlayerElement,
    };


}