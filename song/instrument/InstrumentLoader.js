import AudioSourceSynthesizer from "../../instruments/synth/AudioSourceSynthesizer";
// import SPCPlayerSynthesizer from "../instruments/chip/SPCPlayerSynthesizer";
import GMEPlayerSynthesizer from "../../instruments/gme/GMEPlayerSynthesizer";
import GMEPlayerSynthesizerRenderer from "../../instruments/gme/GMEPlayerSynthesizerRenderer";
import AudioSourceSynthesizerRenderer from "../../instruments/synth/render/AudioSourceSynthesizerRenderer";
// import {ConfigListener} from "./ConfigListener";

class InstrumentLoader {
    constructor(song) {
        this.song = song;
    }

    loadInstrumentInstance(instrumentID) {
        const config = this.song.getInstrumentConfig(instrumentID);
        if (!config.className)
            throw new Error("Invalid instruments class");
        let instrumentClassName = config.className;
        // let instrumentClassURL = new URL(instrumentPreset.url, document.location.origin); // This should be an absolute url;

        // const configProxy = new Proxy(config, new InstrumentConfigListener(config, this.song, instrumentID));

        // const instrumentPath = ['instruments', instrumentID];
        // const concatPath = (path) => ['instruments', instrumentID].concat(path);


        const {classInstrument} = InstrumentLoader.getInstrumentClass(instrumentClassName);
        const props = {
            config,
            instrumentID,
            // updateConfig: (path=[], newValue) => this.song.updateDataByPath(concatPath(path), newValue),
            // spliceConfig: (path=[], deleteCount, ...newValues) => this.song.spliceDataByPath(concatPath(path), deleteCount, ...newValues),
        };
        return new classInstrument(props);
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


    static addInstrumentClass(classInstrument, classRenderer=null, title=null) {
        const className = classInstrument.name;
        const classes = InstrumentLoader.registeredInstrumentClasses;
        title = title || classInstrument.name;
        classes.push({classInstrument, classRenderer, className, title})
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

InstrumentLoader.addInstrumentClass(AudioSourceSynthesizer, AudioSourceSynthesizerRenderer, 'Audio Source Synthesizer');
// InstrumentLoader.addInstrumentClass(SPCPlayerSynthesizer, 'SPC Player Synthesizer');
InstrumentLoader.addInstrumentClass(GMEPlayerSynthesizer, GMEPlayerSynthesizerRenderer, 'Game Music Player Synthesizer');

export default InstrumentLoader;
