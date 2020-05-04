import React from "react";

import {Song} from "../song";
import ASComposerActions from "./ASComposerActions";

// import {TrackInfo} from "./track/";

export default class ASComposerPlayback extends ASComposerActions {
    constructor() {
        super();
        this.audioContext = null;
    }


    loadMIDIInterface(callback) {
        // TODO: wait for user input
        if (navigator.requestMIDIAccess) {
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


        /** Playback **/


    getAudioContext() {
        if (this.audioContext)
            return this.audioContext;

        const audioContext = new (window.AudioContext)();
        this.audioContext = audioContext;
        return audioContext;
    }


    /** Song Playback **/

    async songPlay() {
        await this.song.play(this.getVolumeGain(), this.state.songPosition);
    }

    async songPause() {
        this.song.stopPlayback();
    }

    async songStop() {
        if (this.song.playback)
            this.song.stopPlayback();
        this.song.setPlaybackPositionInTicks(0);
    }


}

