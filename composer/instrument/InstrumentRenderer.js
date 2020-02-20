import React from "react";
import Div from "../../components/div/Div";
import Icon from "../../components/icon/Icon";
import Menu from "../../components/menu/Menu";
import InputButton from "../../components/input-button/InputButton";
import InputFile from "../../components/input-file/InputFile";
import InputRange from "../../components/input-range/InputRange";
import InputText from "../../components/input-text/InputText";
import InputSelect from "../../components/input-select/InputSelect";
import {Scrollable} from "../../components";
// import Library from "../../song/Library";

class InstrumentRenderer extends React.Component {

    getComponents() {
        return {
            Div,
            Menu,
            Icon,
            InputButton,
            InputFile,
            InputRange,
            InputText,
            InputSelect
        }
    }

    renderInstrumentConfig() {
        return (
            <Menu
                arrow
                vertical
                className="instrument-config"
                options={e => this.renderMenu('config')}
            >
                <Icon className="config"/>
            </Menu>
        )
    }


    renderMenu(menuKey = null) {
        // let library;
//             console.log('renderMenu', menuKey);
        switch (menuKey) {
            case 'config':
                return (<>
                    <Menu options={e => this.renderMenu('file')}>File</Menu>
                    <Menu options={e => this.renderMenu('playlist')}>Playlist</Menu>
                    <Menu options={e => this.renderMenu('view')}>View</Menu>
                </>);


            // case 'config':
            //     library = this.state.library;
            //     return (<>
            //         <Menu options={e => this.renderMenu('library-list')}>Libraries</Menu>
            //         <Menu.Break/>
            //         <Menu disabled>Search</Menu>
            //         <Menu.Break/>
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

    render() {
        const song = this.props.song;
        const instrumentID = this.props.instrumentID;
        const instrumentIDHTML = (instrumentID < 10 ? "0" : "") + (instrumentID);



        if (song.hasInstrument(instrumentID)) {

            try {
                const instrument = song.loadInstrument(instrumentID);
                // const instrumentConfig = song.getInstrumentConfig(instrumentID);

                if (!instrument) {
                    return <Div className="loading">Loading</Div>;
                } else if (instrument.constructor && typeof instrument.constructor.getRenderer === "function") {
                    const renderer = instrument.constructor.getRenderer(
                        song,
                        instrumentID,
                        this.getComponents()
                    );
                    return renderer;

                // } else if (instrument instanceof HTMLElement) {
                //     content.push(instrument);
                } else {
                    return <Div>
                        <Div className="error">No Instrument Renderer</Div>
                        {this.renderInstrumentConfig()}
                    </Div>;
                }

            } catch (e) {
                return <Div>
                    <Div className="error">{e.message}</Div>
                    {this.renderInstrumentConfig()}
                </Div>;
            }

        } else {
            let titleHTML = `${instrumentIDHTML}: No Instrument`;
            return <Div className="header">
                <Div className="error">{titleHTML}</Div>
                {this.renderInstrumentConfig()}
            </Div>
            // content = [
            //     Div.createElement('header', [
            //         this.menu = Menu.cME(
            //             {vertical: true},
            //             titleHTML,
            //             [
            //                 Menu.cME({}, 'Change Instrument to',
            //                     async () => {
            //                         const instrumentLibrary = await Library.loadDefaultLibrary(); // TODO: get default library url from composer?
            //                         return instrumentLibrary.getInstruments().map((instrumentConfig) =>
            //                             Menu.cME({}, instrumentConfig.name, null, () => {
            //                                 song.instrumentReplace(instrumentID, instrumentConfig);
            //                             })
            //                         );
            //                     }
            //                 ),
            //                 Menu.cME({}, 'Rename Instrument', null, () => song.instrumentRename(instrumentID)),
            //                 Menu.cME({}, 'Remove Instrument', null, () => song.instrumentRemove(instrumentID)),
            //             ]
            //         ),
            //     ]),
            // ]
        }

        // return content;
    }
}

export default InstrumentRenderer;
