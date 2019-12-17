(async function() {

    /** Register Script Exports **/
    function getThisScriptPath() { return 'player/audio-source-player-actions.js'; }
    const exportThisScript = function(module) {
        module.exports = {AudioSourcePlayerActions};
    };

    /** Register This Async Module **/
    const resolveExports = registerAsyncModule();


    // const {ASUIComponent} = await requireAsync('common/audio-source-ui.js');
    const {AudioSourceSong} = await requireAsync('common/audio-source-song.js');
    const {AudioSourceStorage} = await requireAsync('common/audio-source-storage.js');
    // const {AudioSourceUtilities} = await requireAsync('common/audio-source-utilities.js');
    const {
        AudioSourcePlayerRenderer,
        ASPPlaylistPlaylistEntry
    } = await requireAsync('player/audio-source-player-renderer.js');

    class AudioSourcePlayerActions extends AudioSourcePlayerRenderer {
        constructor(state={}, props={}) {
            super(state, props);

            // this.activeSong = null;
            // this.nextPlaylistSong = null;
        }


        // getDefaultInstrumentURL() {
        //     return findThisScript()[0].basePath + 'instrument/audio-source-synthesizer.js';
        // }

        /** Song rendering **/

        async setCurrentSong(song) {
            if(this.song) {
                if(this.song.isPlaying) {
                    this.song.stopPlayback();
                }
                this.song.removeDispatchElement(this);
                // TODO: unload song?
            }
            this.song = song;
            this.state.songLength = song.getSongLengthInSeconds();
            this.song.setVolume(this.state.volume);
            this.song.addDispatchElement(this);
            song.playlistPosition = this.playlist.getPlaylistPosition();
            const currentEntry = await this.playlist.getCurrentEntry();
            await currentEntry.setState({name: song.name, length: song.getSongLengthInSeconds()});
            await this.refs.panelSong.renderOS();
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

        setSongVolume(e, newSongVolume) {
            this.state.volume = newSongVolume;
            this.refs.fieldSongVolume.value = newSongVolume;
            if(this.song)
                this.song.setVolume(newSongVolume);
            // this.setStatus(`Volume modified: ${newSongVolume}`);
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
                this.setStatus("Loaded from url: " + url);
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
                throw new Error("I")

            } else {
                if(currentEntry.file) {
                    song = await AudioSourceSong.loadSongFromFileInput(currentEntry.file);
                } else if(currentEntry.url) {
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
            this.setStatus("Added URL to playlist: " + url);
        }


        async addSongFileToPlaylist(file, name=null, length=null) {
            await this.playlist.addSongFileToPlaylist(file, name, length);
            this.setStatus("Added file to playlist: " + file.name);
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
                if(this.song.isPaused())
                    return this.song.resume();
                if(this.song.isPlaying)
                    throw new Error("Song is already playing");
                return await this.song.play();
            }
            let entry = await this.playlist.getCurrentEntry();
            if(entry instanceof ASPPlaylistPlaylistEntry)
                entry = await this.playlistMoveToNextSongEntry();

            this.isPlaylistActive = true;
            let currentEntry = await this.playlist.getCurrentEntry();
            while(this.isPlaylistActive) {
                (currentEntry.scrollIntoViewIfNeeded || currentEntry.scrollIntoView).apply(currentEntry);
                const currentSong = await this.loadSongFromPlaylistEntry();
                this.setCurrentSong(currentSong);
                this.isPlaying = true;
                await currentSong.play();
                this.isPlaying = false;
                currentEntry = await this.playlistMoveToNextSongEntry();
            }
        }

        playlistStop() {
            if(this.song && this.song.isPlaying) {
                this.song.stopPlayback();
                this.song.setPlaybackPositionInTicks(0);
            }
            this.isPlaylistActive = false;
            this.isPlaying = false;
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
    registerModule(exportThisScript);

    /** Finish Registering Async Module **/
    resolveExports();



    /** Module Loader Methods **/
    function registerAsyncModule() {
        let resolve;
        const promise = new Promise((r) => resolve = r);
        registerModule(module => {
            module.promises = (module.promises || []).concat(promise);
        });
        return resolve;
    }
    function registerModule(callback) {
        if(typeof window === 'undefined')
            callback(module);
        else findThisScript()
            .forEach(scriptElm => callback(scriptElm))
    }

    function findThisScript() {
        return findScript(getThisScriptPath());
    }

    function findScript(scriptURL) {
        let scriptElms = document.head.querySelectorAll(`script[src$="${scriptURL}"]`);
        scriptElms.forEach(scriptElm => {
            scriptElm.relativePath = scriptURL;
            scriptElm.basePath = scriptElm.src.replace(document.location.origin, '').replace(scriptURL, '');
        });
        return scriptElms;
    }

    async function requireAsync(relativeScriptPath) {
        if(typeof require !== "undefined")
            return require('../' + relativeScriptPath);

        let scriptElm = findScript(relativeScriptPath)[0];
        if(!scriptElm) {
            const scriptURL = findThisScript()[0].basePath + relativeScriptPath;
            scriptElm = document.createElement('script');
            scriptElm.src = scriptURL;
            scriptElm.promises = (scriptElm.promises || []).concat(new Promise(async (resolve, reject) => {
                scriptElm.onload = resolve;
                document.head.appendChild(scriptElm);
            }));
        }
        for (let i=0; i<scriptElm.promises.length; i++)
            await scriptElm.promises[i];
        return scriptElm.exports
            || (() => { throw new Error("Script module has no exports: " + relativeScriptPath); })()
    }


})();