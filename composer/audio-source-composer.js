{
    /** Required Modules **/
    if(typeof window !== "undefined")
        window.require = customElements.get('audio-source-loader').require;


    /** Required Modules **/
    const {AudioSourceUtilities} = require('../common/audio-source-utilities.js');
    const {ASUIDiv} = require('../common/audio-source-ui.js');
    const {AudioSourceValues} = require('../common/audio-source-values.js');
    const {AudioSourceLibrary} = require('../common/audio-source-library.js');
    const {AudioSourceSong} = require('../common/audio-source-song.js');
    const {AudioSourceStorage} = require('../common/audio-source-storage.js');

    const {AudioSourceComposerRenderer} = require('../composer/audio-source-composer-renderer.js');
    const {AudioSourceComposerActions} = require('../composer/audio-source-composer-actions.js');
    const {AudioSourceComposerKeyboard} = require('../composer/audio-source-composer-keyboard.js');
    const {AudioSourceComposerTracker} = require('../composer/audio-source-composer-tracker.js');

    class AudioSourceComposerElement extends AudioSourceComposerActions {
        constructor(props={}, state={}) {
            super(props, Object.assign({
                volume: AudioSourceSong.DEFAULT_VOLUME,
                version: -1,
                songLength: 0,
            }, state));


            this.props.playlistActive = false;
            this.props.playing = false;
            this.props.paused = false;

            // this.versionString = '-1';
            // this.eventHandlers = [];
            this.saveSongToMemoryTimer = null;
            // this.instrumentLibrary = null;

            this.longPressTimeout = null;
            this.doubleClickTimeout = 500;
            this.autoSaveTimeout = 4000;

            this.keyboard = new AudioSourceComposerKeyboard();

            // this.song = new AudioSourceSong({}, this);
            // this.player = null;
            // this.status = {
            //     groupHistory: [],
            //     // previewInstructionsOnSelect: false,
            //     longPressTimeout: 500,
            //     doubleClickTimeout: 500,
            //     autoSaveTimeout: 4000,
            // };
            this.trackerElm = new AudioSourceComposerTracker(this);
            this.library = AudioSourceLibrary.loadDefaultLibrary(); // TODO: get default library url from composer?


            this.song = new AudioSourceSong();
            this.song.addDispatchElement(this);
            this.song.loadSongData({});
            // this.values = new AudioSourceValues(this.song);
            // Util.loadLibrary(defaultLibraryURL);

            this.addEventHandler('unload', e => this.saveState(e), window);
            this.ui = {};
        }


        get isPlaylistActive()      { return this.props.playlistActive; }
        set isPlaylistActive(value) { this.setProps({playlistActive: value}); }
        get isPlaying()             { return this.props.playing; }
        set isPlaying(value)        { this.setProps({playing: value}); }
        get isPaused()              { return this.props.paused; }
        set isPaused(value)         { this.setProps({paused: value}); }

        get values() { return new AudioSourceValues(this.song); }

        async connectedCallback() {
            this.shadowDOM = this.attachShadow({mode: 'closed'});

            // this.loadCSS();
            super.connectedCallback(false);

            this.addEventHandler(['dragover', 'drop'], e => this.onInput(e), this.shadowDOM, true);
            this.addEventHandler(['focus', 'click'], e => this.onInput(e), this.shadowDOM);
            // 'change', 'submit',

            this.addEventHandler([
                'song:loaded', 'song:play', 'song:end', 'song:stop', 'song:modified', 'song:seek',
                'group:play', 'group:seek',
                'note:start', 'note:end'
            ], this.onSongEvent);
            this.addEventHandler([
                    'instrument:instance',
                    'instrument:library',
                    'instrument:modified',
                    'instrument:added',
                    'instrument:removed'],
                e => this.onSongEvent(e), document);

            this.focus();

            await this.renderOS();
            this.loadState();

            this.loadMIDIInterface(e => this.onInput(e));        // TODO: wait for user input


            const Util = new AudioSourceUtilities;
            Util.loadPackageInfo()
                .then(packageInfo => this.setVersion(packageInfo.version));
        }



        async getLibrary() {
            return await this.library;
        }

        // get trackerElm() { return this.shadowDOM.querySelector('asc-tracker'); }
        // get containerElm() { return this.shadowDOM.querySelector('.asc-container'); }

        getScriptDirectory(appendPath = null) {
            const Util = new AudioSourceUtilities;
            return Util.getScriptDirectory(appendPath, 'script[src$="audio-source-composer.js"]');
        }

        get defaultLibraryURL() {
            return this.getAttribute('defaultLibraryURL') || this.getScriptDirectory('default.library.json');
        }

        set defaultLibraryURL(url) {
            this.setAttribute('defaultLibraryURL', url);
        }


        async loadState(e = null) {

            const storage = new AudioSourceStorage();
            const state = storage.loadState();
            console.log('loadState', state);


            if (state) {
                await this.loadDefaultSong(state.songUUID);
                if (typeof state.volume !== "undefined") this.setSongVolume(e, state.volume);
                if (typeof state.trackerSegmentLength !== "undefined") await this.refs.fieldTrackerSegmentLength.setValue(state.trackerSegmentLength);
                if (typeof state.trackerRowLength !== "undefined") await this.refs.fieldTrackerRowLength.setValue(state.trackerRowLength);
                if (typeof state.trackerInstrument !== "undefined") await this.refs.fieldTrackerFilterInstrument.setValue(state.trackerInstrument);
                if (typeof state.trackerOctave !== "undefined") await this.refs.fieldTrackerOctave.setValue(state.trackerOctave);

                if (typeof state.groupName !== "undefined") await this.trackerChangeGroup(state.groupName);
                if (typeof state.currentRowSegmentID !== "undefined") await this.trackerChangeSegment(state.currentRowSegmentID);

                if (typeof state.selectedIndicies !== "undefined") this.selectIndicies(state.selectedIndicies);
                // this.trackerElm.render(); // TODO: too many renders

            } else {
                await this.loadDefaultSong();
            }
        }


        async saveState(e) {
            // await this.saveSongToMemory(e);
            const state = {// TODO: auto-state form fields
                songUUID: this.song.uuid,
                groupName: this.trackerElm.groupName,
                currentRowSegmentID: this.trackerElm.currentRowSegmentID,
                volume: this.song.getVolumeValue(),
                trackerSegmentLength: this.refs.fieldTrackerSegmentLength.value,
                trackerRowLength: this.refs.fieldTrackerRowLength.value,
                trackerInstrument: this.refs.fieldTrackerFilterInstrument.value,
                trackerOctave: this.refs.fieldTrackerOctave.value,
                selectedIndicies: this.getSelectedIndicies()
            };
            const storage = new AudioSourceStorage();
            storage.saveState(state);
            console.log('saveState', state);
        }


        async loadDefaultSong(recentSongUUID = null) {

            const src = this.getAttribute('src');
            if (src) {
                await this.loadSongFromURL(src);
                return true;
            }

            await this.loadNewSongData();

            if (recentSongUUID) {
                await this.loadSongFromMemory(recentSongUUID);
                return;
            }


            // if(await this.loadRecentSongData())
            //     return true;

            return false;
        }

        getAudioContext() {
            return this.song.getAudioContext();
        }



        // Input

        onInput(e) {
            console.log(e.type);
            if (e.defaultPrevented)
                return;

            switch (e.type) {
                case 'focus':
                    break;
                default:
                    this.song.getAudioContext();
            }

            switch (e.type) {
                case 'focus':
                    break;

                case 'click':
                    this.closeAllMenus(true);
                    break;
                //     const divElmFormElm = e.path[0].closest('asui-div');
                //     if(divElmFormElm) {
                //         divElmFormElm.getRootNode().querySelectorAll('asui-div.focus')
                //             .forEach(formElm => formElm.classList.remove('focus'));
                //         divElmFormElm.classList.add('focus');
                //     }
                //     break;

                case 'dragover':
                    e.stopPropagation();
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                    break;
                case 'drop':
                    e.stopPropagation();
                    e.preventDefault();
                    var files = e.dataTransfer.files; // Array of all files
                    this.loadSongFromFileInput(files[0]);
                    console.log(files);
                    break;

                case 'midimessage':
                    // console.log("MIDI", e.data, e);
                    switch (e.data[0]) {
                        case 144:   // Note On
                            // TODO: refactor
                            e.preventDefault();
                            const midiImport = new MIDIImport();
                            let newMIDICommand = midiImport.getCommandFromMIDINote(e.data[1]);
                            let newMIDIVelocity = Math.round((e.data[2] / 128) * 100);
                            console.log("MIDI ", newMIDICommand, newMIDIVelocity);

                            this.instructionInsertOrUpdate(e, newMIDICommand);
                            this.playSelectedInstructions(e);
                            // this.focus();
                            break;
                        case 128:   // Note Off
                            // TODO: turn off playing note, optionally set duration of note
                            break;
                    }
                    break;

                default:
                    throw new Error("Unhandled type: " + e.type);
            }

        }

        async onSongEvent(e) {
//         console.log("Song Event: ", e.type);
            if (this.trackerElm)
                this.trackerElm.onSongEvent(e);
            switch (e.type) {
                case 'song:seek':
                    this.updateSongPositionValue(e.detail.position);

                    break;

                case 'song:volume':
                    this.refs.fieldSongVolume.value = e.detail.volume;
                    break;

                case 'song:loaded':
                    this.trackerElm.renderDuration = this.song.timeDivision;
                    break;
                case 'song:play':
                    this.setProps({playing: true});
                    this.refs.fieldSongPlaybackPause.disabled = false;
                    const updateSongPositionInterval = setInterval(e => {
                        if (!this.song.isPlaying) {
                            clearInterval(updateSongPositionInterval);
                            this.refs.fieldSongPlaybackPause.disabled = true;
                            this.setProps({playing: false, paused: false});
                        }
                        this.updateSongPositionValue(this.song.songPlaybackPosition);
                    }, 10);
                    break;

                case 'song:pause':
                    this.setProps({paused: true});
                    break;
                case 'song:end':
                    this.setProps({playing: false, paused: false});
                    break;

                case 'instrument:instance':
                // this.renderInstrument(e.detail.instrumentID);
                // break;
                case 'instrument:added':
                case 'instrument:removed':
                    await this.renderInstruments();
                    await this.renderInstruments();
                    break;

                case 'instrument:modified':
                case 'song:modified':
                    switch(e.type) {
                        case 'instrument:modified':
                            this.renderInstrument(e.detail.instrumentID);
                            this.refs.panelInstructions.render();
                            break;
                    }
                    // this.trackerElm.render();
                    // this.forms.render();

                    // TODO: auto save toggle
                    clearTimeout(this.saveSongToMemoryTimer);
                    this.saveSongToMemoryTimer = setTimeout(e => this.saveSongToMemory(e), this.autoSaveTimeout);
                    break;
                case 'instrument:library':
//                 console.log(e.type);
                    // TODO: this.instruments.render();
                    // this.renderInstruments();
                    this.updateForms();
                    break;
            }
        }

        closeAllMenus() {
            this.shadowDOM.querySelector(`asui-menu`)
                .closeAllMenus();
        }


        /** Load External CSS **/
        // loadCSS() {
        //     const CSS_PATH = 'composer/assets/audio-source-composer.css';
        //     const targetDOM = this.shadowDOM || document.head;
        //     if (targetDOM.querySelector(`link[href$="${CSS_PATH}"]`))
        //         return;
        //
        //     const Util = new AudioSourceUtilities();
        //     const linkHRef = Util.getScriptDirectory(CSS_PATH);
        //     let cssLink = document.createElement("link");
        //     cssLink.setAttribute("rel", "stylesheet");
        //     cssLink.setAttribute("type", "text/css");
        //     cssLink.setAttribute("href", linkHRef);
        //     targetDOM.appendChild(cssLink);
        // }

    }

    customElements.define('audio-source-composer', AudioSourceComposerElement);


    /** Export this script **/
    const thisScriptPath = 'composer/audio-source-composer.js';
    let thisModule = typeof customElements !== 'undefined' ? customElements.get('audio-source-loader').findScript(thisScriptPath) : module;
    thisModule.exports = {
        AudioSourceComposerElement,
    };


}