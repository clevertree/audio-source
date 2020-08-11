import {ArgType} from "../../../common/";


export default class LFOParameter {
    constructor(config={}) {
        // console.log('OscillatorInstrument', config);
        this.config = config;
        this.playingOSCs = [];
    }

    /** Command Args **/
    static argTypes = {
        playFrequency: [ArgType.destination, ArgType.frequency, ArgType.startTime, ArgType.duration, ArgType.velocity],
    };


    /** Playback **/

    addLFO(destination, parameter) {
        // TODO: vibrato LFO effect on parameters? don't wrap effect, just include it in instrument
        let vibratoLFO = destination.context.createOscillator();
        vibratoLFO.frequency.value = 5;

        let gainLFO = destination.context.createGain();
        gainLFO.gain.value = 10;
        gainLFO.connect(parameter);

        vibratoLFO.connect(gainLFO);
        vibratoLFO.start(startTime);


        return vibratoLFO;

    }

    playFrequency(destination, frequency, startTime, duration=null, velocity=null, onended=null) {
        // TODO: lfo or play?
    }




    stopPlayback() {
        // Stop all active sources
        // console.log("OscillatorInstrument.stopPlayback", this.playingOSCs);
        for (let i = 0; i < this.playingOSCs.length; i++) {
            // try {
                this.playingOSCs[i].stop();
            // } catch (e) {
            //     console.warn(e);
            // }
        }
        this.playingOSCs = [];
    }


    /** Static **/


    static unloadAll() {
        // this.waveURLCache = {}
        // Unload all cached samples from this program type
    }
}

