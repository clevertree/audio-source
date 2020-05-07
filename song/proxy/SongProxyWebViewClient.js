import React from "react";
import {View} from "react-native";
import Song from "../Song";

export default class SongProxyWebViewClient extends React.Component {
    constructor(props) {
        super(props);
        this.song = null;
        this.webView = React.createRef();
        this.cb = {
            onMessage: data => this.onMessage(data)
        }
    }

    componentDidMount() {

    }

    shouldComponentUpdate(nextProps, nextState) {
        return false;
    }

    postMessage(args) {
        if(typeof args !== "string")
            args = JSON.stringify(args);

        if(!window.ReactNativeWebView)
            return console.warn('SongProxyWebViewClient.postMessage: window.ReactNativeWebView is ' + typeof window.ReactNativeWebView);

        window.ReactNativeWebView.postMessage(args);
    }

    handleMessage(args) {
        console.log("Host: ", args);
        this.postMessage('echo ' + args);
    }

    render() {
        if(!this.song) {
            // window._AUDIOSOURCE = {
            //     SONGCLASSES: require('../')
            // }
            this.song = new Song();
            window._SONG = this.song;


            document.addEventListener("message", (event) => {
                this.handleMessage(event.data);
            }, false);

            this.postMessage(['load', this.song.data.title]);
        }

        return <View/>;
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
