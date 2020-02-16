import React from "react";
import Div from "../../components/div/Div";
// import Icon from "../../components/icon/Icon";
import Menu from "../../components/menu/Menu";
import Library from "../../song/Library";
// import InputButton from "../../components/input-button/InputButton";
// import InputText from "../../components/input-text/InputText";

class InstrumentRenderer extends React.Component {
    constructor(props = {}, song, instrumentID) {
        super(props, {});
        this.props.id = instrumentID;
        this.song = song;
    }


    render() {
        const instrumentID = this.props.id;
        const instrumentIDHTML = (instrumentID < 10 ? "0" : "") + (instrumentID);

        let content = [];

        if (this.song.hasInstrument(instrumentID)) {

            try {
                const instrument = this.song.getLoadedInstrument(instrumentID);
                const instrumentConfig = this.song.getInstrumentConfig(instrumentID);

                if (!instrument) {
                    content.push(Div.createElement('loading', "Instrument Loading..."));
                } else if (instrument.constructor && typeof instrument.constructor.render === "function") {
                    content.push(instrument.constructor.render(
                        instrumentConfig,
                        this.song,
                        instrumentID,
                        this.getComponentClassList()
                    ));
                } else if (instrument instanceof HTMLElement) {
                    content.push(instrument);
                } else {
                    content.push(Div.createElement('error', "No Instrument Renderer"));
                }

            } catch (e) {
                content.push(Div.createElement('error', e.message));
            }
        } else {
            let titleHTML = `${instrumentIDHTML}: No Instrument`;
            content = [
                Div.createElement('header', [
                    this.menu = Menu.cME(
                        {vertical: true},
                        titleHTML,
                        [
                            Menu.cME({}, 'Change Instrument to',
                                async () => {
                                    const instrumentLibrary = await Library.loadDefaultLibrary(); // TODO: get default library url from composer?
                                    return instrumentLibrary.eachInstrument((instrumentConfig) =>
                                        Menu.cME({}, instrumentConfig.name, null, () => {
                                            this.song.instrumentReplace(instrumentID, instrumentConfig);
                                        })
                                    );
                                }
                            ),
                            Menu.cME({}, 'Rename Instrument', null, () => this.song.instrumentRename(instrumentID)),
                            Menu.cME({}, 'Remove Instrument', null, () => this.song.instrumentRemove(instrumentID)),
                        ]
                    ),
                ]),
            ]
        }

        return content;
    }
}

export default InstrumentRenderer;
