import React from "react";

import {Song} from "../song";
import ASComposerActions from "./ASComposerActions";

// import {TrackInfo} from "./track/";

export default class ASComposerPlayback extends ASComposerActions {

    constructor(props) {
        super(props);
        this.audioContext = null;
    }


    loadMIDIInterface(callback) {
    }


    /** Song Proxy **/

    setCurrentSong(song) {
        if(!song instanceof Song)
            throw new Error("Invalid Song object");
        return super.setCurrentSong(song);
    }


    /** Playback **/


    getAudioContext() {
        if (this.audioContext)
            return this.audioContext;

        const audioContext = {
            proxy: true
        };
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

