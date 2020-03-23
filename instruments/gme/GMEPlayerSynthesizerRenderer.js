import FileService from "../../song/file/FileService";
import React from "react";
import GMESongFile from "../../song/file/GMESongFile";

const libGMESupport = new GMESongFile();
libGMESupport.init();

class GMEPlayerSynthesizerRenderer extends React.Component {
    constructor(props={}) {
        console.log(props);
        super(props);
        this.config = props.config || {};
        this.state = {};
    }

}





/**
 * Used for all Instrument UI. Instance not necessary for song playback
 */
// class GMEPlayerRenderer {
//
//     /**
//      *
//      * @param {AudioSourceComposerForm} instrumentForm
//      * @param instruments
//      */
//     constructor(instrumentForm, instruments) {
//         this.form = instrumentForm;
//         this.instruments = instruments;
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
// //         const PATH = 'instruments/chip/spc-player-synthesizer.css';
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
//         this.instruments.song.instrumentRemove(this.instruments.id);
//         // document.dispatchEvent(new CustomEvent('instruments:remove', this));
//     }
//
//     instrumentRename(newInstrumentName) {
//         return this.instruments.song.instrumentRename(this.instruments.id, newInstrumentName);
//     }
//
//     render() {
//         // const instruments = this.instruments;
//         const instrumentID = typeof this.instruments.id !== "undefined" ? this.instruments.id : -1;
//         const instrumentIDHTML = (instrumentID < 10 ? "0" : "") + (instrumentID);
//         this.form.innerHTML = '';
//         this.form.classList.add('spc-player-synthesizer-container');
//
//         // this.form.removeEventListener('focus', this.focusHandler);
//         // this.form.addEventListener('focus', this.focusHandler, true);
//
//         const instrumentToggleButton = this.form.addButtonInput('instruments-id',
//             e => this.form.classList.toggle('selected'),
//             instrumentIDHTML + ':'
//         );
//         instrumentToggleButton.classList.add('show-on-focus');
//
//         const instrumentNameInput = this.form.addTextInput('instruments-name',
//             (e, newInstrumentName) => this.instrumentRename(newInstrumentName),
//             'Instrument Name',
//             this.instruments.config.name || '',
//             'Unnamed'
//         );
//         instrumentNameInput.classList.add('show-on-focus');
//
//
//         this.form.addButtonInput('instruments-remove',
//             (e) => this.remove(e, instrumentID),
//             this.form.createIcon('delete'),
//             'Remove Instrument');
//
//         let defaultPresetURL = '';
//         if (this.instruments.config.libraryURL && this.instruments.config.preset)
//             defaultPresetURL = new URL(this.instruments.config.libraryURL + '#' + this.instruments.config.preset, document.location) + '';
//
//         this.fieldChangePreset = this.form.addSelectInput('instruments-preset',
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

export default GMEPlayerSynthesizerRenderer;
