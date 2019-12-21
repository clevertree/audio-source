{

    /** Required Modules **/
    if(typeof window !== "undefined")
        window.require = customElements.get('audio-source-loader').require;

    const {AudioSourceSong}             = require('../common/audio-source-song.js');
    const {AudioSourceStorage}          = require('../common/audio-source-storage.js');
    // const {AudioSourceUtilities} = require('../common/audio-source-utilities.js');
    const {
        AudioSourcePlayerRenderer,
        ASPPlaylistPlaylistEntry
    }                                   = require('../player/audio-source-player-renderer.js');

    class AudioSourcePlayerActions extends AudioSourcePlayerRenderer {
        constructor(props={}, state={}) {
            super(props, state);

            // this.activeSong = null;
            // this.nextPlaylistSong = null;
        }


        // getDefaultInstrumentURL() {
        //     return findThisScript()[0].basePath + 'instrument/audio-source-synthesizer.js';
        // }

        /** Song rendering **/

        async setCurrentSong(song) {
            if(this.song) {
                await this.setStatus("Unloading song: " + this.song.name);
                if(this.song.isPlaying) {
                    this.song.stopPlayback();
                }
                this.song.removeDispatchElement(this);
                // TODO: unload song?
            }
            this.song = song;
            this.state.songLength = song.getSongLengthInSeconds();
            // this.song.setVolume(this.state.volume);
            this.song.addDispatchElement(this);
            song.playlistPosition = this.playlist.getPlaylistPosition();
            const currentEntry = await this.playlist.getCurrentEntry();
            await currentEntry.setState({name: song.name, length: song.getSongLengthInSeconds()});
            await this.refs.panelSong.renderOS();
            await this.setStatus("Initializing song: " + song.name);
            await this.song.init(this.getAudioContext());
            await this.setStatus("Loaded song: " + song.name);
        }

        /** @deprecated **/
        handleError(err) {
            this.setStatus(`<span style="error">${err}</span>`);
            console.error(err);
            // if(this.webSocket)
        }

        async setStatus(newStatus) {
            console.info.apply(null, arguments); // (newStatus);
            if(newStatus.length > 64)
                newStatus = newStatus.substr(0, 64) + '...';
            await this.refs.textStatus.setContent(newStatus);
        }

        setVersion(versionString) {
            this.state.version = versionString;
            this.refs.textVersion.content = versionString;
        }


        closeAllMenus() {
            this.refs.menuFile.closeAllMenus();
        }


        /** Song loading **/

        saveSongToFile() {
            const songData = this.song.data;
            // const songHistory = this.song.history;
            const storage = new AudioSourceStorage();
            storage.saveSongToFile(songData);
            this.setStatus("Saved song to file");
        }


        /** Song commands **/



        /** Playback **/

        getAudioContext()               {
            if (this.audioContext)
                return this.audioContext;

            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.audioContext = audioContext;
            return audioContext;
        }

        getVolumeGain()                 {
            if (!this.volumeGain) {
                const context = this.getAudioContext();
                let gain = context.createGain();
                gain.gain.value = this.state.volume; // AudioSourceSong.DEFAULT_VOLUME;
                gain.connect(context.destination);
                this.volumeGain = gain;
            }
            return this.volumeGain; }

        getVolume () {
            if(this.volumeGain) {
                return this.volumeGain.gain.value;
            }
            return AudioSourcePlayerElement.DEFAULT_VOLUME;
        }
        setVolume (volume) {
            console.info("Setting volume: ", volume);
            const gain = this.getVolumeGain();
            if(gain.gain.value !== volume) {
                gain.gain.value = volume;
            }
            this.state.volume = volume;
            this.refs.fieldSongVolume.value = volume * 100;
        }


        async updateSongPositionMaxLength(maxSongLength) {
            await this.refs.fieldSongPosition.setState({max: Math.ceil(maxSongLength)});
        }

        updateSongPositionValue(playbackPositionInSeconds) {
            const roundedSeconds = Math.round(playbackPositionInSeconds);
            this.refs.fieldSongTiming.value = this.values.formatPlaybackPosition(playbackPositionInSeconds);
            if (this.refs.fieldSongPosition.value !== roundedSeconds)
                this.refs.fieldSongPosition.value = roundedSeconds;
        }


//         async loadSongFromMemory(songUUID) {
//             await this.song.loadSongFromMemory(songUUID);
//             // this.render();
//             this.setStatus("Song loaded from memory: " + songUUID, this.song);
// //         console.info(songData);
//         }
//
//         async loadSongFromFileInput(file=null) {
//             if(file === null)
//                 file = this.refs.fieldSongFileLoad.inputElm.files[0];
//             if (!file)
//                 throw new Error("Invalid file input");
//             await this.song.loadSongFromFileInput(file);
//             this.addSongFileToPlaylist(file, this.song.name, this.song.getSongLengthInSeconds());
//             // this.render();
//         }



        async loadSongFromURL(url) {
            const song = this.playerElm.song;
            if(this.isPlaylist(url)) {
                const playlistEntry = new ASPPlaylistPlaylistEntry({url    });
                this.addEntry(playlistEntry);
                await this.renderOS();
                // await this.loadPlaylistFromURL(url);
                // const entry = this.getCurrentEntry();
                // if(entry.url && !this.isPlaylist(entry.url))
                //     await this.loadSongFromPlaylistEntry(this.position);
            } else {
                await song.loadSongFromURL(url);
                await this.setStatus("Loaded from url: " + url);
//                 this.addSongURLToPlaylist(url, song.name, song.getSongLengthInSeconds());
            }
            // this.render();
        }

        async moveToNextSongPlaylistEntry() {

        }

        async loadSongFromPlaylistEntry() {
            const currentEntry = await this.playlist.getCurrentEntry();

            let song;
            if(currentEntry instanceof ASPPlaylistPlaylistEntry) {
                throw new Error("Implement")
            } else {
                if(currentEntry.file) {
                    this.setStatus("Loading playlist song from file: " + currentEntry.file.name);
                    song = await AudioSourceSong.loadSongFromFileInput(currentEntry.file);
                } else if(currentEntry.url) {
                    this.setStatus("Loading playlist song from url: " + currentEntry.url);
                    song = await AudioSourceSong.loadSongFromURL(currentEntry.url);
                }
            }
            return song;
            // this.setPositionEntry(currentEntry);

            // song.playlistPosition = this.position;
            // this.render();
        }
        // async loadSongFromPlaylistEntry(playlistPosition) {
        //     // this.setStatus("Loading from playlist: " + url);
        //     await this.playlist.loadSongFromURL(playlistPosition);
        // }

        /** Song Playlist **/

        // async loadPlaylistFromURL(playlistURL) {
        //     await this.playlist.loadSongFromURL(playlistURL);
        //     this.setStatus("Loaded playlist from url: " + playlistURL);
        // }

        async addSongURLToPlaylist(url, name=null, length=null) {
            await this.playlist.addSongURLToPlaylist(url, name, length);
            await this.setStatus("Added URL to playlist: " + url);
        }


        async addSongFileToPlaylist(file, name=null, length=null) {
            await this.playlist.addSongFileToPlaylist(file, name, length);
            await this.setStatus("Added file to playlist: " + file.name);
        }


        /** Song Playback **/

        // async songPlay() {
        //     if(this.playlistActive)
        //         throw new Error("Playback is already active");
        //     this.playlistActive = true;
        //     await this.song.play();
        //     await this.songNext(); // TODO: prevent async playback
        // }
        //
        // async songNext() {
        //     this.playlistActive = true;
        //     while(this.playlistActive) {
        //         const entry = await this.playlistMovePosition();
        //         (entry.scrollIntoViewIfNeeded || entry.scrollIntoView).apply(entry);
        //         const nextSong = await this.playlist.loadSongFromPlaylistEntry();
        //         this.setCurrentSong(nextSong);
        //         await this.song.play();
        //     }
        // }
        //
        // async songPause() {
        //     this.song.stopPlayback();
        // }

        // songStopIfPlaying() {
        //     if(this.playlistActive)
        //         this.songStop();
        // }


        setSongPosition(e, playbackPosition = null) {
            // const wasPlaying = !!this.song.playback;
            // if (wasPlaying)
            //     this.song.stopPlayback();
            const song = this.song;
            if (playbackPosition === null) {
                const values = new AudioSourceValues();
                playbackPosition = values.parsePlaybackPosition(this.refs.fieldSongPosition.value);
            }
            song.setPlaybackPosition(playbackPosition);
            // if (wasPlaying)
            //     this.song.play();
        }

        async clearPlaylist() {
            this.playlist.clear();
        }

        async playlistPlayTest() {
            let entry = await this.playlist.getCurrentEntry();
            while(entry) {
                (entry.scrollIntoViewIfNeeded || entry.scrollIntoView).apply(entry);
                await new Promise((resolve, reject) => {
                    setTimeout(resolve, 1000);
                });
                entry = await this.playlistMoveToNextSongEntry();
            }
        }

        /** Start or resume playback **/
        async playlistPlay() {
            this.playlistStop();
            let position = this.playlist.getPlaylistPosition();
            if(this.song && this.song.playlistPosition === position) {
                if(this.song.isPaused)
                    return this.song.resume();
                if(this.song.isPlaying)
                    throw new Error("Song is already playing");
                await this.setCurrentSong(this.song);
                await this.setStatus("Playing: " + this.song.name);
                return await this.song.play(this.getVolumeGain());
            }
            let entry = await this.playlist.getCurrentEntry();
            if(entry instanceof ASPPlaylistPlaylistEntry)
                entry = await this.playlistMoveToNextSongEntry();

            this.isPlaylistActive = true;
            let currentEntry = await this.playlist.getCurrentEntry();
            while(this.isPlaylistActive) {
                (currentEntry.scrollIntoViewIfNeeded || currentEntry.scrollIntoView).apply(currentEntry);
                const currentSong = await this.loadSongFromPlaylistEntry();
                await this.setCurrentSong(currentSong);
                await this.setStatus("Playing: " + currentSong.name);
                await currentSong.play(this.getVolumeGain());
                if(!this.isPlaylistActive)
                    break;
                currentEntry = await this.playlistMoveToNextSongEntry();
            }
        }

        async playlistStop() {
            this.isPlaylistActive = false;
            if(this.song && this.song.isPlaying) {
                await this.setStatus("Stopping: " + this.song.name);
                this.song.stopPlayback();
                this.song.setPlaybackPositionInTicks(0);
                await this.setStatus("Stopped: " + this.song.name);
            }
        }

        async playlistNext() {
            this.playlistStop();
            await this.playlistMoveToNextSongEntry();
            await this.playlistPlay();
        }

        async playlistMovePosition(position) {
            // let totalCount = await this.playlist.getPlaylistCount();
            const currentEntry = await this.playlist.getEntry(position);
            await currentEntry.removePosition();
            // console.log('offset', position, offset);
            // position+=offset;
            // if(position >= totalCount)
            //     position = 0;
            let nextEntry = await this.playlist.getEntry(position,false);
            if(!nextEntry) position = 0;
            return await this.playlist.setPlaylistPosition(position);
        }

        async playlistMoveToEntry(nextEntry) {
            const position = await this.playlist.getEntryPosition(nextEntry);
            return await this.playlistMovePosition(position);
        }

        async playlistMoveToNextSongEntry() {
            let position = this.playlist.getPlaylistPosition();
            const currentEntry = await this.playlist.getEntry(position);
            if(currentEntry instanceof ASPPlaylistPlaylistEntry)
                await currentEntry.togglePlaylist(true);

            let totalCount = await this.playlist.getPlaylistCount();
            for(let i=0; i<totalCount; i++) {
                position++;

                const currentEntry = await this.playlist.getEntry(position);
                if(currentEntry instanceof ASPPlaylistPlaylistEntry) {
                    await currentEntry.togglePlaylist(true);
                    totalCount = await this.playlist.getPlaylistCount();
                } else {
                    await this.playlistMovePosition(position);
                    return currentEntry;
                }
            }
            throw new Error("Song entry not found");
        }

        /** Toggle Panels **/

        togglePanelPlaylist(e) {
            this.classList.toggle('hide-panel-playlist');
        }

        togglePanelSong(e) {
            this.classList.toggle('hide-panel-song');
        }
        toggleFullscreen(e) {
            const setFullScreen = !this.classList.contains('fullscreen');
            // this.refs.containerElm.classList.toggle('fullscreen', setFullScreen);
            this.classList.toggle('fullscreen', setFullScreen);

            if (setFullScreen) {

            }
        }


    }


    /** Export this script **/
    const thisScriptPath = 'player/audio-source-player-actions.js';
    let thisModule = typeof document !== 'undefined' ? customElements.get('audio-source-loader').findScript(thisScriptPath) : module;
    thisModule.exports = {
        AudioSourcePlayerActions,
    };
}