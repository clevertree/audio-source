import {ArgType} from "../../../common/";


export default class LFOParameter {
    constructor(config={}) {
        // console.log('OscillatorInstrument', config);
        this.config = config;
        this.playingLFOs = [];
    }

    /** Command Args **/
    static argTypes = {
        playFrequency: [ArgType.destination, ArgType.frequency, ArgType.startTime, ArgType.duration, ArgType.velocity],
    };


    /** Playback **/

    playFrequency(destination, frequency, startTime, duration=null, velocity=null, onended=null) {
        let LFO = destination.context.createOscillator();
        if(typeof this.config.frequency !== "undefined")
            LFO.frequency.value = this.config.frequency;

        let amplitudeGain = destination.context.createGain();
        if(typeof this.config.amplitude !== "undefined")
            amplitudeGain.gain.value = this.config.amplitude;
        let parameter = destination;
        if(this.config.parameter)
            parameter = destination[this.config.parameter];
        if(!parameter instanceof AudioParam)
            throw new Error("Invalid LFO destination");
        amplitudeGain.connect(parameter);

        LFO.connect(destination);
        LFO.start(startTime);

        if(duration !== null) {
            if(duration instanceof Promise) {                // Support for duration promises
                duration.then(() => LFO.stop());
            } else {
                LFO.stop(startTime + duration);
            }
        }


        this.playingLFOs.push(LFO);
        LFO.onended = () => {
            const i = this.playingLFOs.indexOf(LFO);
            if(i !== -1)
                this.playingLFOs.splice(i, 1);
        };
        return LFO;
    }




    stopPlayback() {
        // Stop all active sources
        // console.log("OscillatorInstrument.stopPlayback", this.playingOSCs);
        for (let i = 0; i < this.playingLFOs.length; i++) {
            // try {
                this.playingLFOs[i].stop();
            // } catch (e) {
            //     console.warn(e);
            // }
        }
        this.playingLFOs = [];
    }


    /** Static **/


    static unloadAll() {
        // this.waveURLCache = {}
        // Unload all cached samples from this program type
    }
}

