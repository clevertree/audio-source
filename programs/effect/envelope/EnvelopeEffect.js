
let activeNotes = [];

export default class EnvelopeEffect {
    constructor(config={}) {
        this.config = config;

        // if(this.config.voice) {
        //     //     throw new Error("Voice config is missing");
        //     const [voiceClassName, voiceConfig] = this.config.voice;
        //     let {classProgram: voiceClass} = ProgramLoader.getProgramClassInfo(voiceClassName);
        //     this.voice = new voiceClass(voiceConfig);
        // }
        // console.log(this.constructor.name, this);
    }


    /** Async loading **/

    async waitForAssetLoad() {
        // if(this.voice && typeof this.voice.waitForAssetLoad === "function")
        //     await this.voice.waitForAssetLoad();
    }

    /** Duration **/

    increaseDurationByRelease(duration) {
        if(typeof duration !== "number")
            throw new Error("Invalid duration: " + typeof duration);
        return duration + this.config.release / 1000;
    }

    /** Playback **/

    playFrequency(destination, frequency, startTime, duration=null, velocity=null, onended=null) {
        const audioContext = destination.context;

        const velocityValue = parseFloat(velocity || 127) / 127;
        let source = destination.context.createGain();

        // Attack is the time taken for initial run-up of level from nil to peak, beginning when the key is pressed.
        if(this.config.attack) {
            source.gain.value = 0;
            source.gain.linearRampToValueAtTime(velocityValue, startTime + (this.config.attack / 1000));
        } else {
            source.gain.value = velocityValue;
        }

        // Decay is the time taken for the subsequent run down from the attack level to the designated sustain level.
        // Sustain is the level during the main sequence of the sound's duration, until the key is released.
        // velocityGain.gain.linearRampToValueAtTime(velocityValue, startTime + duration);

        source.connect(destination);

        source.noteOff = (endTime=audioContext.currentTime) => {
            const i = activeNotes.indexOf(source);
            if(i !== -1) {
                activeNotes.splice(i, 1);
                // Release is the time taken for the level to decay from the sustain level to zero after the key is released.[4]
                const releaseDuration = this.increaseDurationByRelease(endTime);
                source.gain.linearRampToValueAtTime(0, releaseDuration);
                onended && onended();
            }
        };

        activeNotes.push(source);



        if(duration !== null) {
            if(duration instanceof Promise) {
                // Support for duration promises
                duration.then(function() {
                    source.noteOff(audioContext.currentTime);
                })
            } else {
                source.noteOff(startTime + duration);
            }
        }
        return source;
        // return this.voice.playFrequency(velocityGain, frequency, startTime, duration, velocity, onended);
    }


    /** MIDI Events **/

    // playMIDIEvent(destination, eventData, onended=null) {
    //     return this.voice.playFrequency(destination, eventData, onended);
    // }

    /** Static **/

    static stopPlayback() {
    }

    static unloadAll() {
    }

}



