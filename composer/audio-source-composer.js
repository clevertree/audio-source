(async function() {

    /** Register Script Exports **/
    function getThisScriptPath() { return 'composer/audio-source-composer.js'; }
    const exportThisScript = function(module) {
        module.exports = {AudioSourceComposerElement};
    }

    /** Register This Async Module **/
    const resolveExports = registerAsyncModule();


    /** Required Modules **/
    const {AudioSourceUtilities} = await requireAsync('common/audio-source-utilities.js');
    const {ASUIDiv} = await requireAsync('common/audio-source-ui.js');
    const {AudioSourceValues} = await requireAsync('common/audio-source-values.js');
    const {AudioSourceLibrary} = await requireAsync('common/audio-source-library.js');
    const {AudioSourceSong} = await requireAsync('common/audio-source-song.js');
    const {AudioSourceStorage} = await requireAsync('common/audio-source-storage.js');

    const {AudioSourceComposerRenderer} = await requireAsync('composer/audio-source-composer-renderer.js');
    const {AudioSourceComposerActions} = await requireAsync('composer/audio-source-composer-actions.js');
    const {AudioSourceComposerKeyboard} = await requireAsync('composer/audio-source-composer-keyboard.js');
    const {AudioSourceComposerTracker} = await requireAsync('composer/audio-source-composer-tracker.js');

    class AudioSourceComposerElement extends AudioSourceComposerActions {
        constructor(state={}, props={}) {
            super(state, props);
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


            this.song = new AudioSourceSong({}, this);
            this.values = new AudioSourceValues(this.song);
            // Util.loadLibrary(defaultLibraryURL);

            this.addEventHandler('unload', e => this.saveState(e), window);
            this.ui = {};
        }

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

                if (typeof state.groupName !== "undefined") await this.trackerElm.setGroupName(state.groupName);
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

            if (recentSongUUID) try {
                await this.loadSongFromMemory(recentSongUUID);
                return;
            } catch (e) {
                console.error(e);
            }

            // if(await this.loadRecentSongData())
            //     return true;

            await this.loadNewSongData();
            return false;
        }

        getAudioContext() {
            return this.song.getAudioContext();
        }


        /** Playback **/


        updateSongPositionValue(playbackPositionInSeconds) {
            const values = new AudioSourceValues();
            const roundedSeconds = Math.round(playbackPositionInSeconds);
            this.refs.fieldSongTiming.value = values.formatPlaybackPosition(playbackPositionInSeconds);
            if(this.refs.fieldSongPosition.value !== roundedSeconds)
                this.refs.fieldSongPosition.value = roundedSeconds;
            this.trackerElm.updateSongPositionValue(playbackPositionInSeconds);
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

                            this.insertOrUpdateCommand(e, newMIDICommand);
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
                    this.classList.add('playing');
                    this.containerElm.classList.add('playing');
                    this.refs.fieldSongPlaybackPause.disabled = false;
                    const updateSongPositionInterval = setInterval(e => {
                        if (!this.song.isPlaying) {
                            clearInterval(updateSongPositionInterval);
                            this.refs.fieldSongPlaybackPause.disabled = true;
                            this.containerElm.classList.remove('playing');
                            this.classList.remove('playing');
                        }
                        this.updateSongPositionValue(this.song.songPlaybackPosition);
                    }, 10);
                    break;

                case 'song:pause':
                    this.classList.add('paused');
                    this.containerElm.classList.add('paused');
                    break;
                case 'song:end':
                    this.classList.remove('playing', 'paused');
                    this.containerElm.classList.remove('playing', 'paused');
                    break;

                case 'instrument:instance':
                // this.renderInstrument(e.detail.instrumentID);
                // break;
                case 'instrument:added':
                case 'instrument:removed':
                    this.renderInstruments();
                    this.refs.panelInstructions.render();
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
                case 'instrument:remove':
                    this.renderInstruments();
                    this.refs.panelInstructions.render();
                    break;
                case 'instrument:library':
//                 console.log(e.type);
                    // TODO: this.instruments.render();
                    // this.renderInstruments();
                    this.updateForms();
                    this.refs.panelInstructions.render();
                    break;
            }
        }

        closeAllMenus() {
            this.shadowDOM.querySelector(`asui-menu`)
                .closeAllMenus();
        }


        /** Selection **/

        selectIndicies(selectedIndicies) {
            if (typeof selectedIndicies === "string") {

                switch (selectedIndicies) {
                    case 'all':
                        selectedIndicies = [];
                        const maxLength = this.song.instructionFindGroupLength(this.groupName);
                        for (let i = 0; i < maxLength; i++)
                            selectedIndicies.push(i);
                        break;
                    case 'segment':
                        selectedIndicies = [].map.call(this.querySelectorAll('asct-instruction'), (elm => elm.index));
                        break;
                    case 'row':
                        throw new Error('TODO');
                    case 'none':
                        selectedIndicies = [];
                        break;
                    default:
                        throw new Error("Invalid selection: " + selectedIndicies);
                }
            }
            if (typeof selectedIndicies === 'number')
                selectedIndicies = [selectedIndicies];
            if (!Array.isArray(selectedIndicies))
                throw new Error("Invalid selection");

            this.refs.fieldTrackerSelection.value = selectedIndicies.join(',');

            this.trackerElm.updateSelection();
            this.trackerElm.focus();
        }

        getSelectedIndicies() {
            const value = this.refs.fieldTrackerSelection.value;
            if (value === '')
                return [];
            return value
                .split(/\D+/)
                .map(index => parseInt(index));
            // return this.selectedIndicies;
            // const selectedIndicies = [].map.call(this.selectedCells, (elm => elm.index));
        }

        clearSelectedIndicies() {
            this.refs.fieldTrackerSelection.value = '';
        }

        removeSelectedIndex(index) {
            const selectedIndicies = this.getSelectedIndicies();
            const pos = selectedIndicies.indexOf(index);
            if (pos !== -1) {
                selectedIndicies.splice(pos, 1);
            }
            this.refs.fieldTrackerSelection.value = selectedIndicies.join(',');
        }

        addSelectedIndex(index) {
            const selectedIndicies = this.getSelectedIndicies();
            if (selectedIndicies.indexOf(index) === -1) {
                selectedIndicies.push(index);
                selectedIndicies.sort();
            }
            this.refs.fieldTrackerSelection.value = selectedIndicies.join(',');
//         console.info('updateSel(async function() {ectedIndicies', selectedIndicies);
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
    registerModule(exportThisScript);

    /** Finish Registering Async Module **/
    resolveExports();



    /** Module Loader Methods **/
    function registerAsyncModule() {
        let resolve;
        const promise = new Promise((r) => resolve = r);
        registerModule(module => {
            module.promises = (module.promises || []).concat(promise);
        });
        return resolve;
    }
    function registerModule(callback) {
        if(typeof window === 'undefined')
            callback(module);
        else findThisScript()
            .forEach(scriptElm => callback(scriptElm))
    }

    function findThisScript() {
        return findScript(getThisScriptPath());
    }

    function findScript(scriptURL) {
        let scriptElms = document.head.querySelectorAll(`script[src$="${scriptURL}"]`);
        scriptElms.forEach(scriptElm => {
            scriptElm.relativePath = scriptURL;
            scriptElm.basePath = scriptElm.src.replace(document.location.origin, '').replace(scriptURL, '');
        });
        return scriptElms;
    }

    async function requireAsync(relativeScriptPath) {
        if(typeof require !== "undefined")
            return require('../' + relativeScriptPath);

        let scriptElm = findScript(relativeScriptPath)[0];
        if(!scriptElm) {
            const scriptURL = findThisScript()[0].basePath + relativeScriptPath;
            scriptElm = document.createElement('script');
            scriptElm.src = scriptURL;
            scriptElm.promises = (scriptElm.promises || []).concat(new Promise(async (resolve, reject) => {
                scriptElm.onload = resolve;
                document.head.appendChild(scriptElm);
            }));
        }
        for (let i=0; i<scriptElm.promises.length; i++)
            await scriptElm.promises[i];
        return scriptElm.exports
            || (() => { throw new Error("Script module has no exports: " + relativeScriptPath); })()
    }


})();