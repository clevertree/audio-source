import AudioSourceSynthesizer from "../instrument/synth/AudioSourceSynthesizer";
import SPCPlayerSynthesizer from "../instrument/chip/SPCPlayerSynthesizer";
import GMEPlayerSynthesizer from "chip-player-js-lib/src/players/GMEPlayer";
import {InstrumentConfigListener} from "./InstrumentConfigListener";

class InstrumentLoader {
    constructor(song) {
        this.song = song;
    }

    loadInstrumentInstance(instrumentID) {
        const config = this.song.getInstrumentConfig(instrumentID);
        if (!config.className)
            throw new Error("Invalid instrument class");
        let instrumentClassName = config.className;
        // let instrumentClassURL = new URL(instrumentPreset.url, document.location.origin); // This should be an absolute url;

        // const configProxy = new Proxy(config, new InstrumentConfigListener(config, this.song, instrumentID));

        const {classObject} = InstrumentLoader.getInstrumentClass(instrumentClassName);
        const props = {
            config,
            instrumentID,
            updateConfig: (config, path=[]) => this.song.updateInstrument(instrumentID, config, path)
        };
        return new classObject(props);
    }



    static getInstrumentClass(className) {
        const classes = InstrumentLoader.registeredInstrumentClasses;
        for(let i=0; i<classes.length; i++) {
            const classInfo = classes[i];
            if(classInfo.className === className)
                return classInfo;
        }
        throw new Error(`Instrument class ${className} was not found`);
    }



    static createInstrumentConfig(className, instrumentConfig={}) {
        this.getInstrumentClass(className); // TODO: default config?
        instrumentConfig.className = className;
        return instrumentConfig;
    }


    static addInstrumentClass(classObject, title=null) {
        const className = classObject.name;
        const classes = InstrumentLoader.registeredInstrumentClasses;
        title = title || classObject.name;
        classes.push({classObject, className, title})
    }

    static getInstruments() { return InstrumentLoader.registeredInstrumentClasses; }
        // const classes = InstrumentLoader.registeredInstrumentClasses;
        // const results = [];
        // for(let i=0; i<classes.length; i++) {
        //     const classInfo = classes[i];
        //     const {classObject, name, config} = classInfo;
        //     const result = callback(classObject, name, config);
        //     if(result !== null) results.push(result);
        //     if(result === false) break;
        // }
        // return results;
    // }
}

InstrumentLoader.registeredInstrumentClasses = [];

InstrumentLoader.addInstrumentClass(AudioSourceSynthesizer, 'Audio Source Synthesizer');
InstrumentLoader.addInstrumentClass(SPCPlayerSynthesizer, 'SPC Player Synthesizer');
InstrumentLoader.addInstrumentClass(GMEPlayerSynthesizer, 'Game Music Player');

export default InstrumentLoader;
