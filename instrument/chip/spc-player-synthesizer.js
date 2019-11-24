(async function() {

    /** Register Script Exports **/
    function getThisScriptPath() { return 'composer/audio-source-composer.js'; }
    function exportThisScript(module) {
        module.exports = {
            instrument: SPCPlayerSynthesizer,
            SPCPlayerSynthesizer
        };
    }

    /** Register This Async Module **/
    const resolveExports = registerAsyncModule();



    const {LibGMESupport} = await requireAsync('common/support/libgme-support.js');

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

            if(this.config.spcURL)
                this.loadSPCPlayer();
        }

        async loadSPCPlayer(destination, spcURL=null) {
            spcURL = spcURL || this.config.spcURL;
            const libGMESupport = new LibGMESupport();
            const buffer = await libGMESupport.loadBufferFromURL(spcURL);
            return libGMESupport.loadSPCPlayerFromBuffer(buffer, 'file', {
                destination
            });
        }

        /** Initializing Audio **/

        async init(audioContext) {
            this.audioContext = audioContext;
            const libGMESupport = new LibGMESupport();
            await libGMESupport.init(audioContext);
        }

        /** Playback **/


        // Instruments return promises
        async play(destination, namedFrequency, startTime, duration, velocity) {
            const spcPlayer = await this.loadSPCPlayer(destination);
            this.spcPlayers.push(spcPlayer);
            // this.spcPlayer = await spcSupport.loadSPCPlayerFromSrc(this.config.spcURL); // TODO: OMFG HACK

            let currentTime = destination.context.currentTime;
            startTime = startTime !== null ? startTime : currentTime;
            if(startTime > currentTime) {
                const waitTime = startTime - currentTime;
                await new Promise((resolve, reject) => setTimeout(resolve, waitTime * 1000));
            }
            // const commandFrequency = this.getFrequencyFromAlias(namedFrequency) || namedFrequency;
            spcPlayer.play();

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
            this.instrument.song.removeInstrument(this.instrument.id);
            document.dispatchEvent(new CustomEvent('instrument:remove', this));
        }

        setInstrumentName(newInstrumentName) {
            return this.instrument.song.setInstrumentName(this.instrument.id, newInstrumentName);
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
                (e, newInstrumentName) => this.setInstrumentName(newInstrumentName),
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
        const scriptElm = findThisScript()[0];
        // const basePath = scriptElm.src.split('/').slice(0, -2).join('/') + '/';
        return scriptElm.basePath + appendPath;
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