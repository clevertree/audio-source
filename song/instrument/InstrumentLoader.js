import React from "react";
import {MenuAction, MenuBreak} from "../../components/menu";

class InstrumentLoader {
    constructor(song, audioContext) {
        this.song = song;
        this.audioContext = audioContext;
        // this.destinations = new WeakMap();
    }

    loadInstanceFromDestination(instrumentID, destination) {
        return this.instrumentLoadInstance(instrumentID);
        // let instruments = this.destinations.get(destination);
        // if(!instruments) {
        //     instruments = {};
        //     this.destinations.set(destination, instruments);
        // }
        // if(typeof instruments[instrumentID] === "undefined")
        //     instruments[instrumentID] = this.instrumentLoadInstance(instrumentID);

        // return instruments[instrumentID];
    }

    instrumentGetData(instrumentID) {
        if (!this.song.data.instruments[instrumentID])
            throw new Error("Invalid instrument ID: " + instrumentID);
        return this.song.data.instruments[instrumentID];
    }


    instrumentGetClassName(instrumentID) {
        const [className] = this.instrumentGetData(instrumentID);
        return className;
    }
    instrumentGetConfig(instrumentID) {
        const [, config] = this.instrumentGetData(instrumentID);
        return config;
    }
    instrumentGetClass(instrumentID) {
        const className = this.instrumentGetClassName(instrumentID);
        const {classInstrument} = InstrumentLoader.getInstrumentClassInfo(className);
        return classInstrument;
    }

    instrumentLoadInstance(instrumentID) {
        const [className, config] = this.instrumentGetData(instrumentID);
        const {classInstrument} = InstrumentLoader.getInstrumentClassInfo(className);
        return new classInstrument(config, this.audioContext);
        // console.info("Instrument loaded: ", instrument, instrumentID);
        // return instrument;
    }

    instrumentLoadRenderer(instrumentID) {
        const [className, config] = this.instrumentGetData(instrumentID);
        const {classRenderer: Renderer} = InstrumentLoader.getInstrumentClassInfo(className);
        return <Renderer
            instrumentID={instrumentID}
            config={config}
        />;
    }


    /** Actions **/

    unloadAllInstruments() {
        const classes = InstrumentLoader.registeredInstrumentClasses;
        for(let i=0; i<classes.length; i++) {
            const {classInstrument} = classes[i];
            if(!classInstrument.unloadAll) {
                console.warn(classInstrument.name + " has no static unloadAll method");
                continue;
            }
            classInstrument.unloadAll();
        }

    }

    /** Menu **/



    /** Static **/

    static getInstrumentClassInfo(className) {
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

