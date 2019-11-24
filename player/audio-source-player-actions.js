(async function() {


    /** Register This Async Module **/
    const _module = typeof module !== "undefined" ? module : findThisScript();
    _module.promise = new Promise((resolve) => _module.resolve = resolve);

    const {AudioSourceSong} = await requireAsync('common/audio-source-song.js');
    // const {AudioSourceStorage} = await requireAsync('common/audio-source-storage.js');
    // const {AudioSourceUtilities} = await requireAsync('common/audio-source-utilities.js');

    class AudioSourcePlayerActions extends HTMLElement {
        constructor() {
            super();
            this.song = new AudioSourceSong({}, this);
        }


        getDefaultInstrumentURL() {
            return findThisScript().basePath + 'instrument/audio-source-synthesizer.js';
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

    /** Finish Registering Async Module **/
    _module.exports = {AudioSourcePlayerActions};
    _module.resolve(); // Resolve async promise
    delete _module.resolve;
    delete _module.promise;


    /** Module Loader Methods **/
    function findThisScript() {
        const SCRIPT_PATH = 'player/audio-source-player-actions.js';
        const thisScript = document.head.querySelector(`script[src$="${SCRIPT_PATH}"]`);
        if(!thisScript)
            throw new Error("Base script not found: " + SCRIPT_PATH);
        thisScript.relativePath = SCRIPT_PATH;
        thisScript.basePath = thisScript.src.replace(document.location.origin, '').replace(SCRIPT_PATH, '');
        return thisScript;
    }

    async function requireAsync(relativeScriptPath) {
        if(typeof require === "undefined") {
            let scriptElm = document.head.querySelector(`script[src$="${relativeScriptPath}"]`);
            if(!scriptElm || !scriptElm.exports) {
                const scriptURL = findThisScript().basePath + relativeScriptPath;
                await new Promise(async (resolve, reject) => {
                    scriptElm = document.createElement('script');
                    scriptElm.src = scriptURL;
                    scriptElm.onload = e => resolve();
                    document.head.appendChild(scriptElm);
                });
                if(scriptElm.promise instanceof Promise)
                    await scriptElm.promise;
            }
            return scriptElm.exports;
        } else {
            return require('../' + relativeScriptPath);
        }
    }

})();