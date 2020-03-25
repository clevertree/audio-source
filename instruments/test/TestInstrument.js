import InstrumentLoader from "../../song/instrument/InstrumentLoader";
import PolyphonyInstrument from "../poly/PolyphonyInstrument";
import PolyphonyInstrumentRenderer from "../poly/render/PolyphonyInstrumentRenderer";

class TestInstrument {
    constructor(config={}, audioContext=null) {
        this.config = {};
        this.audioContext = audioContext;
    }


    /** Playback **/

    playNote(destination, frequency, startTime, duration, velocity, onended=null) {
        console.log('playNote(', {destination, frequency, startTime, duration, velocity, onended}, ')')
    }


}

export default TestInstrument;


