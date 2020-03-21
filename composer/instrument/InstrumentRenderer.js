import React from "react";
import {
    Div,
    Icon,
    MenuItem,
    SubMenuItem,
    Button,
} from "../../components";

import InstrumentLoader from "../../song/InstrumentLoader";

// import Library from "../../song/Library";
import "./assets/InstrumentRenderer.css";

class InstrumentRenderer extends React.Component {

    getComposer() { return this.props.composer; }
    getSong() { return this.getComposer().getSong(); }

    render() {
        const song = this.getSong();
        const instrumentID = this.props.instrumentID;
        const instrumentIDHTML = (instrumentID < 10 ? "0" : "") + (instrumentID);


        let contentClass = 'error';
        let contentHTML = '';
        if (song.hasInstrument(instrumentID)) {

            try {
                const instrument = song.loadInstrument(instrumentID);
                // const instrumentConfig = song.getInstrumentConfig(instrumentID);

                if (!instrument) {
                    contentHTML += `Loading`;

                } else if (instrument.constructor && typeof instrument.constructor.getRenderer === "function") {
                    return instrument.constructor.getRenderer({
                        song,
                        instrumentID,
                        openMenu: this.props.openMenu
                    });

                } else {
                    contentHTML += `No Instrument Renderer`;
                }

            } catch (e) {
                contentHTML += e.message;
            }

        } else {
            contentHTML = `Empty`;
        }
        return (
            <Div className="asc-instrument-renderer-empty">
                <Div className="header">
                    <Div className={contentClass}>{instrumentIDHTML}: {contentHTML}</Div>
                    {this.renderInstrumentConfig()}
                </Div>
            </Div>
        );

        // return content;
    }


    renderInstrumentConfig() {
        return (
            <Button
                arrow={false}
                className="instrument-config"
                onAction={e => this.openMenuRoot(e)}
            >
                <Icon className="config"/>
            </Button>
        )
    }

    openMenu(e, options) {
        this.getComposer().openMenu(e, options);
    }

    openMenuRoot(e) {
        const editDisabled = !this.getSong().hasInstrument(this.props.instrumentID);
        this.openMenu(e, <>
            <SubMenuItem onAction={e => this.openMenuReplaceInstrument(e)}>Change Instrument</SubMenuItem>
            {/*<MenuItem onAction={e => this.instrumentRename(e)} disabled={editDisabled}>Rename Instrument</MenuItem>*/}
            <MenuItem onAction={e => this.instrumentRemove(e)} disabled={editDisabled}>Remove Instrument</MenuItem>
        </>)
    }

    openMenuReplaceInstrument(e) {
        this.openMenu(e, InstrumentLoader.getInstruments().map((config, i) =>
            <MenuItem key={i} onAction={e => this.instrumentReplace(e, config.className)}>Change instrument to '{config.title}'</MenuItem>
        ));
    }


    instrumentReplace(e, instrumentClassName, instrumentConfig={}) {
        const instrumentID = this.props.instrumentID;
        instrumentConfig = InstrumentLoader.createInstrumentConfig(instrumentClassName, instrumentConfig);
        this.getSong().instrumentReplace(instrumentID, instrumentConfig);
    }
    // instrumentRename(e) {
    //     const instrumentID = this.props.instrumentID;
    //     const instrumentConfig = this.getSong().getInstrumentConfig(instrumentID);
    //     const newName = window.prompt(`Rename instrument (${instrumentID}): `, instrumentConfig.name);
    //     this.getSong().instrumentRename(instrumentID, newName);
    // }
    instrumentRemove(e) {
        const instrumentID = this.props.instrumentID;
        this.getSong().instrumentRemove(instrumentID);
    }
}

export default InstrumentRenderer;
