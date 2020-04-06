import React from "react";
import {
    Div,
    Icon,
    // Button,
    ButtonDropDown,
    MenuAction,
    MenuDropDown, Button, MenuBreak, Scrollable,
} from "../../components";

import InstrumentLoader from "../../song/instrument/InstrumentLoader";

// import Library from "../../song/Library";
import "./assets/InstrumentRenderer.css";

class InstrumentRenderer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: true
        }
    }

    getComposer() { return this.props.composer; }
    getSong() { return this.getComposer().getSong(); }

    render() {
        const song = this.getSong();
        const instrumentID = this.props.instrumentID;
        const instrumentIDHTML = (instrumentID < 10 ? "0" : "") + (instrumentID);


        // let contentClass = 'error';
        let titleHTML = '';
        if (song.hasInstrument(instrumentID)) {
            titleHTML = this.props.instrumentConfig.title || "No Title"

        } else {
            titleHTML = `Empty`;
        }
        return (
            <Div className="asc-instrument-renderer-empty">
                <Div className="header">
                    <Button
                        className="toggle-container"
                        onAction={e => this.toggleContainer(e)}
                    >{instrumentIDHTML}: {titleHTML}</Button>
                    <ButtonDropDown
                        arrow={false}
                        className="instrument-config"
                        options={() => this.renderMenuRoot()}
                    >
                        <Icon className="config"/>
                    </ButtonDropDown>
                </Div>
                {this.state.open ? <Div className="content">
                    {this.renderInstrumentContent()}
                </Div> : null}
            </Div>
        );

        // return content;
    }

    renderInstrumentContent() {
        try {
            return this.getSong().instrumentLoadRenderer(this.props.instrumentID);

        } catch (e) {
            return e.message;
        }
    }

    /** Actions **/


    toggleContainer() {
        this.setState({open: !this.state.open});
    }


    /** Menu **/




    renderMenuRoot(e) {
        return (<>
            <MenuDropDown options={() => this.renderMenuChangePreset()}>Change Preset</MenuDropDown>
            <MenuBreak />
            <MenuDropDown options={() => this.renderMenuChange()}>Change Instrument</MenuDropDown>
            <MenuAction onAction={e => this.instrumentRename(e)}>Rename Instrument</MenuAction>
            <MenuAction onAction={e => this.instrumentRemove(e)}>Remove Instrument</MenuAction>
        </>);
    }

    renderMenuChange(e) {
        return (<>
            {InstrumentLoader.getInstruments().map(config =>
                <MenuAction onAction={e => this.instrumentReplace(e, config.className)}>Change instrument to '{config.title}'</MenuAction>
            )}
        </>);
    }

    renderMenuChangePreset(e) {
        let library = this.state.library;
        return (<>
            <MenuDropDown options={() => this.renderMenuLibraryList()}    >Libraries</MenuDropDown>
            <MenuBreak />
            <MenuAction onAction={()=>{}} disabled>Search</MenuAction>
            <MenuBreak />
            {false ? ( // library.getPresets().length > 0
                <Scrollable>
                    {library.getPresets().map(config => (
                        <MenuAction onAction={e => this.loadPreset(config.name)}>{config.name}</MenuAction>
                    ))}
                </Scrollable>
            ) : <MenuAction onAction={()=>{}} fdisabled> - Select a Library - </MenuAction>}
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
    }

    renderMenuPresetList(e) {
        let library = this.state.library;
        // if(library.getPresets().length === 0)
        //     return <Menu disabled>No presets</Menu>;
        return library.getPresets().map(config => (
            <MenuAction>{config.name}</MenuAction>
        ));
    }

    renderMenuLibraryList(e) {
        return 'TODO';
        let library = this.state.library;
        return library.getLibraries().map(config => (
            <MenuAction onAction={e=>{this.changeLibrary(config.url); return false;}}>{config.name}</MenuAction>
        ));
    }

    instrumentReplace(e, instrumentClassName, instrumentConfig={}) {
        const instrumentID = this.props.instrumentID;
        // instrumentConfig = InstrumentLoader.createInstrumentConfig(instrumentClassName, instrumentConfig);
        this.getSong().instrumentReplace(instrumentID, instrumentConfig);
    }
    // instrumentRename(e) {
    //     const instrumentID = this.props.instrumentID;
    //     const instrumentConfig = this.getSong().getInstrumentConfig(instrumentID);
    //     const newName = window.prompt(`Rename instruments (${instrumentID}): `, instrumentConfig.name);
    //     this.getSong().instrumentRename(instrumentID, newName);
    // }
    instrumentRemove(e) {
        const instrumentID = this.props.instrumentID;
        this.getSong().instrumentRemove(instrumentID);
    }
}

export default InstrumentRenderer;
