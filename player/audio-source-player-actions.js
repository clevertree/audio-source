(async function() {

    /** Register Script Exports **/
    function getThisScriptPath() { return 'player/audio-source-player-actions.js'; }
    const exportThisScript = function(module) {
        module.exports = {AudioSourcePlayerActions};
    };

    /** Register This Async Module **/
    const resolveExports = registerAsyncModule();


    // const {ASUIComponent} = await requireAsync('common/audio-source-ui.js');
    // const {AudioSourceStorage} = await requireAsync('common/audio-source-storage.js');
    // const {AudioSourceUtilities} = await requireAsync('common/audio-source-utilities.js');
    const {AudioSourcePlayerRenderer} = await requireAsync('player/audio-source-player-renderer.js');

    class AudioSourcePlayerActions extends AudioSourcePlayerRenderer {
        constructor(state={}, props={}) {
            super(state, props);

            // this.activeSong = null;
            // this.nextPlaylistSong = null;
        }


        // getDefaultInstrumentURL() {
        //     return findThisScript()[0].basePath + 'instrument/audio-source-synthesizer.js';
        // }


        /** Song Commands **/

        setSongVolume(e, newSongVolume) {
            this.song.setVolume(newSongVolume);
            this.refs.fieldSongVolume.value = newSongVolume;
            // this.setStatus(`Volume modified: ${newSongVolume}`);
        }


        async loadSongFromMemory(songUUID) {
            await this.song.loadSongFromMemory(songUUID);
            // this.render();
            this.setStatus("Song loaded from memory: " + songUUID, this.song);
//         console.info(songData);
        }

        async loadSongFromFileInput(file=null) {
            if(file === null)
                file = this.refs.fieldSongFileLoad.inputElm.files[0];
            if (!file)
                throw new Error("Invalid file input");
            await this.song.loadSongFromFileInput(file);
            this.addSongFileToPlaylist(file, this.song.name, this.song.getSongLength());
            // this.render();
        }


        async loadSongFromURL(url) {
            await this.playlist.loadSongFromURL(url);
            // this.render();
            this.setStatus("Loaded from url: " + url);
        }

        // async loadSongFromPlaylistEntry(playlistPosition) {
        //     // this.setStatus("Loading from playlist: " + url);
        //     await this.playlist.loadSongFromURL(playlistPosition);
        // }

        /** Song Playlist **/

        async loadPlaylistFromURL(playlistURL) {
            await this.playlist.loadSongFromURL(playlistURL);
            this.setStatus("Loaded playlist from url: " + playlistURL);
        }

        async addSongURLToPlaylist(url, name=null, length=null) {
            // this.setStatus("Loading playlist from url: " + playlistURL);
            await this.playlist.loadSongFromURL(url, name, length);
        }

        async addSongFileToPlaylist(file, name=null, length=null) {
            return await this.playlist.loadSongFromURL(file, name, length);
        }


        /** Song Playback **/


        async songPlay() {
            await this.song.play();
        }

        async songPause() {
            this.song.stopPlayback();
        }

        async songStop() {
            this.playlistActive = false;
            if(this.song.playback)
                this.song.stopPlayback();
            this.song.setPlaybackPositionInTicks(0);
        }

        setSongPosition(e, playbackPosition = null) {
            const wasPlaying = !!this.song.playback;
            if (wasPlaying)
                this.song.stopPlayback();
            const song = this.song;
            if (playbackPosition === null) {
                const values = new AudioSourceValues();
                playbackPosition = values.parsePlaybackPosition(this.refs.fieldSongPosition.value);
            }
            song.setPlaybackPosition(playbackPosition);
            if (wasPlaying)
                this.song.play();
        }

        async playlistPlay() {
            this.playlistActive = true;
            await this.songPlay();
            await this.playlistNext();
        }

        async playlistNext() {
            this.playlistActive = true;
            while(this.playlistActive) {
                await this.playlist.updateNextPosition();
                await this.playlist.loadSongFromPlaylistEntry();
                await this.songPlay();
            }
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