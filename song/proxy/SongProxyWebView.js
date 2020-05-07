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
            source={{
                uri: 'http://kittenton.local:3000/proxy'
            }}
            ref={this.webView}
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
