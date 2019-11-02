/**
 * Player requires a modern browser
 */

class MusicPlayerElement extends HTMLElement {
    constructor() {
        super();
        this.versionString = '-1';
        this.eventHandlers = [];
        this.shadowDOM = null;
        this.song = new AudioSourceSong({}, this);
    }

    getAudioContext()               { return this.song.getAudioContext(); }
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
        this.attachEventHandler([
            'song:loaded','song:play','song:end','song:stop','song:modified', 'song:seek',
            'group:play', 'group:seek',
            'note:start', 'note:end'
        ], this.onSongEvent);
        document.addEventListener('instrument:loaded', e => this.onSongEvent(e));

        this.attachEventHandler(['keyup', 'keydown', 'click'], e => this.onInput(e), this.shadowDOM, true);

        const src = this.getAttribute('src');
        if(src) {
            this.loadSongFromSrc(src);
        }

        this.render();
    }

    disconnectedCallback() {
        this.eventHandlers.forEach(eventHandler =>
            eventHandler[2].removeEventListener(eventHandler[0], eventHandler[1]));
    }

    attachEventHandler(eventNames, method, context, options=null) {
        if(!Array.isArray(eventNames))
            eventNames = [eventNames];
        for(let i=0; i<eventNames.length; i++) {
            const eventName = eventNames[i];
            context = context || this;
            context.addEventListener(eventName, method, options);
            this.eventHandlers.push([eventName, method, context]);
        }
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

    get containerElm() { return this.shadowDOM.querySelector('.asp-container'); }
    get statusElm() { return this.shadowDOM.querySelector(`.asp-status-container .status-text`); }
    get versionElm() { return this.shadowDOM.querySelector(`.asp-status-container .version-text`); }

    get menuFile() { return this.shadowDOM.querySelector(`asui-menu[key="file"]`)}
    get menuEdit() { return this.shadowDOM.querySelector(`asui-menu[key="edit"]`)}
    get menuView() { return this.shadowDOM.querySelector(`asui-menu[key="view"]`)}

    get panelSong() { return this.shadowDOM.querySelector(`asui-form[key='song']`)}

    render() {
        const linkHRefComposer = this.getScriptDirectory('player/audio-source-player.css');
        const linkHRefCommon = this.getScriptDirectory('common/audio-source-common.css');

        this.shadowDOM = this.shadowDOM || this.attachShadow({mode: 'open'});
        this.shadowDOM.innerHTML = `
        <link rel="stylesheet" href="${linkHRefComposer}" />
        <link rel="stylesheet" href="${linkHRefCommon}" />
        <div class="asp-container">
            <div class="asp-menu-container">
                <asui-menu key="file" caption="File"></asui-menu>
                <asui-menu key="edit" caption="Edit"></asui-menu>
                <asui-menu key="view" caption="View"></asui-menu>
            </div>
            <div class="asp-form-container">
                <asui-form key="song" caption="Song" class="panel"></asui-form>
            </div>
            <div class="asp-status-container">
                <span class="status-text"></span>
                <a href="https://github.com/clevertree/audio-source-composer" target="_blank" class="version-text">${this.versionString}</a>
            </div>
        </div>
        `;

        this.containerElm.classList.toggle('fullscreen', this.classList.contains('fullscreen'));

        this.renderMenu();
        this.renderSongForms();
    }


    renderMenu() {
        /** File Menu **/
        this.menuFile.populate = (e) => {
            const menu = e.menuElement;

            const menuFileOpenSong = menu.getOrCreateSubMenu('open', 'Open song ►');
            menuFileOpenSong.populate = (e) => {
                const menuFileOpenSongFromMemory = menuFileOpenSong.getOrCreateSubMenu('memory', 'from Memory ►');
                menuFileOpenSongFromMemory.populate = async (e) => {
                    const menu = e.menuElement;

                    const Storage = new AudioSourceStorage();
                    const songRecentUUIDs = await Storage.getRecentSongList() ;
                    for(let i=0; i<songRecentUUIDs.length; i++) {
                        const entry = songRecentUUIDs[i];
                        const menuOpenSongUUID = menu.getOrCreateSubMenu(entry.guid, entry.title);
                        menuOpenSongUUID.action = (e) => {
                            this.actions.loadSongFromMemory(entry.guid);
                        }
                    }

                };

                const menuFileOpenSongFromFile = menuFileOpenSong.getOrCreateSubMenu('file', `from File`);
                menuFileOpenSongFromFile.action = (e) => this.fieldSongFileLoad.inputElm.click(); // this.actions.loadSongFromFileInput(this.fieldSongFileLoad.inputElm);
                // menuFileOpenSongFromFile.disabled = true;
                const menuFileOpenSongFromURL = menuFileOpenSong.getOrCreateSubMenu('url', 'from URL');
                menuFileOpenSongFromURL.disabled = true;
            };

            const menuFileSaveSong = menu.getOrCreateSubMenu('save', 'Save song ►');
            menuFileSaveSong.populate = (e) => {
                const menuFileSaveSongToMemory = menuFileSaveSong.getOrCreateSubMenu('memory', 'to Memory');
                menuFileSaveSongToMemory.action = (e) => this.actions.saveSongToMemory(e);
                const menuFileSaveSongToFile = menuFileSaveSong.getOrCreateSubMenu('file', 'to File');
                menuFileSaveSongToFile.action = (e) => this.actions.saveSongToFile(e);
            };

        };

        /** View Menu **/
        this.menuView.populate = (e) => {
            const menu = e.menuElement;

            const menuViewToggleFullscreen = menu.getOrCreateSubMenu('fullscreen',
                `${this.classList.contains('fullscreen') ? 'Disable' : 'Enable'} Fullscreen`);
            menuViewToggleFullscreen.action = (e) => this.toggleFullscreen(e);
        };



    }

    renderSongForms() {

        /** Song Forms **/

        const panelSong = this.panelSong;
        if(!panelSong.hasInput('playback')) {
            this.formSongPlayback = panelSong.getOrCreateForm('playback', 'Playback');
            this.formSongPosition = panelSong.getOrCreateForm('position', 'Position');
            this.formSongVolume = panelSong.getOrCreateForm('volume', 'Volume');
            this.formSongFile = panelSong.getOrCreateForm('file', 'File');
            this.formSongName = panelSong.getOrCreateForm('name', 'Name');
            this.formSongVersion = panelSong.getOrCreateForm('version', 'Version');
            this.formSongBPM = panelSong.getOrCreateForm('bpm', 'BPM');
        }

        /** Tracker Fields **/

        if(!this.formSongPlayback.hasInput('play')) {
            this.fieldSongPlaybackPlay = this.formSongPlayback.addButton('play',
                e => this.actions.songPlay(e),
                this.formSongPlayback.createIcon('play'),
                "Play Song");
            this.fieldSongPlaybackPause = this.formSongPlayback.addButton('pause',
                e => this.actions.songPause(e),
                this.formSongPlayback.createIcon('pause'),
                "Pause Song");
            this.fieldSongPlaybackStop = this.formSongPlayback.addButton('pause',
                e => this.actions.songStop(e),
                this.formSongPlayback.createIcon('stop'),
                "Stop Song");

            this.fieldSongFileLoad = this.formSongFile.addFileInput('file-load',
                e => this.actions.loadSongFromFileInput(e),
                this.formSongPlayback.createIcon('file-load'),
                `.json,.mid,.midi`,
                "Load Song from File"
            );
            this.fieldSongFileSave = this.formSongFile.addButton('file-save',
                e => this.actions.saveSongToFile(e),
                this.formSongPlayback.createIcon('file-save'),
                "Save Song to File"
            );

            this.fieldSongVolume = this.formSongVolume.addRangeInput('volume',
                (e, newVolume) => this.actions.setSongVolume(e, newVolume), 1, 100, 'Song Volume', this.song.getVolumeValue());
            this.fieldSongPosition = this.formSongPosition.addTextInput('position',
                e => this.actions.setSongPosition(e),
                'Song Position',
                '00:00:000'
            );
            this.fieldSongName = this.formSongName.addTextInput('name',
                (e, newSongName) => this.actions.setSongName(e, newSongName), "Song Name");
            this.fieldSongVersion = this.formSongVersion.addTextInput('version',
                (e, newSongVersion) => this.actions.setSongVersion(e, newSongVersion));
            this.fieldSongBPM = this.formSongBPM.addTextInput('bpm',
                (e, newBPM) => this.actions.setStartingBPM(e, parseInt(newBPM)));
            this.fieldSongBPM.inputElm.setAttribute('type', 'number');
        }

        this.fieldSongPlaybackPause.disabled = true;

        this.fieldSongName.value = this.song.getName();
        this.fieldSongVersion.value = this.song.getVersion();
        this.fieldSongBPM.value = this.song.getStartingBPM();

        this.fieldSongVolume.value = this.song.getVolumeValue();

    }


    getScriptDirectory(appendPath=null) {
        const Util = new AudioSourceUtilities;
        return Util.getScriptDirectory(appendPath, 'script[src$="audio-source-player-element.js"],script[src$="audio-source-player-element.min.js"]');
    }

    setStatus(newStatus) {
        this.statusElm.innerHTML = newStatus;
    }

    handleError(err) {
        this.statusElm.innerHTML = `<span style="red">${err}</span>`;
        console.error(err);
    }


    async loadSongFromSrc(src) {
        const songData = await Util.loadJSONFromURL(src);
        await this.song.loadSongData(songData);
        this.setStatus("Song loaded from src: " + src);
        this.render();
    }

    toggleFullscreen(e) {
        const setFullScreen = !this.classList.contains('fullscreen');
        this.containerElm.classList.toggle('fullscreen', setFullScreen);
        this.classList.toggle('fullscreen', setFullScreen);
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
