import React from "react";
import WebView from "react-native-webview";

export default class SongProxyWebView extends React.Component {
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

    render() {
        const javascript = `
document.addEventListener("message", function(event) {
    console.log("Received post message", event.data);

    window.ReactNativeWebView.postMessage('echo ' + event.data);

}, false);
`


        return <WebView
            ref={this.webView}
            injectedJavaScript={javascript}
            onMessage={this.onMessage}
            />
    }

    sendSongCommand(...args) {
        args.unshift('song');
        const argString = JSON.stringify(args);
        const webView = this.webView.current;
        webView.postMessage(argString);
        console.log('postMessage', argString);
    }

    onMessage(data) {
        console.log("Message: ", data.nativeEvent.data);
    }
}
