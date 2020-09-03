import PeriodicWaveLoader from "./loader/PeriodicWaveLoader";
import {ArgType, ProgramLoader, Values} from "../../../common/";


export default class OscillatorInstrument {
    /** Command Args **/
    static argTypes = {
        playFrequency: [ArgType.destination, ArgType.frequency, ArgType.startTime, ArgType.duration, ArgType.velocity, ArgType.onended],
        pitchBendTo: [ArgType.frequency, ArgType.startTime, ArgType.duration, ArgType.onended],
    };

    /** Command Aliases **/
    static commandAliases = {
        pf: "playFrequency",
        bt: "pitchBendTo",
    }

    static defaultEnvelope = ['envelope', {}];


    constructor(config={}) {
        // console.log('OscillatorInstrument', config);
        this.config = config;
        this.playingOSCs = [];
        this.loadedPeriodicWave = null;


        // Envelope
        const [voiceClassName, voiceConfig] = this.config.envelope || OscillatorInstrument.defaultEnvelope;
        let {classProgram:envelopeClass} = ProgramLoader.getProgramClassInfo(voiceClassName);
        this.loadedEnvelope = new envelopeClass(voiceConfig);


        // LFOs
        this.loadedLFOs = [];
        const lfos = this.config.lfos || [];
        for (let lfoID=0; lfoID<lfos.length; lfoID++) {
            const lfo = lfos[lfoID];
            const [voiceClassName, voiceConfig] = lfo;
            let {classProgram:lfoClass} = ProgramLoader.getProgramClassInfo(voiceClassName);
            this.loadedLFOs[lfoID] = new lfoClass(voiceConfig);
        }


        this.activeMIDINotes = []
    }

    setPeriodicWave(oscillator, periodicWave) {
        if(!periodicWave instanceof PeriodicWave)
            throw new Error("Invalid Periodic Wave: " + typeof periodicWave);
        oscillator.setPeriodicWave(periodicWave)
    }

    /** Async loading **/

    async waitForAssetLoad() {
        if(this.config.url) {
            const service = new PeriodicWaveLoader();
            await service.loadPeriodicWaveFromURL(this.config.url);
        }
    }


    /** Playback **/

    playFrequency(destination, frequency, startTime, duration=null, velocity=null, onended=null) {
        let endTime;
        const config = this.config;
        const audioContext = destination.context;
        if(typeof duration === "number") {
            endTime = startTime + duration;
            if (endTime < audioContext.currentTime) {
                console.info("Skipping note: ", startTime, endTime, audioContext.currentTime)
                return false;
            }
        }
        if(startTime === null)
            startTime = audioContext.currentTime;
        else if(startTime < 0)
            startTime = 0; // TODO: adjust buffer offset.
        // console.log('playFrequency', frequency, startTime, duration, velocity, config);



        //         // Filter voice playback

        //         if (voiceConfig.keyLow && this.getCommandFrequency(voiceConfig.keyLow) > frequencyValue)
        //             continue;
        //         if (voiceConfig.keyHigh && this.getCommandFrequency(voiceConfig.keyHigh) < frequencyValue)
        //             continue;


        // https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode
        const source = destination.context.createOscillator();   // instantiate an oscillator
        source.frequency.value = frequency;    // set Frequency (hz)
        if (typeof config.detune !== "undefined")
            source.detune.value = config.detune;
        switch(config.type) {
            default:
                source.type = config.type;
                break;

            // case null:
            case 'custom':

                // Load Sample
                const service = new PeriodicWaveLoader();
                let periodicWave = service.tryCache(this.config.url);
                if(periodicWave) {
                    this.setPeriodicWave(source, periodicWave);
                } else {
                    service.loadPeriodicWaveFromURL(this.config.url)
                        .then(periodicWave => {
                            console.warn("Note playback started without an audio buffer: " + config.url);
                            this.setPeriodicWave(source, periodicWave);
                        });
                }

                break;
        }


        // Envelope

        let amplitude = 1;
        if(typeof config.mixer !== "undefined")
            amplitude = config.mixer / 100;
        if(velocity !== null)
            amplitude *= parseFloat(velocity || 127) / 127;
        const gainNode = this.loadedEnvelope.createEnvelope(destination, startTime, amplitude);
        destination = gainNode;

        // LFOs

        const activeLFOs = [];
        for(const LFO of this.loadedLFOs) {
            activeLFOs.push(LFO.createLFO(source, frequency, startTime, null, velocity));
        }


        // Connect Source
        source.connect(destination);
        // Start Source
        source.start(startTime);
        // console.log("Note Start: ", config.url, frequency);

        // Set up Note-Off
        source.noteOff = (endTime=audioContext.currentTime) => {
            gainNode.noteOff(endTime); // End Envelope on the note end time

            // Get the source end time, when the note actually stops rendering
            const sourceEndTime = this.loadedEnvelope.increaseDurationByRelease(endTime);
            for(const lfo of activeLFOs) {
                lfo.noteOff(sourceEndTime); // End LFOs on the source end time.
            }
            // console.log('noteOff', {frequency, endTime, sourceEndTime});

            // Stop the source at the source end time
            source.stop(sourceEndTime);
        };

        // Set up on end.
        source.onended = () => {
            if(hasActiveNote(source)) {
                removeActiveNote(source);
                activeLFOs.forEach(lfo => lfo.stop());
                onended && onended();
            }
            // console.log("Note Ended: ", config.url, frequency);
        }

        // Add Active Note
        activeNotes.push(source);

        // If Duration, queue note end
        if(duration !== null) {
            if(duration instanceof Promise) {
                // Support for duration promises
                duration.then(() => source.noteOff())
            } else {
                source.noteOff(startTime + duration);
            }
        }

        // Return source
        return source;
    }


    /** MIDI Events **/

    playMIDIEvent(destination, eventData, onended=null) {
        let newMIDICommand;
        // console.log('playMIDIEvent', eventData);
        switch (eventData[0]) {
            case 144:   // Note On
                newMIDICommand = Values.instance.getCommandFromMIDINote(eventData[1]);
                const newMIDIFrequency = Values.instance.parseFrequencyString(newMIDICommand);
                let newMIDIVelocity = Math.round((eventData[2] / 128) * 100);
                const source = this.playFrequency(destination, newMIDIFrequency, null, null, newMIDIVelocity);
                if(source) {
                    if (this.activeMIDINotes[newMIDICommand])
                        this.activeMIDINotes[newMIDICommand].noteOff();
                    this.activeMIDINotes[newMIDICommand] = source;
                }
                return source;

            case 128:   // Note Off
                newMIDICommand = Values.instance.getCommandFromMIDINote(eventData[1]);
                if(this.activeMIDINotes[newMIDICommand]) {
                    this.activeMIDINotes[newMIDICommand].noteOff();
                    delete this.activeMIDINotes[newMIDICommand];
                    return true;
                } else {
                    console.warn("active note missing: ", newMIDICommand, eventData);
                    return false;
                }

            default:
                break;
        }
    }


    /** Pitch Bend **/

    pitchBendTo(frequency, startTime, duration) {
        // if(typeof frequency === "string")
        //     frequency = Values.instance.parseFrequencyString(frequency);
        const values = [frequency, frequency*2]

        for (let i = 0; i < this.playingOSCs.length; i++) {
            this.playingOSCs[i].frequency.setValueCurveAtTime(values, startTime, duration)
        }
    }




    /** Static **/

    static stopPlayback() {
        for(const activeNote of activeNotes)
            activeNote.stop();
        activeNotes = [];
    }

    static unloadAll() {
        // this.waveURLCache = {}
        // Unload all cached samples from this program type
    }
}


let activeNotes = [];
function removeActiveNote(source) {
    const i=activeNotes.indexOf(source);
    if(i !== -1)
        activeNotes.splice(i, 1);
}
function hasActiveNote(source) {
    return activeNotes.indexOf(source) !== -1;
}


