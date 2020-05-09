import React from "react";
import WebView from "react-native-webview";

export default class SongProxyWebView extends React.Component {
    constructor(props) {
        super(props);
        this.webView = React.createRef();
        this.cb = {
            onMessage: data => this.onMessage(data.nativeEvent.data),
            // onLoad: () => this.sendSongCommand("Loaded"),
        }
    }

    getComposer() { return this.props.composer; }
    getSong() { return this.getComposer().getSong(); }

    shouldComponentUpdate(nextProps, nextState) {
        return false;
    }

    render() {
        console.log('SongProxyWebView.render');

// Android: <react-native-project>/android/app/src/main/assets/
// iOS: <react-native-project>/ios/<new group as folder>/ (Note: “New group as folder” will ensure all its contents are bundled into the IPA file.)
// htmlPath = "file:///android_asset/Resources/index.html"; //file path from native directory;
//         Platform.OS==='android'?'file:///android_asset/widget/index.html':'./external/widget/index.html'
        return <WebView
            originWhitelist={['file://*', 'https://*', 'http://*']}
            source={{
                // uri: 'http://kittenton.local:3000/blank',
                uri: 'file:///android_asset/proxy/index.html'
            }}
            ref={this.webView}
            // onError={e => console.error("WebView: ", e.nativeEvent)}
            onMessage={this.cb.onMessage}
            // onLoadEnd={this.cb.onLoad}
            />
    }

    sendSongCommand(...args) {
        args.unshift('song');
        this.sendCommand.apply(this, args);
    }

    sendCommand(...args) {
        const argString = JSON.stringify(args);
        const webView = this.webView.current;
        if(!webView)
            return console.error("Webview ref is not set");
        webView.postMessage(argString);
        console.log('postMessage', argString);
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
                let songData = this.getSong().getProxiedData();
                songData = JSON.stringify(songData);
                this.sendCommand('song:load', songData)
                break;

            default:
                console.error("Unknown command: " + command);
        }
    }
}
