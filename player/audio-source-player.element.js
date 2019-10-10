/**
 * Player requires a modern browser
 */

class MusicPlayerElement extends HTMLElement {
    constructor() {
        super();
        this.song = new AudioSourceSong({}, this);
    }

    getAudioContext()               { return this.song.getAudioContext(); }
    getSongData()                   { return this.song.data; }
    getStartingBeatsPerMinute()     { return this.song.getStartingBeatsPerMinute(); }
    getVolumeGain()                 { return this.song.getVolumeGain(); }

    getVolume () {
        if(this.volumeGain) {
            return this.volumeGain.gain.value * 100;
        }
        return MusicPlayerElement.DEFAULT_VOLUME * 100;
    }
    setVolume (volume) {
        const gain = this.getVolumeGain();
        if(gain.gain.value !== volume) {
            gain.gain.value = volume / 100;
            console.info("Setting volume: ", volume);
        }
    }
    connectedCallback() {
        this.addEventListener('keydown', this.onInput);
        this.addEventListener('keyup', this.onInput);
        this.addEventListener('click', this.onInput);
        document.addEventListener('instrument:loaded', e => this.onSongEvent(e));

    }

    async onSongEvent(e) {
        switch(e.type) {
            case 'song:play':
                this.classList.add('playing');
                if(e.detail.promise) {
                    await e.detail.promise;
                    this.classList.remove('playing');
                }
                break;
            case 'song:end':
            case 'song:pause':
                // this.classList.remove('playing');
                break;
            case 'instrument:loaded':
                // this.renderer.loadAllInstruments();
                break;
        }
    }


    // Input

    onInput(e) {
        if(e.defaultPrevented)
            return;
        switch(e.type) {
            case 'click':
                break;
        }
    }


}
MusicPlayerElement.DEFAULT_VOLUME = 0.3;

// Define custom elements
customElements.define('audio-source-player', MusicPlayerElement);

// MusicPlayerElement.loadStylesheet('client/player/audio-source-player.css');
