import React from "react";
import {View} from "react-native";

export default class SongProxyWebViewClient extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            song: null
        }
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

    render() {

        if(window && !window._AUDIOSOURCE) {
            window._AUDIOSOURCE = {
                SONGCLASSES: require('../')
            }


            document.addEventListener("message", (event) => {
                console.log("Received post message", event.data);
                this.postMessage('echo ' + event.data);

            }, false);

            this.postMessage(['load']);
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
