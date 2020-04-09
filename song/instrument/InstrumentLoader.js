import React from "react";

class InstrumentLoader {
    constructor(song) {
        this.song = song;
        this.destinations = new WeakMap();
    }

    loadInstanceFromDestination(destination, instrumentID) {
        let instruments = this.destinations.get(destination);
        if(!instruments) {
            instruments = {};
            this.destinations.set(destination, instruments);
        }
        if(typeof instruments[instrumentID] === "undefined")
            instruments[instrumentID] = this.instrumentLoadInstance(instrumentID);

        return instruments[instrumentID];
    }



    instrumentLoadInstance(instrumentID) {
        const [className, config] = this.song.instrumentGetData(instrumentID);
        const {classInstrument} = InstrumentLoader.getInstrumentClass(className);
        const instrument = new classInstrument(config);
        console.info("Instrument loaded: ", instrument, instrumentID);
        return instrument;
    }

    instrumentLoadRenderer(instrumentID) {
        const [className, config] = this.song.instrumentGetData(instrumentID);
        const {classRenderer: Renderer} = InstrumentLoader.getInstrumentClass(className);
        return <Renderer
            instrumentID={instrumentID}
            config={config}
        />;
    }


    /** Static **/

    static getInstrumentClass(className) {
        const classes = InstrumentLoader.registeredInstrumentClasses;
        for(let i=0; i<classes.length; i++) {
            const classInfo = classes[i];
            if(classInfo.className === className)
                return classInfo;
        }
        throw new Error(`Instrument class ${className} was not found`);
    }



    static addInstrumentClass(classInstrument, classRenderer=null, title=null) {
        const className = classInstrument.name;
        const classes = InstrumentLoader.registeredInstrumentClasses;
        title = title || classInstrument.name;
        classes.push({classInstrument, classRenderer, className, title})
    }

    static getRegisteredInstruments() { return InstrumentLoader.registeredInstrumentClasses; }
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
    static registeredInstrumentClasses = []
}

export default InstrumentLoader;

