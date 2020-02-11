(function(thisRequire, thisModule, thisScriptPath, isBrowser) {
    /** Required Modules **/
    if(isBrowser) // Hack for browsers
        window.require = thisRequire;

    // const {AudioSourceUtilities} = require('../common/audio-source-utilities.js');
    // const {AudioSourceValues} = require('../common/audio-source-values.js');
        // const {AudioSourceLibrary} = require('../common/audio-source-library.js');
    const {
        ASUIComponent,
        ASUIDiv,
        // ASUIText,
        ASUIIcon
    } = require('../common/ui/asui-component.js');
    const {ASUIMenu} = require('../common/ui/asui-menu.js');
    // const {ASUIGrid, ASUIGridRow} = require('../common/ui/asui-grid.js');
    const {ASUIInputCheckBox} = require('../common/ui/asui-input-checkbox.js');
    const {ASUIInputButton} = require('../common/ui/asui-input-button.js');
    const {ASUIInputFile} = require('../common/ui/asui-input-file.js');
    const {ASUIInputRange} = require('../common/ui/asui-input-range.js');
    const {ASUIInputText} = require('../common/ui/asui-input-text.js');

    const {ASPHeader} = require('./ui/asp-header.js');
    const {ASPPlaylist} = require('./ui/asp-playlist.js');


    if(!isBrowser)
        ASUIComponent.addGlobalStyle(require('./assets/audio-source-player.style.js').default);


    const {AudioSourceStorage} = require('../common/audio-source-storage.js');


    class AudioSourcePlayerRenderer extends ASUIComponent {
        constructor(props={}) {
            super(props);
            this.state.status = "[No Song Loaded]";
            this.state.version = -1;
            this.state.menuKey = null;
            this.state.fullscreen = false;
            this.state.portrait = false;
            this.state.showPanelSong = true;
            this.state.showPanelPlaylist = true;
            this.shadowDOM = null;
            this.playlist = null; // playlist ref;

        }
        get targetElm() { return this.shadowDOM; }

        getAttributeMap() {
            return Object.assign(super.getAttributeMap(), {
                src: 'src',
            });
        }
        // get playlist() { return this.state.playlist; }

        createStyleSheetLink(stylePath, scriptElm=null) {
            // const AudioSourceLoader = customElements.get('audio-source-loader');
            const linkHRef = new URL(stylePath, (scriptElm || thisModule).src);
            const link = document.createElement('link');
            link.setAttribute('rel', 'stylesheet');
            link.href = linkHRef;
            return link;
        }

        restart() {
            const RNRestart = require('react-native-restart').default;
            RNRestart.Restart();
        }

        openSubMenu(menuKey) {
            this.state.menuKey = menuKey;
            // if(this.props.onUpdateMenu)
                this.props.onUpdateMenu();
            // setTimeout(e => this.toggleMenu(), 10);
        }

        toggleMenu(menuKey=null) {
            if(this.props.onToggleMenu)
                this.props.onToggleMenu();
        }

        renderMenu(menuKey = null) {
//             console.log('renderMenu', menuKey);
            switch(menuKey) {
                default:
                    const vertical = !this.state.portrait;
                    return [
                        // ASUIMenu.cME('refresh',     'Refresh',  (e) => this.restart()),
                        ASUIMenu.cSME({vertical, key:'file'},        'File',     () => this.renderMenu('file')),
                        ASUIMenu.cSME({vertical, key:'playlist'},    'Playlist', () => this.renderMenu('playlist')),
                        ASUIMenu.cSME({vertical, key:'view'},        'View',     () => this.renderMenu('view')),
                    ];

                case 'file':
                    return [
                        ASUIMenu.cSME('memory', 'Load from Memory',     (e) => this.renderMenu('file-memory')),

                        ASUIMenu.cME('file', 'Load from File', (e) => this.fieldSongFileLoad.click()),
                        ASUIMenu.cME('url', 'Load from URL', null, null, {disabled: true}),
                        ASUIMenu.cME('library', 'Load from Library', null, null, {disabled: true}),
                    ];

                case 'file-memory':
                    const Storage = new AudioSourceStorage();
                    const songRecentUUIDs = Storage.getRecentSongList() ;
                    return songRecentUUIDs.length > 0
                        ? songRecentUUIDs.map(entry => ASUIMenu.cME({},
                            entry.name || entry.uuid,
                            () => this.loadSongFromMemory(entry.uuid)))
                        : ASUIMenu.cME({disabled: true, hasBreak:true}, "No Songs Available");

                case 'playlist':
                    return [
                        ASUIMenu.cME('next', 'Play Next Song', null, (e) => this.playlistNext()),
                        ASUIMenu.cME('clear', 'Clear Playlist', null, (e) => this.clearPlaylist(), {hasBreak: true}),
                    ];

                case 'view':
                    return [
                        ASUIMenu.cME('fullscreen', `${this.state.fullscreen ? 'Disable' : 'Enable'} Fullscreen`, null, (e) => this.toggleFullscreen(e)),
                        ASUIMenu.cME('hide-panel-song', `${this.state.showPanelSong ? 'Show' : 'Hide'} Song Forms`, null, (e) => this.togglePanelSong(e)),
                        ASUIMenu.cME('hide-panel-playlist', `${this.state.showPanelPlaylist ? 'Show' : 'Hide'} Playlist`, null, (e) => this.togglePanelPlaylist(e)),
                    ];

            }
        }

        render() {
            return [
                // require('react').createElement(require('react-native-webview').WebView, {
                //     source: {uri: Platform.OS ==='android' ?'file:///android_asset/html/index.html' :'./external/html/index.html'}, key: 'browser', width: 200, height: 200
                // }),
                isBrowser ? [
                    this.createStyleSheetLink('../player/assets/audio-source-player.css', thisModule),
                    this.createStyleSheetLink('../common/assets/audio-source-common.css', thisModule),
                ] : null,
                this.containerElm = ASUIDiv.cE('asp-container', [
                    ASPHeader.cE({
                        // portrait: !!this.state.portrait,
                        key: 'asp-title-container',
                        menuContent: () => this.renderMenu(this.state.menuKey),
                        // onMenuPress: (e) => this.toggleMenu()
                    }),

                    ASUIDiv.cE('asp-forms-container', [
                        ASPPanel.cE('song', [
                            ASUIDiv.cE('title', 'Song'),
                            ASPForm.cE('playback', [
                                ASUIDiv.cE('title', 'Playback'),
                                ASUIInputButton.cIB('song-play',
                                    ASUIIcon.createIcon('play'),
                                    e => this.playlistPlay(e),
                                    "Play Song"),
                                ASUIInputButton.cIB('song-pause',
                                    ASUIIcon.createIcon('pause'),
                                    e => this.playlistPause(e),
                                    "Pause Song"),
                                ASUIInputButton.cIB('song-stop',
                                    ASUIIcon.createIcon('stop'),
                                    e => this.playlistStop(e),
                                    "Stop Song"),
                                ASUIInputButton.cIB('song-next',
                                    ASUIIcon.createIcon('next'),
                                    e => this.playlistNext(e),
                                    "Next Song")
                            ]),

                            ASPForm.cE('file', [
                                ASUIDiv.cE('title', 'File'),
                                ASUIInputFile.createInputFile('file-load',
                                    e => this.loadSongFromFileInput(),
                                    ASUIIcon.createIcon('file-load'),
                                    `.json,.mid,.midi`,
                                    "Load Song from File"
                                ),
                                ASUIInputButton.cE('file-save',
                                    ASUIIcon.createIcon('file-save'),
                                    e => this.saveSongToFile(),
                                    "Save Song to File"
                                ),
                            ]),

                            ASPForm.cE('volume', [
                                ASUIDiv.cE('title', 'Volume'),
                                ASUIInputRange.createInputRange('volume',
                                    (e, newVolume) => this.setVolume(newVolume / 100), 1, 100, this.state.volume * 100, 'Song Volume')
                            ]),

                            ASPForm.cE('timing', [
                                ASUIDiv.cE('title', 'Timing'),
                                ASUIInputText.createInputText({
                                        key:'timing',
                                        ref: ref => this.fieldSongTiming = ref,
                                    },
                                    (e, pos) => this.setSongPosition(pos),
                                    '00:00:000',
                                    'Song Timing',
                                )
                            ]),

                            ASPForm.cE('position', [
                                ASUIDiv.cE('title', 'Position'),
                                ASUIInputRange.createInputRange({
                                        key: 'position',
                                        ref: ref => this.fieldSongPosition = ref,
                                    },
                                    (e, pos) => this.setSongPosition(pos),
                                    0,
                                    Math.ceil(this.state.songLength),
                                    0,
                                    'Song Position',
                                )
                            ]),

                            ASPForm.cE('name', [
                                ASUIDiv.cE('title', 'Name'),
                                ASUIInputText.createInputText('name',
                                    (e, newSongName) => this.setSongName(e, newSongName),
                                    this.song ? this.song.name : "no song loaded",
                                    "Song Name"
                                )
                            ]),

                            ASPForm.cE('version', [
                                ASUIDiv.cE('title', 'Version'),
                                ASUIInputText.createInputText('version',
                                    (e, newSongVersion) => this.setSongVersion(e, newSongVersion),
                                    this.song ? this.song.version : "0.0.0",
                                    "Song Version",
                                )
                            ]),

                            ASPForm.cE('source', [
                                ASUIDiv.cE('title', 'Source'),
                                ASUIInputButton.cIB('edit',
                                    "Edit",
                                    (e) => this.openSongSource(e),
                                    "Open Song Source",
                                    {disabled: true}
                                )
                            ])
                        ]),

                        ASPPanel.cE('playlist', [
                            ASUIDiv.cE('title', 'Playlist'),
                            ASPPlaylist.cE({
                                key: 'playlist',
                                player: this,
                                // playlist: this.state.playlist,
                                ref:ref=>this.playlist=ref
                            })
                        ]),
                    ]),

                    ASUIDiv.cE('asp-status-container', [
                        ASUIDiv.cE({key: 'asp-status-text', ref:ref=>this.textStatus=ref}, () => this.state.status),
                        ASUIDiv.cE({key: 'asp-version-text', ref:ref=>this.textVersion=ref}, () => this.state.version),
                    ]),

                ])

            ];

            // this.containerElm.classList.toggle('fullscreen', this.classList.contains('fullscreen'));
            //
            // this.fieldSongName.value = this.song.name;
            // this.fieldSongVersion.value = this.song.getVersion();
            //
            // this.fieldSongVolume.value = this.song.getVolumeValue();

        }


    }

    if(isBrowser)
        customElements.define('asp-renderer', AudioSourcePlayerRenderer);


    class ASPPanel extends ASUIDiv {}
    if(isBrowser)
        customElements.define('asp-panel', ASPPanel);

    class ASPForm extends ASPPanel {}
    if(isBrowser)
        customElements.define('asp-form', ASPForm);





    /** Export this script **/
    thisModule.exports = {
        AudioSourcePlayerRenderer,
    };


}).apply(null, (function() {
    const thisScriptPath = 'player/audio-source-player-renderer.js';
    const isBrowser = typeof document === 'object';
    const thisModule = !isBrowser ? module : customElements.get('audio-source-loader').findScript(thisScriptPath);
    const thisRequire = !isBrowser ? require : customElements.get('audio-source-loader').getRequire(thisModule);
    return [thisRequire, thisModule, thisScriptPath, isBrowser]
})());
