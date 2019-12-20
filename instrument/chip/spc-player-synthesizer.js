{

    /** Required Modules **/
    if(typeof window !== "undefined")
        window.require = customElements.get('audio-source-loader').require;


    const {AudioSourceFileService} = require('../common/audio-source-file-service.js');

    class SPCPlayerSynthesizer {


        constructor(config, song=null, instrumentID=null) {
            this.song = song;
            this.id = instrumentID;
            this.form = null;

            this.audioContext = null;
            if(typeof config.name === "undefined")
                config.name = 'SPC Player ' + (instrumentID < 10 ? "0" : "") + (instrumentID);
            this.config = config || {};
            this.spcPlayers = [];
            this.spcBuffer = null;

            if(this.config.spcURL)
                this.loadBuffer();
        }

        async loadBuffer() {
            if(!this.spcBuffer) {
                const spcURL = this.config.spcURL;
                const service = new AudioSourceFileService();
                this.spcBuffer = service.loadBufferFromURL(spcURL);
            }
            if(this.spcBuffer instanceof Promise)
                this.spcBuffer = await this.spcBuffer;
            return this.spcBuffer;
        }

        async loadSPCPlayer(destination) {
            const AudioSourceLoader = customElements.get('audio-source-loader');
            const {LibGMESupport} = await AudioSourceLoader.requireAsync('../common/support/libgme-support.js');
            const libGMESupport = new LibGMESupport();
            const buffer = await this.loadBuffer();
            return libGMESupport.loadSPCPlayerFromBuffer(buffer, 'file', {
                destination
            });
        }

        /** Initializing Audio **/

        async init(audioContext) {
            this.audioContext = audioContext;
            const AudioSourceLoader = customElements.get('audio-source-loader');
            const {LibGMESupport} = await AudioSourceLoader.requireAsync('../common/support/libgme-support.js');
            const libGMESupport = new LibGMESupport();
            await libGMESupport.init(audioContext);
            if(this.config.spcURL)
                await this.loadBuffer();
            console.info("SPC Player initialized");
        }

        /** Playback **/


        // Instruments return promises
        async play(destination, namedFrequency, startTime, duration, velocity) {
            const spcPlayer = await this.loadSPCPlayer(destination);
            console.info("SPC Player loaded");
            this.spcPlayers.push(spcPlayer);

            let currentTime = destination.context.currentTime;
            startTime = startTime !== null ? startTime : currentTime;
            if(startTime > currentTime) {
                const waitTime = startTime - currentTime;
                await new Promise((resolve, reject) => setTimeout(resolve, waitTime * 1000));
            }
            // const commandFrequency = this.getFrequencyFromAlias(namedFrequency) || namedFrequency;
            // const max = spcPlayer.getMaxPlaybackPosition();
            if(startTime < currentTime) {
                const seekPos = (currentTime - startTime) * 1000;
                spcPlayer.seekPlaybackPosition(seekPos);
            }
            spcPlayer.play(destination);

            if(duration) {
                const waitTime = (startTime + duration) - destination.context.currentTime;
                await new Promise((resolve, reject) => setTimeout(resolve, waitTime * 1000));
                spcPlayer.pause();
            }
        }

        stopPlayback() {
            for(let i=0; i<this.spcPlayers.length; i++) {
                // this.spcPlayers[i].stop();
                this.spcPlayers[i].pause();
            }
            // this.spcPlayer.stop();

        }

        getFrequencyFromAlias(aliasName) {
            return null;
        }

        getCommandFrequency(command) {
            const keyNumber = this.getCommandKeyNumber(command);
            return 440 * Math.pow(2, (keyNumber - 49) / 12);
        }

        getCommandKeyNumber(command) {
            if (Number(command) === command && command % 1 !== 0)
                return command;
            if (!command)
                return null;

            const noteCommands = this.noteFrequencies; // ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
            let octave = command.length === 3 ? command.charAt(2) : command.charAt(1),
                keyNumber = noteCommands.indexOf(command.slice(0, -1));
            if (keyNumber < 3) keyNumber = keyNumber + 12 + ((octave - 1) * 12) + 1;
            else keyNumber = keyNumber + ((octave - 1) * 12) + 1;
            return keyNumber;
        }


        get noteFrequencies() {
            return ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
        }

        // get instrumentID() {
        //     return this.getAttribute('data-id');
        // }

        render(renderObject=null) {
            if(renderObject instanceof HTMLElement && renderObject.matches('asui-div')) {
                this.form = new SPCPlayerSynthesizerFormRenderer(renderObject, this);
            } else {
                throw new Error("Unknown renderer");
            }
        }


    }





    /**
     * Used for all Instrument UI. Instance not necessary for song playback
     */
    class SPCPlayerSynthesizerFormRenderer {

        /**
         *
         * @param {AudioSourceComposerForm} instrumentForm
         * @param instrument
         */
        constructor(instrumentForm, instrument) {
            this.form = instrumentForm;
            this.instrument = instrument;
            const root = instrumentForm.getRootNode() || document;
            this.appendCSS(root);
            this.render();
        }

        get DEFAULT_SAMPLE_LIBRARY_URL() {
            return getScriptDirectory('default.library.json');
        }



        appendCSS(rootElm) {

            // Append Instrument CSS
            const PATH = 'instrument/chip/spc-player-synthesizer.css';
            const linkHRef = getScriptDirectory(PATH);
//             console.log(rootElm);
            let linkElms = rootElm.querySelectorAll('link');
            for(let i=0; i<linkElms.length; i++) {
                if(linkElms[i].href.endsWith(PATH))
                    return;
            }
            const linkElm = document.createElement('link');
            linkElm.setAttribute('href', linkHRef);
            linkElm.setAttribute('rel', 'stylesheet');
            rootElm.insertBefore(linkElm, rootElm.firstChild);
        }

        /** Modify Instrument **/

        remove() {
            this.instrument.song.instrumentRemove(this.instrument.id);
            // document.dispatchEvent(new CustomEvent('instrument:remove', this));
        }

        instrumentRename(newInstrumentName) {
            return this.instrument.song.instrumentRename(this.instrument.id, newInstrumentName);
        }

        async render() {
            // const instrument = this.instrument;
            const instrumentID = typeof this.instrument.id !== "undefined" ? this.instrument.id : -1;
            const instrumentIDHTML = (instrumentID < 10 ? "0" : "") + (instrumentID);
            this.form.innerHTML = '';
            this.form.classList.add('spc-player-synthesizer-container');

            // this.form.removeEventListener('focus', this.focusHandler);
            // this.form.addEventListener('focus', this.focusHandler, true);

            const instrumentToggleButton = this.form.addButtonInput('instrument-id',
                e => this.form.classList.toggle('selected'),
                instrumentIDHTML + ':'
            );
            instrumentToggleButton.classList.add('show-on-focus');

            const instrumentNameInput = this.form.addTextInput('instrument-name',
                (e, newInstrumentName) => this.instrumentRename(newInstrumentName),
                'Instrument Name',
                this.instrument.config.name || '',
                'Unnamed'
            );
            instrumentNameInput.classList.add('show-on-focus');


            this.form.addButtonInput('instrument-remove',
                (e) => this.remove(e, instrumentID),
                this.form.createIcon('delete'),
                'Remove Instrument');

            let defaultPresetURL = '';
            if (this.instrument.config.libraryURL && this.instrument.config.preset)
                defaultPresetURL = new URL(this.instrument.config.libraryURL + '#' + this.instrument.config.preset, document.location) + '';

            this.fieldChangePreset = this.form.addSelectInput('instrument-preset',
                (e, presetURL) => this.setPreset(presetURL),
                (addOption, setOptgroup) => {
                    addOption('', 'Change Preset');
                    // setOptgroup(this.sampleLibrary.name || 'Unnamed Library');
                    // this.sampleLibrary.eachPreset(presetConfig => addOption(presetConfig.url, presetConfig.name));
                    // setOptgroup('Libraries');
                    // this.sampleLibrary.eachLibrary(libraryConfig => addOption(libraryConfig.url, libraryConfig.name));
                    // setOptgroup('Other Libraries');
                    // const AudioSourceLibrary = customElements.get('audio-source-library');
                    // AudioSourceLibrary.eachHistoricLibrary(addOption);
                },
                'Change Instrument',
                defaultPresetURL);


            this.form.addBreak();
        }
    }


    /** Utilities **/


    function getScriptDirectory(appendPath = '') {
        const AudioSourceLoader = customElements.get('audio-source-loader')
        return AudioSourceLoader.resolveURL(appendPath);
    }

    /** Export this script **/
    const thisScriptPath = 'instrument/chip/spc-player-synthesizer.js';
    let thisModule = typeof document !== 'undefined' ? customElements.get('audio-source-loader').findScript(thisScriptPath) : module;
    thisModule.exports = {
        instrument: SPCPlayerSynthesizer,
        SPCPlayerSynthesizer
    };
}