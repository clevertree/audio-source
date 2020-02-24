import React from "react";
import {
    Div,
    Icon,
    Menu,
    Button,
} from "../../components";

import InstrumentLoader from "../../instrument/InstrumentLoader";

// import Library from "../../song/Library";
import "./assets/InstrumentRenderer.css";

class InstrumentRenderer extends React.Component {


    getSong() { return this.props.song; }

    renderInstrumentConfig() {
        return (
            <Button
                arrow={false}
                className="instrument-config"
                onAction={e => this.renderMenu()}
            >
                <Icon className="config"/>
            </Button>
        )
    }


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

    renderMenu(menuKey = null) {
        // let library;
//             console.log('renderMenu', menuKey);
        switch (menuKey) {
            case null:
                const editDisabled = !this.getSong().hasInstrument(this.props.instrumentID);
                return (<>
                    <Menu options={e => this.renderMenu('change')}>Change Instrument</Menu>
                    <Menu onAction={e => this.instrumentRename(e)} disabled={editDisabled}>Rename Instrument</Menu>
                    <Menu onAction={e => this.instrumentRemove(e)} disabled={editDisabled}>Remove Instrument</Menu>
                </>);

            case 'change':
                return (<>
                    {InstrumentLoader.getInstruments().map(config =>
                        <Menu onAction={e => this.instrumentReplace(e, config.className)}>Change instrument to '{config.title}'</Menu>
                    )}
                </>);


            default:
                throw new Error("Unknown menu key: " + menuKey);

            // case 'config':
            //     library = this.state.library;
            //     return (<>
            //         <Menu options={e => this.renderMenu('library-list')}>Libraries</Menu>
            //         <MenuBreak/>
            //         <Menu disabled>Search</Menu>
            //         <MenuBreak/>
            //         {library.getPresets().length > 0 ? (
            //             <Scrollable>
            //                 {library.getPresets().map(config => (
            //                     <Menu onAction={e => this.loadPreset(config.name)}>{config.name}</Menu>
            //                 ))}
            //             </Scrollable>
            //         ) : <Menu disabled> - Select a Library - </Menu>}
            //     </>);

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
        const newName = window.prompt(`Rename instrument (${instrumentID}): `, instrumentConfig.name);
        this.getSong().instrumentRename(instrumentID, newName);
    }
    instrumentRemove(e) {
        const instrumentID = this.props.instrumentID;
        this.getSong().instrumentRemove(instrumentID);
    }
}

export default InstrumentRenderer;
