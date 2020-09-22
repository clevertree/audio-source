import {ArgType} from "../../../song/";

let activeNotes = [];
export default class LFOParameter {
    constructor(config={}) {
        // console.log('LFOParameter', config);
        this.config = config;
        // this.playingLFOs = [];
    }

    /** Command Args **/
    static argTypes = {
        createLFO: [ArgType.destination, ArgType.frequency, ArgType.startTime, ArgType.duration, ArgType.velocity],
    };

    // let vibratoLFO = destination.context.createOscillator();
    // vibratoLFO.frequency.value = 5;
    //
    // let gainLFO = destination.context.createGain();
    // gainLFO.gain.value = 10;
    // gainLFO.connect(osc.frequency);
    //
    // vibratoLFO.connect(gainLFO);
    // vibratoLFO.start(startTime);

    /** Playback **/

    createLFO(destination, frequency, startTime, duration=null, velocity=null, onended=null) {
        // console.log('createLFO', destination, frequency, startTime, duration, velocity, this.config);
        let source = destination.context.createOscillator();
        if(typeof this.config.frequency !== "undefined")
            source.frequency.value = this.config.frequency;

        let amplitudeGain = destination.context.createGain();
        if(typeof this.config.amplitude !== "undefined")
            amplitudeGain.gain.value = this.config.amplitude / 100;
        let parameter = destination;
        if(this.config.parameter)
            parameter = destination[this.config.parameter];
        if(!parameter instanceof AudioParam)
            throw new Error("Invalid LFO destination");
        amplitudeGain.connect(parameter);

        source.connect(amplitudeGain);
        source.start(startTime);


        source.noteOff = (endTime=destination.context.currentTime) => {
            const i = activeNotes.indexOf(source);
            if(i !== -1) {
                activeNotes.splice(i, 1);
                source.stop(endTime)
                onended && onended();
            }
        };

        if(duration !== null) {
            if(duration instanceof Promise) {
                // Support for duration promises
                duration.then(() => source.noteOff())
            } else {
                source.noteOff(startTime + duration);
            }
        }

        // this.playingLFOs.push(source);
        // source.onended = () => {
        //     const i = this.playingLFOs.indexOf(source);
        //     if(i !== -1)
        //         this.playingLFOs.splice(i, 1);
        // };
        return source;
    }



    /** Playback **/

    // playFrequency(destination, frequency, startTime, duration=null, velocity=null, onended=null) {
    // }




    // stopPlayback() {
    //     // Stop all active sources
    //     // console.log("OscillatorInstrument.stopPlayback", this.playingOSCs);
    //     for (let i = 0; i < this.playingLFOs.length; i++) {
    //         // try {
    //             this.playingLFOs[i].stop();
    //         // } catch (e) {
    //         //     console.warn(e);
    //         // }
    //     }
    //     this.playingLFOs = [];
    // }

    /** Static **/


    static stopPlayback() {
        for(const activeNote of activeNotes)
            activeNote.stop();
        activeNotes = [];
    }
}

