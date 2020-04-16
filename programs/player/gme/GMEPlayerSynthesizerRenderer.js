// import FileService from "../../song/file/FileService";
import React from "react";
// import GMESongFile from "../../song/file/GMESongFile";


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

export default GMEPlayerSynthesizerRenderer;
