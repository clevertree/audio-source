import React from 'react';

import {
    Button,
    Scrollable,
    Div,
    SubMenu,
    ActionMenu,
    MenuBreak,
    Icon, SubMenuButton,
} from "../../../components";

import {Library} from "../../../song";

import SynthesizerSampleRenderer from "./SynthesizerSampleRenderer";

import "./assets/SynthesizerRenderer.css";
import InstrumentLoader from "../../InstrumentLoader";

/** AudioSourceSynthesizerRenderer **/
class SynthesizerRenderer extends React.Component {
    constructor(props) {
        super(props);
        const config = this.getConfig();
        this.state = {
            open: config.samples && config.samples.length > 0,
            library: Library.loadDefault()
        }
        if(config.libraryURL)
            this.changeLibrary(config.libraryURL);
    }

    getSong() { return this.props.song; }
    getConfig() { return this.getSong().getInstrumentConfig(this.props.instrumentID); }
    // getLibrary() { return this.state.library; }

    render() {
        const instrumentID = this.props.instrumentID;
        const instrumentIDHTML = (instrumentID < 10 ? "0" : "") + (instrumentID);

        const instrumentConfig = this.getConfig();



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
                    <Button
                        className="toggle-container"
                        onAction={e => this.toggleContainer(e)}
                        >{instrumentIDHTML}: {instrumentConfig.title || "Unnamed"}</Button>
                    {this.state.open ? <SubMenuButton
                        title="Change Preset"
                        className="instrument-preset"
                        options={e => this.renderMenu('change-preset')}
                        onChange={(e, presetURL) => this.setPreset(presetURL)}
                        children={instrumentConfig.presetName || "No Preset"}
                        /> : null}
                    <SubMenuButton
                        arrow={false}
                        className="instrument-config"
                        options={e => this.renderMenu()}
                        >
                        <Icon className="config"/>
                    </SubMenuButton>
                </Div>
                {this.state.open && (
                    <Div className="samples">
                        {instrumentConfig.samples && instrumentConfig.samples.map((sampleData, sampleID) =>
                            <SynthesizerSampleRenderer
                                key={sampleID}
                                song={this.props.song}
                                instrumentID={this.props.instrumentID}
                                sampleID={sampleID}
                                sampleData={sampleData}
                            />
                        )}
                    </Div>
                )}
            </Div>
        );

    }

    renderMenu(menuKey = null) {
        let library = this.state.library;
//             console.log('renderMenu', menuKey);
        switch (menuKey) {
            case null:
                return (<>
                    <SubMenu options={e => this.renderMenu('change-preset')}>Change Preset</SubMenu>
                    <MenuBreak />
                    <SubMenu options={e => this.renderMenu('change')}>Change Instrument</SubMenu>
                    <ActionMenu onAction={e => this.instrumentRename(e)}>Rename Instrument</ActionMenu>
                    <ActionMenu onAction={e => this.instrumentRemove(e)}>Remove Instrument</ActionMenu>
                </>);

            case 'change':
                return (<>
                    {InstrumentLoader.getInstruments().map(config =>
                        <ActionMenu onAction={e => this.instrumentReplace(e, config.className)}>Change instrument to '{config.title}'</ActionMenu>
                    )}
                </>);


            case 'change-preset':
                return (<>
                    <SubMenu options={e => this.renderMenu('library-list')}    >Libraries</SubMenu>
                    <MenuBreak />
                    <ActionMenu disabled>Search</ActionMenu>
                    <MenuBreak />
                    {library.getPresets().length > 0 ? (
                        <Scrollable>
                            {library.getPresets().map(config => (
                                <ActionMenu onAction={e => this.loadPreset(config.name)}>{config.name}</ActionMenu>
                            ))}
                        </Scrollable>
                    ) : <ActionMenu disabled> - Select a Library - </ActionMenu>}
                </>);

                // selectElm.getOptGroup((library.name || 'Unnamed Library') + '', () =>
                //     library.getPresets().map(config => selectElm.getOption(config.url, config.name)),
                // ),
                //     selectElm.getOptGroup('Libraries', () =>
                //             library.getLibraries().map(config => selectElm.getOption(config.url, config.name)),
                //         {disabled: library.libraryCount === 0}
                //     ),
                //     selectElm.getOptGroup('Other Libraries', () =>
                //             Library.eachHistoricLibrary(config => selectElm.getOption(config.url, config.name)),
                //         {disabled: Library.historicLibraryCount === 0}
                //     ),
            case 'preset-list':
                if(library.getPresets().length === 0)
                    return <ActionMenu disabled>No presets</ActionMenu>;
                return library.getPresets().map(config => (
                    <ActionMenu>{config.name}</ActionMenu>
                ));

            case 'library-list':
                return library.getLibraries().map(config => (
                    <ActionMenu onAction={e=>{this.changeLibrary(config.url); return false;}}>{config.name}</ActionMenu>
                ));

            case 'config':
                /**
                 *
                 *



                 Menu.createElement({}, 'Change Instrument to',
                 async () => {
                                const instrumentLibrary = await Library.loadDefaultLibrary(); // TODO: get default library url from composer?
                                return instrumentLibrary.getInstruments().map((instrumentConfig) =>
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

    instrumentReplace(e, instrumentClassName, instrumentConfig={}) {
        const instrumentID = this.props.instrumentID;
        instrumentConfig = InstrumentLoader.createInstrumentConfig(instrumentClassName, instrumentConfig);
        this.getSong().instrumentReplace(instrumentID, instrumentConfig);
    }
    instrumentRename(e) {
        const instrumentID = this.props.instrumentID;
        const instrumentConfig = this.getSong().getInstrumentConfig(instrumentID);
        const newName = window.prompt(`Rename instrument (${instrumentID}): `, instrumentConfig.title);
        this.getSong().instrumentRename(instrumentID, newName);
        // this.forceUpdate();
    }
    instrumentRemove(e) {
        const instrumentID = this.props.instrumentID;
        this.getSong().instrumentRemove(instrumentID);
    }

    async loadPreset(presetName) {
        const instrumentID = this.props.instrumentID;
        const presetConfig = this.state.library.getPresetConfig(presetName);
        const instrumentConfig = this.getSong().getInstrumentConfig(instrumentID);
        Object.assign(instrumentConfig, presetConfig);
        console.log('instrumentConfig', instrumentConfig);

        await this.getSong().instrumentReplace(instrumentID, instrumentConfig);
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
        //         Button.createElement('title', titleHTML, e => this.toggleContainer(e)),
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
        //         //         instrumentLibrary.getInstruments().map((instrumentConfig) =>
        //         //             selectElm.getOption(instrumentConfig.url, instrumentConfig.name)),
        //         //     'Set Instrument'
        //         // )
        //     ]),
        //
        //     // this.buttonToggle = Button.createElement('instrument-id',
        //     //     e => this.form.classList.toggle('selected'),
        //     //     instrumentIDHTML + ':'
        //     // ),
        //     // this.textName = InputText.createElement('instrument-name',
        //     //     (e, newInstrumentName) => this.stateRename(newInstrumentName),
        //     //     'Instrument Name',
        //     //     this.config.name || '',
        //     //     'Unnamed'
        //     // ),
        //     // Button.createElement('instrument-remove',
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
        //                 // Button.createElement('id', (e) => this.moveSample(sampleID), sampleID, 'Sample ' + sampleID);
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
        //                 Button.createElement('remove',
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
        //                                 library.getLibraries().map(config => selectElm.getOption(config.url, config.name)),
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
