export default class SongProxyListener {
    constructor(song, webViewProxy) {
        this.song = song;
        this.webViewProxy = webViewProxy;

    }

    sendSongProxyCommand(...args) {
        const webProxy = this.webViewProxy.current;
        return webProxy.sendSongCommand(...args);
    }

    get(obj, prop) {
        // console.log('SongProxy.' + prop);
        switch(prop) { // Intercept song commands
            case 'play':
            case 'playSelectedInstructions':
                return this.getProxyCommand(prop);
            // case TARGET: return obj;
            // case LISTENER: return this;
            // case 'indexOf': return (v,b,e) => obj.indexOf(v,b,e);
            // case 'splice': return (number, deleteCount, ...newValues) => this.splice(obj, this.path.concat(number), number, deleteCount, ...newValues);
            default:
                return this.song[prop];
        }
    }

    getProxyCommand(methodName) {
        return (...args) => this.sendSongProxyCommand(methodName, ...args);
    }

}
