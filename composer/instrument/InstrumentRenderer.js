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
import {Library} from "../../song";

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
        const instrumentConfig = song.instrumentGetData(instrumentID);
        const instrumentIDHTML = (instrumentID < 10 ? "0" : "") + (instrumentID);


        // let contentClass = 'error';
        let titleHTML = '';
        if (song.hasInstrument(instrumentID)) {
            titleHTML = instrumentConfig.title || "No Title"

        } else {
            titleHTML = `Empty`;
        }
        return (
            <Div className="asc-instrument-renderer-empty">
                <Div className="header">
                    <Button
                        className="toggle-container"
                        onAction={e => this.toggleContainer()}
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

    loadPreset(presetClassName, presetConfig) {
        console.log("Loading preset: ", presetClassName, presetConfig);
        const song = this.getSong();
        const instrumentID = this.props.instrumentID;
        song.instrumentReplace(instrumentID, presetClassName, presetConfig);
    }

    /** Menu **/




    renderMenuRoot() {
        return (<>
            <MenuDropDown options={() => this.renderMenuChangePreset()}>Change Preset</MenuDropDown>
            <MenuBreak />
            <MenuDropDown options={() => this.renderMenuChangeInstrument()}>Change Instrument</MenuDropDown>
            <MenuAction onAction={e => this.instrumentRename()}>Rename Instrument</MenuAction>
            <MenuAction onAction={e => this.instrumentRemove()}>Remove Instrument</MenuAction>
        </>);
    }

    renderMenuChangeInstrument() {
        const library = Library.loadDefault();
        return library.renderMenuInstrumentAll(([className, presetConfig]) => {
            this.loadPreset(className, presetConfig);
        });

    }

    renderMenuChangePreset() {
        const library = Library.loadDefault();
        const instrumentID = this.props.instrumentID;
        const instrumentClassName = this.getSong().instrumentGetClassName(instrumentID);
        return library.renderMenuInstrumentAllPresets((className, presetConfig) => {
            this.loadPreset(className, presetConfig);
        }, instrumentClassName);
    }


    instrumentReplace(e, instrumentClassName, instrumentConfig={}) {
        const instrumentID = this.props.instrumentID;
        // instrumentConfig = InstrumentLoader.createInstrumentConfig(instrumentClassName, instrumentConfig);
        this.getSong().instrumentReplace(instrumentID, instrumentClassName, instrumentConfig);
    }
    instrumentRename() {
        const instrumentID = this.props.instrumentID;
        this.getComposer().instrumentRename(instrumentID);
    }
    instrumentRemove() {
        const instrumentID = this.props.instrumentID;
        this.getSong().instrumentRemove(instrumentID);
    }
}

export default InstrumentRenderer;
