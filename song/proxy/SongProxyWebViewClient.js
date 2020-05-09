import React from "react";
import {View} from "react-native";
import Song from "../Song";

export default class SongProxyWebViewClient extends React.Component {
    constructor(props) {
        super(props);
        this.song = null;
        this.webView = React.createRef();
        this.cb = {
            onMessage: data => this.onMessage(data),
            onSongEvent: this.onSongEvent.bind(this)
        }
    }

    componentDidMount() {

    }

    shouldComponentUpdate(nextProps, nextState) {
        return false;
    }

    onSongEvent(e) {
        switch(e.type) {
            case 'song:modified':
                this.postMessage(e.type, e.historyAction)
                break;
        }
    }

    postMessage(args) {
        if(typeof args !== "string")
            args = JSON.stringify(args);

        if(!window.ReactNativeWebView)
            return console.warn('SongProxyWebViewClient.postMessage: window.ReactNativeWebView is ' + typeof window.ReactNativeWebView);

        window.ReactNativeWebView.postMessage(args);
    }

    render() {
        if(!this.song) {
            // window._AUDIOSOURCE = {
            //     SONGCLASSES: require('../')
            // }
            this.song = new Song();
            document._SONG = this.song;
            document.addEventListener('error', (...args) => this.postMessage(['error'].concat(args)))

            document.addEventListener("message", (event) => {
                this.onMessage(event.data);
            }, false);

            this.song.addEventListener('*', this.cb.onSongEvent)

            this.postMessage(['song:load', this.song.data.title]);
        }

        return <View/>;
    }

    onMessage(data) {
        if(data[0] === '[') {
            data = JSON.parse(data);
            this.handleCommand.apply(this, data);
        } else {
            console.warn("Unhandled message: " + data);
        }
    }

    handleCommand(command, ...args) {
        switch(command) {
            case 'song:load':
                let songData = args[0];
                songData = JSON.parse(songData);
                this.song.loadSongData(songData);
                console.log('song', this.song);
                break;

            case 'song':
                const songMethod = args.shift();
                switch(songMethod) {
                    case 'play':
                    case 'playSelectedInstructions':
                        if(args[0] === null)
                            args[0] = this.getAudioContext().destination;
                        break;
                    default:
                        break;
                }
                console.log(`song.${songMethod}(`, ...args, `)`);
                this.song[songMethod](...args);
                break;

            default:
                console.error("Unknown command: " + command);
        }
    }

    getAudioContext()               {
        if (this.audioContext)
            return this.audioContext;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.audioContext = audioContext;
        return audioContext;
    }

    // sendSongCommand(...args) {
    //     args.unshift('song');
    //     const argString = JSON.stringify(args);
    //     const webView = this.webView.current;
    //     webView.postMessage(argString);
    //     console.log('postMessage', argString);
    // }
    //
    // onMessage(data) {
    //     console.log("Message: ", data.nativeEvent.data);
    // }
}
