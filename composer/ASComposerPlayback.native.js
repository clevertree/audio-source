import React from "react";

import {Song} from "../song";
import SongProxyListener from "../song/proxy/SongProxyListener";
import SongProxyWebView from "../song/proxy/SongProxyWebView";
import ASComposerActions from "./ASComposerActions";

// import {TrackInfo} from "./track/";

export default class ASComposerPlayback extends ASComposerActions {

    constructor(props) {
        super(props);
        this.webViewProxy = React.createRef();
    }


    loadMIDIInterface(callback) {
    }

    /** Render WebView Proxy **/
    renderWebViewProxy() {
        return <SongProxyWebView
            composer={this}
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

    getVolumeGain(destination) {
        return destination;
        // }
        // return destination;
    }


    getAudioContext() {
        if (this.audioContext)
            return this.audioContext;

        const audioContext = {
            proxy: true,
            destination: null
        };
        this.audioContext = audioContext;
        return audioContext;
    }


}

