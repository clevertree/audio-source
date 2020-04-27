import FileService from "../../../song/file/FileService";

class SPCPlayerSynthesizer {


    constructor(config, song=null, instrumentID=null) {
        this.song = song;
        this.id = instrumentID;
        this.form = null;

        this.audioContext = null;
        if(typeof config.name === "undefined")
            config.name = 'SPC ASPlayer ' + (instrumentID < 10 ? "0" : "") + (instrumentID);
        this.config = config || {};
        this.spcPlayers = [];
        this.spcBuffer = null;
    }

    async loadBuffer() {
        if(!this.spcBuffer) {
            const spcURL = this.config.spcURL;
            const service = new FileService();
            this.spcBuffer = service.loadBufferFromURL(spcURL);
            console.info("SPC ASPlayer loaded");
        }
        if(this.spcBuffer instanceof Promise)
            this.spcBuffer = await this.spcBuffer;
        return this.spcBuffer;
    }

    async loadSPCPlayer(destination) {
        const libGMESupport = await this.getLibGMESupport();
        const buffer = await this.loadBuffer();
        return libGMESupport.loadSPCPlayerFromBuffer(buffer, 'file', {
            destination
        });
    }

    /** Initializing Audio **/

    async getLibGMESupport() {
        // const AudioSourceLoader = customElements.get('audio-source-loader');
        // const requireAsync = AudioSourceLoader.getRequireAsync(thisModule);
        // const {LibGMESupport} = await requireAsync('../../file/LibGMESupport.js');
        // return new LibGMESupport();
    }

    async init(audioContext=null) {

        if(audioContext) {
            this.audioContext = audioContext;
            const libGMESupport = await this.getLibGMESupport();
            await libGMESupport.init(audioContext);
        }
        if (this.config.spcURL)
            await this.loadBuffer();
        console.info("SPC ASPlayer initialized");
    }

    /** Playback **/


    // Instruments return promises
    async play(destination, namedFrequency, startTime, duration, velocity) {
        const spcPlayer = await this.loadSPCPlayer(destination);
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

    // render(renderObject=null) {
    //     if(renderObject instanceof HTMLElement && renderObject.matches('asui-div')) {
    //         this.form = new SPCPlayerSynthesizerFormRenderer(renderObject, this);
    //     } else {
    //         throw new Error("Unknown renderer");
    //     }
    // }


}





/**
 * Used for all Instrument UI. Instance not necessary for song playback
 */
// class SPCPlayerSynthesizerRenderer {
//
//     /**
//      *
//      * @param {AudioSourceComposerForm} instrumentForm
//      * @param programs
//      */
//     constructor(instrumentForm, programs) {
//         this.form = instrumentForm;
//         this.programs = programs;
//         const root = instrumentForm.getRootNode() || document;
//         this.appendCSS(root);
//         this.render();
//     }
//
//     // get DEFAULT_SAMPLE_LIBRARY_URL() {
//     //     return getScriptDirectory('default.library.json');
//     // }
//
//
//
// //     appendCSS(rootElm) {
// //
// //         // Append Instrument CSS
// //         const PATH = 'programs/chip/spc-player-synthesizer.css';
// //         const linkHRef = getScriptDirectory(PATH);
// // //             console.log(rootElm);
// //         let linkElms = rootElm.querySelectorAll('link');
// //         for(let i=0; i<linkElms.length; i++) {
// //             if(linkElms[i].href.endsWith(PATH))
// //                 return;
// //         }
// //         const linkElm = document.createElement('link');
// //         linkElm.setAttribute('href', linkHRef);
// //         linkElm.setAttribute('rel', 'stylesheet');
// //         rootElm.insertBefore(linkElm, rootElm.firstChild);
// //     }
//
//     /** Modify Instrument **/
//
//     remove() {
//         this.programs.song.instrumentRemove(this.programs.id);
//         // document.dispatchEvent(new CustomEvent('programs:remove', this));
//     }
//
//     instrumentRename(newInstrumentName) {
//         return this.programs.song.instrumentRename(this.programs.id, newInstrumentName);
//     }
//
//     render() {
//         // const programs = this.programs;
//         const instrumentID = typeof this.programs.id !== "undefined" ? this.programs.id : -1;
//         const instrumentIDHTML = (instrumentID < 10 ? "0" : "") + (instrumentID);
//         this.form.innerHTML = '';
//         this.form.classList.add('spc-player-synthesizer-container');
//
//         // this.form.removeEventListener('focus', this.focusHandler);
//         // this.form.addEventListener('focus', this.focusHandler, true);
//
//         const instrumentToggleButton = this.form.addButtonInput('programs-id',
//             e => this.form.classList.toggle('selected'),
//             instrumentIDHTML + ':'
//         );
//         instrumentToggleButton.classList.add('show-on-focus');
//
//         const instrumentNameInput = this.form.addTextInput('programs-name',
//             (e, newInstrumentName) => this.instrumentRename(newInstrumentName),
//             'Instrument Name',
//             this.programs.config.name || '',
//             'Unnamed'
//         );
//         instrumentNameInput.classList.add('show-on-focus');
//
//
//         this.form.addButtonInput('programs-remove',
//             (e) => this.remove(e, instrumentID),
//             this.form.createIcon('delete'),
//             'Remove Instrument');
//
//         let defaultPresetURL = '';
//         if (this.programs.config.libraryURL && this.programs.config.preset)
//             defaultPresetURL = new URL(this.programs.config.libraryURL + '#' + this.programs.config.preset, document.location) + '';
//
//         this.fieldChangePreset = this.form.addSelectInput('programs-preset',
//             (e, presetURL) => this.setPreset(presetURL),
//             (addOption, setOptgroup) => {
//                 addOption('', 'Change Preset');
//                 // setOptgroup(this.sampleLibrary.name || 'Unnamed Library');
//                 // this.sampleLibrary.getPresets().map(presetConfig => addOption(presetConfig.url, presetConfig.name));
//                 // setOptgroup('Libraries');
//                 // this.sampleLibrary.getLibraries().map(libraryConfig => addOption(libraryConfig.url, libraryConfig.name));
//                 // setOptgroup('Other Libraries');
//                 // const Library = customElements.get('audio-source-library');
//                 // Library.eachHistoricLibrary(addOption);
//             },
//             'Change Instrument',
//             defaultPresetURL);
//
//
//         this.form.addBreak();
//     }
// }

export default SPCPlayerSynthesizer;
