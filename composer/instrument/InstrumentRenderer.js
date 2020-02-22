import React from "react";
import {
    Div,
    Icon,
    SubMenu,
    SubMenuButton,
    ActionMenu
} from "../../components";

import InstrumentLoader from "../../instrument/InstrumentLoader";

// import Library from "../../song/Library";
import "./assets/InstrumentRenderer.css";

class InstrumentRenderer extends React.Component {


    getSong() { return this.props.song; }

    renderInstrumentConfig() {
        return (
            <SubMenuButton
                arrow={false}
                className="instrument-config"
                options={e => this.renderMenu()}
            >
                <Icon className="config"/>
            </SubMenuButton>
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
                    return instrument.constructor.getRenderer(
                        song,
                        instrumentID
                    );

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
                    <SubMenu options={e => this.renderMenu('change')}>Change Instrument</SubMenu>
                    <ActionMenu onAction={e => this.instrumentRename(e)} disabled={editDisabled}>Rename Instrument</ActionMenu>
                    <ActionMenu onAction={e => this.instrumentRemove(e)} disabled={editDisabled}>Remove Instrument</ActionMenu>
                </>);

            case 'change':
                return (<>
                    {InstrumentLoader.getInstruments().map(config =>
                        <ActionMenu onAction={e => this.instrumentReplace(e, config.className)}>Change instrument to '{config.title}'</ActionMenu>
                    )}
                </>);


            default:
                throw new Error("Unknown menu key: " + menuKey);

            // case 'config':
            //     library = this.state.library;
            //     return (<>
            //         <SubMenu options={e => this.renderMenu('library-list')}>Libraries</ActionMenu>
            //         <MenuBreak/>
            //         <Menu disabled>Search</ActionMenu>
            //         <MenuBreak/>
            //         {library.getPresets().length > 0 ? (
            //             <Scrollable>
            //                 {library.getPresets().map(config => (
            //                     <ActionMenu onAction={e => this.loadPreset(config.name)}>{config.name}</ActionMenu>
            //                 ))}
            //             </Scrollable>
            //         ) : <Menu disabled> - Select a Library - </ActionMenu>}
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
