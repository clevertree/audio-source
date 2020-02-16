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
        if(!classes[className])
            throw new Error(`Class ${className} already registered`);
        return classes[className];
    }


    static addInstrumentClass(className, classObject) {
        const classes = InstrumentLoader.registeredInstrumentClasses;
        if(classes[className])
            throw new Error(`Class ${className} already registered`);
        classes[className] = classObject;
    }

}

InstrumentLoader.registeredInstrumentClasses = {};

InstrumentLoader.addInstrumentClass('AudioSourceSynthesizer', AudioSourceSynthesizer);
InstrumentLoader.addInstrumentClass('SPCPlayerSynthesizer', SPCPlayerSynthesizer);

export default InstrumentLoader;
