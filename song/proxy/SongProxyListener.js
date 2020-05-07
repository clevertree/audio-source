export default class SongProxyListener {
    constructor(song, webViewProxy) {
        this.song = song;
        this.webViewProxy = webViewProxy;

    }


    get(obj, prop) {
        // console.log('SongProxy.' + prop);
        switch(prop) { // TODO: support all common methods
            case 'playSelectedInstructions':
                return this.playSelectedInstructions.bind(this);
            // case TARGET: return obj;
            // case LISTENER: return this;
            // case 'indexOf': return (v,b,e) => obj.indexOf(v,b,e);
            // case 'splice': return (number, deleteCount, ...newValues) => this.splice(obj, this.path.concat(number), number, deleteCount, ...newValues);
            default:
                return this.song[prop];
        }
    }


    playSelectedInstructions(destination, trackName, selectedIndices) {
        const webProxy = this.webViewProxy.current;
        console.log('webProxy', webProxy);
        webProxy.sendSongCommand('playSelectedInstructions', destination, trackName, selectedIndices);
        // this.song.playSelectedInstructions(destination, trackName, selectedIndices)
    }
}
