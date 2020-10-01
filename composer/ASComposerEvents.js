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

            case 'program:play':
            case 'program:stop':
                console.log(e.type, e);
                if(typeof e.programID !== "undefined") {
                    const programRef = this.programGetRef(e.programID);
                    programRef.updatePlayingFrequency(e.type.split(':').pop(), e.frequency);
                }
                break;

            case 'instruction:play':
            case 'instruction:stop':
                // console.log(e.type, e);
                if(e.trackName) {
                    const track = this.trackGetRef(e.trackName, false);
                    if (track)
                        track.updatePlayingIndices(e.playingIndices);
                }
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
                const updateSongPositionInterval = setInterval(e => {
                    if (!this.song.isPlaying()) {
                        clearInterval(updateSongPositionInterval);
                        // this.fieldSongPlaybackPause.disabled = true;
                        this.setState({playing: false, paused: false});
                    }
                    this.setSongPosition(this.song.getSongPlaybackPosition(), true);
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
                if(!this.timeouts.render) {
                    this.timeouts.render = setTimeout(() => {
                        clearTimeout(this.timeouts.render);
                        delete this.timeouts.render;
                        this.forceUpdate();
                    }, 100)
                }
                // console.log(e.type);
                // TODO: auto save toggle
                this.saveSongToMemoryWithTimeout();
                break;


            default:
                console.warn("Unknown song event: ", e.type);

        }
    }


}
