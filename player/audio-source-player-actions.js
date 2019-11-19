(async function() {


    /** Register This Module **/
    const _module = typeof module !== "undefined" ? module : findThisScript();
    _module.promise = new Promise((resolve) => _module.resolve = resolve);

    const {AudioSourceSong} = await requireAsync('common/audio-source-song.js');
    const {AudioSourceStorage} = await requireAsync('common/audio-source-storage.js');
    const {AudioSourceUtilities} = await requireAsync('common/audio-source-utilities.js');

    class AudioSourcePlayerActions extends HTMLElement {
        constructor() {
            super();
            this.song = new AudioSourceSong({}, this);
        }

        async AudioSourceSong() {
            const {AudioSourceSong} = await requireAsync('common/audio-source-song.js');
            return new AudioSourceSong;
        }
        async getAudioSourceStorage() {
            const {AudioSourceStorage} = await requireAsync('common/audio-source-storage.js');
            return new AudioSourceStorage;
        }
        async getAudioSourceUtilities() {
            const {AudioSourceUtilities} = await requireAsync('common/audio-source-utilities.js');
            return new AudioSourceUtilities;
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
            const song = this.song;
            const storage = await this.getAudioSourceStorage();
            const songData = await storage.loadSongFromMemory(songUUID);
            if (songData.instruments.length === 0)
                console.warn("Song contains no instruments");
            const songHistory = await storage.loadSongHistoryFromMemory(songUUID);
            await song.loadSongData(songData);
            await song.loadSongHistory(songHistory);
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
            const ext = file.name.split('.').pop().toLowerCase();
            switch (ext) {
                case 'mid':
                case 'midi':
                    await this.loadSongFromMIDIFile(file);
                    break;

                case 'json':
                    await this.loadSongFromJSONFile(file);
                    break;

                default:
                    throw new Error("Unknown file type: " + ext);
            }
        }


        async loadSongFromJSONFile(file) {
            const Util = await this.getAudioSourceUtilities();
            const songData = await Util.loadJSONFile(file);
            if (songData.instruments.length === 0)
                console.warn("Song contains no instruments");
            await this.song.loadSongData(songData);
            this.render(true);
            this.setStatus("Song loaded from file: ", songData);
        }

        async loadSongFromMIDIFile(file, defaultInstrumentURL = null) {
            defaultInstrumentURL = defaultInstrumentURL || this.getDefaultInstrumentURL();
            const midiSupport = new MIDISupport();
            const songData = await midiSupport.loadSongFromMidiFile(file, defaultInstrumentURL);
            await this.song.loadSongData(songData);
            this.render(true);
            this.setStatus("Song loaded from midi: ", songData);
        }

        async loadSongFromSrc(src) {
            const Util = await this.getAudioSourceUtilities();
            const songData = await Util.loadJSONFromURL(src);
            if (songData.instruments.length === 0)
                console.warn("Song contains no instruments");
            await this.song.loadSongData(songData);
            this.setStatus("Song loaded from src: " + src);
            console.info(this.song.data);
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

    }

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