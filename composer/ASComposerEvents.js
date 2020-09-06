import ASComposerInput from "./ASComposerInput";

export default class ASComposerEvents extends ASComposerInput {

    /** Song Events **/

    async onSongEvent(e) {
        // console.log("Song Event: ", e.type);
        switch (e.type) {
            case 'log':
                this.setStatus(e.detail);
                break;

            case 'track:start':
            case 'track:end':
                break;

            case 'instruction:start':
            case 'instruction:end':
                // console.log(e.type, e.playingIndices);
                const track = this.trackGetRef(e.trackName, false);
                if(track)
                    track.updatePlayingIndices(e.playingIndices);

                // this.forceUpdate();
                break;

            case 'song:seek':
                this.setSongPosition(e.position);
                break;

            case 'song:volume':
                this.fieldSongVolume.value = e.detail.volume;
                break;

            case 'song:loaded':
                // this.trackerElm.renderDuration = this.song.data.timeDivision;
                break;

            case 'song:play':
                this.setState({playing: true});
                // this.fieldSongPlaybackPause.disabled = false;
                let updateCount = 0;
                const updateSongPositionInterval = setInterval(e => {
                    if (!this.song.isPlaying()) {
                        clearInterval(updateSongPositionInterval);
                        // this.fieldSongPlaybackPause.disabled = true;
                        this.setState({playing: false, paused: false});
                    }
                    this.setSongPosition(this.song.getSongPlaybackPosition(), true);
                    updateCount++;
                }, 10);
                break;

            case 'song:pause':
                if(this.state.playing)
                    this.setState({paused: true});
                break;

            case 'song:end':
                if(this.state.playing)
                    this.setState({playing: false, paused: false});
                break;


            case 'song:modified':
                // console.log(e.type);
                this.forceUpdate();  // TODO: might be inefficient
                // TODO: auto save toggle
                this.saveSongToMemoryWithTimeout();
                break;


            default:
                console.warn("Unknown song event: ", e.type);

        }
    }


}
