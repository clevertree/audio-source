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

        async loadSongFromFileInput(e, fileInput = null) {
            fileInput = fileInput || this.fieldSongFileLoad.inputElm;
            if (!fileInput || !fileInput.files || fileInput.files.length === 0)
                throw new Error("Invalid file input");
            if (fileInput.files.length > 1)
                throw new Error("Invalid file input: only one file allowed");
            const file = fileInput.files[0];
            await this.song.loadSongFromFileInput(file);
        }


        async loadSongFromJSONFile(file) {
            await this.song.loadSongFromJSONFile(file);
            this.render(true);
            this.setStatus("Song loaded from file: ", this.song.songData);
        }

        async loadSongFromMIDIFile(file, defaultInstrumentURL = null) {
            await this.song.loadSongFromMIDIFile(file, defaultInstrumentURL);
            this.render(true);
            this.setStatus("Song loaded from file: ", this.song.songData);
        }

        async loadSongFromSrc(src) {
            await this.song.loadSongFromSrc(src);
            this.setStatus("Song loaded from src: " + src, this.song);
            this.render(true);
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
            if(!scriptElm) {
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