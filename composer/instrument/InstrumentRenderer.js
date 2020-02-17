import React from "react";
import Div from "../../components/div/Div";
// import Icon from "../../components/icon/Icon";
import Menu from "../../components/menu/Menu";
// import Library from "../../song/Library";
// import InputButton from "../../components/input-button/InputButton";
// import InputText from "../../components/input-text/InputText";

class InstrumentRenderer extends React.Component {


    render() {
        const song = this.props.song;
        const instrumentID = this.props.id;
        const instrumentIDHTML = (instrumentID < 10 ? "0" : "") + (instrumentID);


        if (song.hasInstrument(instrumentID)) {

            try {
                const instrument = song.getLoadedInstrument(instrumentID);
                // const instrumentConfig = song.getInstrumentConfig(instrumentID);

                if (!instrument) {
                    return <Div className="loading">Loading</Div>;
                } else if (instrument.constructor && typeof instrument.constructor.getRenderer === "function") {
                    const renderer = instrument.constructor.getRenderer(
                        song,
                        instrumentID,
                    );
                    return renderer;

                // } else if (instrument instanceof HTMLElement) {
                //     content.push(instrument);
                } else {
                    return <Div className="error">No Instrument Renderer</Div>;
                }

            } catch (e) {
                return <Div className="error">{e.message}</Div>;
            }

        } else {
            let titleHTML = `${instrumentIDHTML}: No Instrument`;
            return <Div className="header">
                <Menu
                    options={() => <>
                        <Menu />
                    </>}
                    vertical>{titleHTML}</Menu>

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
            //                         return instrumentLibrary.eachInstrument((instrumentConfig) =>
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
