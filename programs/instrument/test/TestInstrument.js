
class TestInstrument {
    constructor(config={}) {
        // console.log(this.constructor.name, config);
        this.config = config;
    }


    /** Playback **/

    playFrequency(destination, frequency, startTime, duration=null, velocity=null, onended=null) {
        // console.info('playFrequency(', frequency, startTime, duration, velocity, ')')
    }

    stopPlayback() {

    }

}

export default TestInstrument;


