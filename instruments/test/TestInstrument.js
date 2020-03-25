
class TestInstrument {
    constructor(config={}, audioContext=null) {
        this.config = {};
        this.audioContext = audioContext;
    }


    /** Playback **/

    playNote(destination, frequency, startTime, duration, velocity, onended=null) {
        console.log('playNote(', frequency, startTime, duration, velocity, ')')
    }


}

export default TestInstrument;


