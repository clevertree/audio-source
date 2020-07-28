import {Song} from "../song";
import ASComposerActions from "./ASComposerActions";

// import {TrackInfo} from "./track/";

export default class ASComposerPlayback extends ASComposerActions {

    loadMIDIInterface(callback) {
        // TODO: wait for user input
        console.log('navigator.requestMIDIAccess', navigator, navigator.requestMIDIAccess);
        if (navigator.requestMIDIAccess) {
            console.info("MIDI initializing");
            navigator.requestMIDIAccess().then(
                (MIDI) => {
                    console.info("MIDI initialized", MIDI);
                    const inputDevices = [];
                    MIDI.inputs.forEach(
                        (inputDevice) => {
                            inputDevices.push(inputDevice);
                            inputDevice.addEventListener('midimessage', callback);
                        }
                    );
                    console.log("MIDI input devices detected: " + inputDevices.map(d => d.name).join(', '));
                },
                (err) => {
                    throw new Error("error initializing MIDI: " + err);
                }
            );
        }
    }

    unloadMIDIInterface(callback) {

    }


    /** Song Proxy **/
    /**
     * Sets current composer song
     * @param song
     */
    setCurrentSong(song) {
        if(!song instanceof Song)
            throw new Error("Invalid Song object");
        return super.setCurrentSong(song);
    }

    getVolumeGain(destination) {
        if(!destination || !destination.context)
            throw new Error("Invalid destination");
        // if (this.volume !== null) {
        const context = destination.context;
        let gain = context.createGain();
        gain.gain.value = this.state.volume === null ? 1 : this.state.volume;
        gain.connect(destination);
        this.lastVolumeGain = gain;
        return gain;
        // }
        // return destination;
    }


    /** Playback **/


    getAudioDestination() {
        return this.getAudioContext().destination;
    }

    getAudioContext() {
        if (this.audioContext)
            return this.audioContext;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.audioContext = audioContext;
        return audioContext;
    }


}

