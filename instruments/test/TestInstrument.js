
class TestInstrument {
    constructor(config={}, audioContext=null) {
        this.config = {};
        this.audioContext = audioContext;
    }


    /** Playback **/

    playFrequency(destination, frequency, startTime, duration, velocity, onended=null) {
        console.log('playFrequency(', frequency, startTime, duration, velocity, ')')
    }


}

export default TestInstrument;


