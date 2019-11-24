(async function() {

    /** Register Script Exports **/
    function getThisScriptPath() { return 'player/audio-source-player-actions.js'; }
    function exportThisScript(module) {
        module.exports = {AudioSourcePlayerActions};
    }

    /** Register This Async Module **/
    const resolveExports = registerAsyncModule();


    const {AudioSourceSong} = await requireAsync('common/audio-source-song.js');
    // const {AudioSourceStorage} = await requireAsync('common/audio-source-storage.js');
    // const {AudioSourceUtilities} = await requireAsync('common/audio-source-utilities.js');

    class AudioSourcePlayerActions extends HTMLElement {
        constructor() {
            super();
            this.song = new AudioSourceSong({}, this);
        }


        getDefaultInstrumentURL() {
            return findThisScript()[0].basePath + 'instrument/audio-source-synthesizer.js';
        }


        /** Song Commands **/

        setSongVolume(e, newSongVolume) {
            this.song.setVolume(newSongVolume);
            this.fieldSongVolume.value = newSongVolume;
            // this.setStatus(`Volume modified: ${newSongVolume}`);
        }


        async loadSongFromMemory(songUUID) {
            await this.song.loadSongFromMemory(songUUID);
            this.render(true);
            this.setStatus("Song loaded from memory: " + songUUID, songData);
//         console.info(songData);
        }

        async loadSongFromFileInput(file=null) {
            if(file === null)
                file = this.fieldSongFileLoad.inputElm.files[0];
            if (!file)
                throw new Error("Invalid file input");
            await this.song.loadSongFromFileInput(file);
            this.addSongFileToPlaylist(file, this.song.name, this.song.getSongLength());
            this.render(true);
        }

        async loadSongFromURL(url) {
            if(url.toString().toLowerCase().endsWith('.playlist.json')) {
                return await this.loadPlaylistFromURL(url);
            }
            await this.song.loadSongFromURL(url);
            this.setStatus("Song loaded from src: " + url, this.song);
            this.addSongURLToPlaylist(url, this.song.name, this.song.getSongLength());
            this.render(true);
        }

        async loadSongFromPlaylistEntry(playlistPosition) {
            if(this.song.playback)
                this.song.stopPlayback();
            const entry = this.playlist[playlistPosition];
            if(!entry)
                throw new Error("Invalid playlist position: " + playlistPosition);
            this.playlistPosition = playlistPosition;
            if(entry.file) {
                await this.song.loadSongFromFileInput(entry.file);
            } else if(entry.url) {
                await this.song.loadSongFromURL(entry.url);
            } else {
                throw new Error("Invalid Playlist Entry: " + playlistPosition);
            }
            this.render(true);
        }

        /** Song Playlist **/

        async loadPlaylistFromURL(playlistURL) {
            playlistURL = new URL(playlistURL, document.location)
            const {AudioSourceUtilities} = await requireAsync('common/audio-source-utilities.js');
            const Util = new AudioSourceUtilities;
            const data = await Util.loadJSONFromURL(playlistURL.toString());
            if(!data.playlist)
                throw new Error("No playlist data: " + playlistURL);
            if(!Array.isArray(data.playlist))
                throw new Error("Invalid playlist data: " + playlistURL);
            this.playlist = [];
            for(let i=0; i<data.playlist.length; i++) {
                let entry = data.playlist[i];
                if(typeof entry === "string") {
                    const split = entry.split(';');
                    entry = {url: split[0]};
                    if(split[1]) entry.name = split[1];
                    if(split[2]) entry.length = split[2];
                }
                entry.url = new URL(entry.url, playlistURL).toString();
                this.addSongURLToPlaylist(entry.url, entry.name, entry.length);
            }
            this.render(true);
        }

        addSongURLToPlaylist(url, name=null, length=null) {
            const entry = {url};
            entry.name = name || url.split('/').pop();
            entry.length = length || null;
            this.playlist.push(entry);
        }

        addSongFileToPlaylist(file, name=null, length=null) {
            const entry = {file};
            entry.name = name || file.name.split('/').pop();
            entry.length = length || null;
            entry.url = 'file://' + file.name;
            this.playlist.push(entry);
        }


        /** Song Playback **/


        async songPlay() {
            await this.song.play();
        }

        async songPause() {
            this.song.stopPlayback();
        }

        async songStop() {
            this.song.stopPlayback();
            this.song.setPlaybackPositionInTicks(0);
        }

        setSongPosition(e, playbackPosition = null) {
            const song = this.song;
            if (playbackPosition === null) {
                const values = new AudioSourceValues();
                playbackPosition = values.parsePlaybackPosition(this.fieldSongPosition.value);
            }
            song.setPlaybackPosition(playbackPosition);

        }


        /** Toggle Panels **/

        togglePanelPlaylist(e) {
            this.containerElm.classList.toggle('hide-panel-playlist');
        }

        togglePanelSong(e) {
            this.containerElm.classList.toggle('hide-panel-song');
        }
        toggleFullscreen(e) {
            const setFullScreen = !this.classList.contains('fullscreen');
            this.containerElm.classList.toggle('fullscreen', setFullScreen);
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
        if(typeof module !== 'undefined')
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