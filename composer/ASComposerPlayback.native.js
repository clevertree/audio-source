import React from "react";

import {Song} from "../song";
import ASComposerActions from "./ASComposerActions";
import SongProxyListener from "../song/proxy/SongProxyListener";
import SongProxyWebView from "../song/proxy/SongProxyWebView";
import {ConfigListener} from "../song/config/ConfigListener";

// import {TrackInfo} from "./track/";

export default class ASComposerPlayback extends ASComposerActions {

    constructor(props) {
        super(props);
        this.audioContext = null;
        this.webViewProxy = React.createRef();
    }


    loadMIDIInterface(callback) {
    }

    /** Render WebView Proxy **/
    renderWebViewProxy() {
        return <SongProxyWebView
            ref={this.webViewProxy}
        />
    }

    /** Song Proxy **/

    setCurrentSong(song) {
        if(!song instanceof Song)
            throw new Error("Invalid Song object");
        song = new Proxy(song, new SongProxyListener(song, this.webViewProxy));
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
        await this.song.play(this.getAudioContext(), this.state.songPosition);
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

