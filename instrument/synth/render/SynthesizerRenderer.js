import React from 'react';

import {
    InputButton,
    InputSelect,
    Div,
    Menu,
    Icon,
} from "../../../components";

import {Library} from "../../../song";

import SynthesizerSampleRenderer from "./SynthesizerSampleRenderer";
import "./assets/SynthesizerRenderer.css";

/** AudioSourceSynthesizerRenderer **/
class SynthesizerRenderer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: true,
            library: Library.loadDefault()
        }
        const config = this.getConfig();
        if(config.libraryURL)
            this.changeLibrary(config.libraryURL);
    }

    getSong() { return this.props.song; }
    getConfig() { return this.getSong().getInstrumentConfig(this.props.instrumentID); }
    // getLibrary() { return this.state.library; }

    render() {
        const instrumentID = this.props.instrumentID;
        const instrumentIDHTML = (instrumentID < 10 ? "0" : "") + (instrumentID);

        const config = this.getConfig();



        // const instrument = this;
        // const instrumentID = typeof this.id !== "undefined" ? this.id : -1;
        // const config = song.getInstrumentConfig(instrumentID);

        // let presetURL = config.presetURL || '';
        // let presetTitle = presetURL.split('#').pop() || presetURL.split('/').pop() || 'Set Preset';
        // if(config.presetURL && config.preset)
        //     presetURL = new URL(config.libraryURL + '#' + config.preset, document.location) + '';

        // let titleHTML = `${instrumentIDHTML}: ${config.name || "Unnamed"}`;

        return (
            <Div className="audio-source-synthesizer-container">
                <Div className="header">
                    <InputButton
                        className="toggle-container"
                        onAction={e => this.toggleContainer(e)}
                        >{instrumentIDHTML}: {config.name || "Unnamed"}</InputButton>
                    <InputSelect
                        className="instrument-preset"
                        value={config.preset || "No Preset"}
                        options={e => this.renderMenu('preset')}
                        onChange={(e, presetURL) => this.setPreset(presetURL)}
                        />
                    <Menu
                        arrow={false}
                        className="instrument-config"
                        options={e => this.renderMenu('config')}
                        >
                        <Icon className="config"/>
                    </Menu>
                </Div>
                {this.state.open && (
                    <Div className="samples">
                        {config.samples && config.samples.map((sampleData, sampleID) =>
                            <SynthesizerSampleRenderer
                                sampleData={sampleData}
                                sampleID={sampleID}
                            />
                        )}
                    </Div>
                )}
            </Div>
        );

    }

    renderMenu(menuKey = null) {
        let library;
//             console.log('renderMenu', menuKey);
        switch(menuKey) {
            case null:
                return (<>
                    <Menu options={e => this.renderMenu('file')}      >File</Menu>
                    <Menu options={e => this.renderMenu('playlist')}  >Playlist</Menu>
                    <Menu options={e => this.renderMenu('view')}      >View</Menu>
                </>);

            case 'preset':
                library = this.state.library;
                return (<>
                    {library.getPresetCount() > 0 ? library.eachPreset(config => (
                        <Menu>{config.name}</Menu>
                    )) : <Menu disabled> - Select a Library - </Menu>}
                    <Menu hasBreak options={e => this.renderMenu('library-list')}    >Libraries</Menu>
                </>);

                // selectElm.getOptGroup((library.name || 'Unnamed Library') + '', () =>
                //     library.eachPreset(config => selectElm.getOption(config.url, config.name)),
                // ),
                //     selectElm.getOptGroup('Libraries', () =>
                //             library.eachLibrary(config => selectElm.getOption(config.url, config.name)),
                //         {disabled: library.libraryCount === 0}
                //     ),
                //     selectElm.getOptGroup('Other Libraries', () =>
                //             Library.eachHistoricLibrary(config => selectElm.getOption(config.url, config.name)),
                //         {disabled: Library.historicLibraryCount === 0}
                //     ),
            case 'preset-list':
                library = this.state.library;
                if(library.getPresetCount() === 0)
                    return <Menu disabled>No presets</Menu>;
                return library.eachPreset(config => (
                    <Menu>{config.name}</Menu>
                ));

            case 'library-list':
                library = this.state.library;
                return library.eachLibrary(config => (
                    <Menu onAction={e=>this.changeLibrary(config.url)}>{config.name}</Menu>
                ));

            case 'config':
                /**
                 *
                 *



                 Menu.createElement({}, 'Change Instrument to',
                 async () => {
                                const instrumentLibrary = await Library.loadDefaultLibrary(); // TODO: get default library url from composer?
                                return instrumentLibrary.eachInstrument((instrumentConfig) =>
                                    Menu.createElement({}, instrumentConfig.name, null, () => {
                                        this.song.instrumentReplace(instrumentID, instrumentConfig);
                                    })
                                );
                            }
                 ),
                 Menu.createElement({}, 'Rename Instrument', null, () => this.song.instrumentRename(instrumentID)),
                 Menu.createElement({}, 'Remove Instrument', null, () => this.song.instrumentRemove(instrumentID)),

                 */
                break;

            default:
                throw new Error("Unknown menu key: " + menuKey);
        }

    }

    async changeLibrary(libraryURL) {
        const library = await Library.loadFromURL(libraryURL);
        this.setState({library});
    }

    toggleContainer() {
        this.setState({open: !this.state.open});
    }

    render2() {
        // return [
        //
        //     Div.createElement('header', () => [
        //         InputButton.createElement('title', titleHTML, e => this.toggleContainer(e)),
        //         this.selectChangePreset = new InputSelect('instrument-preset',
        //             (selectElm) => [
        //             ],
        //             (e, presetURL) => this.setPreset(presetURL),
        //             presetURL,
        //             presetTitle,
        //         ),
        //
        //         this.menu = Menu.createElement(
        //             {vertical: true},
        //             Icon.createIcon('config'),
        //             () => [
        //             ]
        //         ),
        //
        //         // new InputSelect('url',
        //         //     (e, changeInstrumentURL) => thisReplace(e, instrumentID, changeInstrumentURL),
        //         //     async (selectElm) =>
        //         //         instrumentLibrary.eachInstrument((instrumentConfig) =>
        //         //             selectElm.getOption(instrumentConfig.url, instrumentConfig.name)),
        //         //     'Set Instrument'
        //         // )
        //     ]),
        //
        //     // this.buttonToggle = InputButton.createElement('instrument-id',
        //     //     e => this.form.classList.toggle('selected'),
        //     //     instrumentIDHTML + ':'
        //     // ),
        //     // this.textName = InputText.createElement('instrument-name',
        //     //     (e, newInstrumentName) => this.stateRename(newInstrumentName),
        //     //     'Instrument Name',
        //     //     this.config.name || '',
        //     //     'Unnamed'
        //     // ),
        //     // InputButton.createElement('instrument-remove',
        //     //     (e) => this.remove(e, instrumentID),
        //     //     Icon.createIcon('delete'),
        //     //     'Remove Instrument'),
        //
        //     (!this.state.open ? null : (
        //
        //         /** Sample Forms **/
        //         this.grid = new Grid('samples', () => [
        //             new GridRow('header', () => [
        //                 Div.createElement('id', 'ID'),
        //                 Div.createElement('url', 'URL'),
        //                 Div.createElement('mixer', 'Mixer'),
        //                 Div.createElement('detune', 'Detune'),
        //                 Div.createElement('root', 'Root'),
        //                 Div.createElement('alias', 'Alias'),
        //                 Div.createElement('loop', 'Loop'),
        //                 Div.createElement('adsr', 'ADSR'),
        //                 Div.createElement('remove', 'Rem'),
        //             ]),
        //
        //             samples.map((sampleData, sampleID) => new GridRow(sampleID, () => [
        //                 // const sampleRow = gridDiv.addGridRow('sample-' + sampleID);
        //                 // const sampleRow = this.form.addGrid(i);
        //                 // Div.createElement('name', (e, nameString) => this.setSampleName(sampleID, nameString), 'Name', sampleData.name);
        //                 // InputButton.createElement('id', (e) => this.moveSample(sampleID), sampleID, 'Sample ' + sampleID);
        //                 Div.createElement('id', sampleID),
        //
        //                 new InputSelect('url',
        //                     selectElm => library.eachSample(config => selectElm.getOption(config.url, config.name)),
        //                     async (e, sampleURL, sampleName) => {
        //                         await this.setSampleName(sampleID, sampleName);
        //                         await this.setSampleURL(sampleID, sampleURL);
        //                     },
        //                     sampleData.url,
        //                     sampleData.name),
        //
        //                 InputRange.createElement('mixer',
        //                     (e, mixerValue) => this.setSampleMixer(sampleID, mixerValue), 1, 100, 'Mixer', sampleData.mixer),
        //
        //                 InputRange.createElement('detune',
        //                     (e, detuneValue) => this.setSampleDetune(sampleID, detuneValue), -100, 100, 'Detune', sampleData.detune),
        //
        //                 new InputSelect('root',
        //                     selectElm => this.values.getNoteFrequencies(freq => selectElm.getOption(freq)),
        //                     (e, root) => this.setSampleKeyRoot(sampleID, root),
        //                     sampleData.root || ''),
        //                 // Menu.createElement({}, 'root',
        //                 //     selectElm => this.values.getNoteFrequencies(freq => {
        //                 //         new SelectMenu
        //                 //     }),
        //                 //     null,
        //                 //     'Root', sampleData.root || ''),
        //
        //                 new InputSelect('alias',
        //                     selectElm => this.values.getNoteFrequencies(freq => selectElm.getOption(freq)),
        //                     (e, keyAlias) => this.setSampleKeyAlias(sampleID, keyAlias),
        //                     sampleData.alias),
        //
        //                 new InputCheckBox('loop',
        //                     (e, isLoop) => this.setSampleLoop(sampleID, isLoop), 'Loop', sampleData.loop),
        //
        //                 InputText.createElement('adsr',
        //                     (e, asdr) => this.setSampleASDR(sampleID, asdr), 'ADSR', sampleData.adsr, '0,0,0,0'),
        //
        //                 InputButton.createElement('remove',
        //                     '&nbsp;X&nbsp;',
        //                     (e) => this.removeSample(sampleID),
        //                     'Remove sample'),
        //             ])),
        //
        //             new GridRow('footer', () => [
        //                 /** Add New Sample **/
        //                 Div.createElement('id', '*'),
        //                 this.fieldAddSample = new InputSelect('url',
        //                     (selectElm) => [
        //                         selectElm.getOption('', '[New Sample]'),
        //                         selectElm.getOptGroup((library.name || 'Unnamed Library') + '', () =>
        //                             library.eachSample(config => selectElm.getOption(config.url, config.name)),
        //                         ),
        //                         selectElm.getOptGroup('Libraries', () =>
        //                                 library.eachLibrary(config => selectElm.getOption(config.url, config.name)),
        //                             {disabled: library.libraryCount === 0}
        //                         ),
        //                         selectElm.getOptGroup('Other Libraries', async () =>
        //                                 await Library.eachHistoricLibrary(config => selectElm.getOption(config.url, config.name)),
        //                             {disabled: Library.historicLibraryCount === 0}
        //                         ),
        //                     ],
        //                     (e, sampleURL, sampleName) => this.addSample(sampleURL, sampleName),
        //                     'Add Sample',
        //                     ''),
        //                 Div.createElement('id', '-'),
        //                 Div.createElement('id', '-'),
        //                 Div.createElement('id', '-'),
        //                 Div.createElement('id', '-'),
        //                 Div.createElement('id', '-'),
        //                 Div.createElement('id', '-'),
        //                 Div.createElement('id', '-'),
        //
        //             ]),
        //         ])
        //     ))
        //
        // ];
    }
}

export default SynthesizerRenderer;
