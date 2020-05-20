
class TestInstrument {
    constructor(config={}, audioContext=null) {
        this.config = {};
        this.audioContext = audioContext;
    }


    /** Playback **/

    playFrequency(destination, frequency, startTime, duration=null, velocity=null, onended=null) {
        // console.info('playFrequency(', frequency, startTime, duration, velocity, ')')
    }


}

export default TestInstrument;


