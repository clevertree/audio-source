import AudioSourceSynthesizer from "./synth/AudioSourceSynthesizer";
import SPCPlayerSynthesizer from "./chip/SPCPlayerSynthesizer";

class InstrumentLoader {
    constructor(song) {
        this.song = song;
    }

    loadInstrumentInstance(instrumentID) {
        const instrumentPreset = this.song.getInstrumentConfig(instrumentID);
        if (!instrumentPreset.class)
            throw new Error("Invalid instrument class");
        let instrumentClassName = instrumentPreset.class;
        // let instrumentClassURL = new URL(instrumentPreset.url, document.location.origin); // This should be an absolute url;

        const instrumentClass = InstrumentLoader.getInstrumentClass(instrumentClassName);
        return new instrumentClass(instrumentPreset, this, instrumentID);
    }



    static getInstrumentClass(className) {
        const classes = InstrumentLoader.registeredInstrumentClasses;
        for(let i=0; i<classes.length; i++) {
            const classInfo = classes[i];
            if(classInfo.name === className)
                return classInfo
        }
        throw new Error(`Instrument class ${className} was not found`);
    }


    static addInstrumentClass(classObject, className=null, classConfig={}) {
        const classes = InstrumentLoader.registeredInstrumentClasses;
        className = className || classObject.name;
        classes.push([classObject, className, classConfig])
    }

    static eachInstrumentClass(callback) {
        const classes = InstrumentLoader.registeredInstrumentClasses;
        const results = [];
        for(let i=0; i<classes.length; i++) {
            const classInfo = classes[i];
            const result = callback(classInfo[0], classInfo[1], classInfo[2]);
            if(result !== null) results.push(result);
            if(result === false) break;
        }
        return results;
    }
}

InstrumentLoader.registeredInstrumentClasses = [];

InstrumentLoader.addInstrumentClass(AudioSourceSynthesizer, 'Audio Source Synthesizer');
InstrumentLoader.addInstrumentClass(SPCPlayerSynthesizer, 'SPC Player Synthesizer');

export default InstrumentLoader;
