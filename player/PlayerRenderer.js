import React from "react";

import Div from "../common/components/div/Div";
import Icon from "../common/components/icon/Icon";
import Menu from "../common/components/menu/Menu";
import InputButton from "../common/components/input-button/InputButton";
import InputFile from "../common/components/input-file/InputFile";
import InputRange from "../common/components/input-range/InputRange";
import InputText from "../common/components/input-text/InputText";
import Storage from "../common/Storage";

import Header from "./header/Header";
import Playlist from "./playlist/Playlist";
import Panel from "./panel/Panel";
import Form from "./form/Form";
import Footer from "./footer/Footer";


const ASPForm = Div;
const ASPPanel = Div;
class PlayerRenderer extends React.Component {
    constructor(props={}) {
        super(props);
        this.state = {
            status: "[No Song Loaded]",
            version: require('../package.json').version,
            menuKey: null,
            fullscreen: false,
            portrait: false,
            showPanelSong: true,
            showPanelPlaylist: true,
        };
        this.shadowDOM = null;
        this.playlist = null; // playlist ref;

    }
    // get targetElm() { return this.shadowDOM; }

    getAttributeMap() {
        return Object.assign(super.getAttributeMap(), {
            src: 'src',
        });
    }
    // get playlist() { return this.state.playlist; }

    // createStyleSheetLink(stylePath, scriptElm=null) {
    //     // const AudioSourceLoader = customElements.get('audio-source-loader');
    //     const linkHRef = new URL(stylePath, (scriptElm || thisModule).src);
    //     const link = document.createElement('link');
    //     link.setAttribute('rel', 'stylesheet');
    //     link.href = linkHRef;
    //     return link;
    // }

    // restart() {
    //     const RNRestart = require('react-native-restart').default;
    //     RNRestart.Restart();
    // }

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

    render() {
        return (
            <Div className="asp-container">
                <Header
                    key="header"
                    menuContent={() => this.renderMenu(this.state.menuKey)}
                    />
                <Div className="asp-forms-container">
                    <Panel className="song" title="Song">
                        <Form className="playback" title="Playback">
                            <InputButton
                                className="song-play"
                                action={e => this.playlistPlay(e)}
                            >
                                <Icon className="play"/>
                            </InputButton>
                            <InputButton
                                className="song-pause"
                                action={e => this.playlistPause(e)}
                            >
                                <Icon className="pause"/>
                            </InputButton>
                            <InputButton
                                className="song-stop"
                                action={e => this.playlistStop(e)}
                            >
                                <Icon className="stop"/>
                            </InputButton>
                            <InputButton
                                className="song-next"
                                action={e => this.playlistNext(e)}
                            >
                                <Icon className="next"/>
                            </InputButton>
                        </Form>

                        <Form className="file" title="File">
                            <InputFile
                                className="file-load"
                                onFile={(e, file) => this.addInputFileToPlaylist(file)}
                                accepts=".json,.mid,.midi"
                                title="Load Song from File"
                            >
                                <Icon className="file-load"/>
                            </InputFile>
                            <InputButton
                                className="file-save"
                                action={e => this.saveSongToFile(e)}
                                title="Save Song to File"
                            >
                                <Icon className="file-save"/>
                            </InputButton>
                        </Form>

                        <Form className="volume" title="Volume">
                            <InputRange
                                className="volume"
                                action={(e, newVolume) => this.setVolume(newVolume / 100)}
                                value={this.state.volume}
                                min={1}
                                max={100}
                                title="Song Volume"
                            />
                        </Form>

                        <Form className="position" title="Position">
                            <InputRange
                                className="position"
                                action={(e, pos) => this.setSongPosition(pos)}
                                value={0}
                                min={0}
                                max={Math.ceil(this.state.songLength)}
                                ref={ref => this.fieldSongPosition = ref}
                                title="Song Position"
                            />
                        </Form>

                        <Form className="timing" title="Timing">
                            <InputText
                                className="timing"
                                action={(e, timingString) => this.setSongPosition(timingString)}
                                value="00:00:000"
                                ref={ref => this.fieldSongTiming = ref}
                                title="Song Timing"
                            />
                        </Form>

                        <Form className="name" title="Name">
                            <InputText
                                className="name"
                                action={(e, newSongName) => this.setSongName(e, newSongName)}
                                value={this.song ? this.song.getName() : "no song loaded"}
                                ref={ref => this.fieldSongVersion = ref}
                                title="Song Name"
                            />
                        </Form>

                        <Form className="version" title="Version">
                            <InputText
                                className="version"
                                action={(e, newSongVersion) => this.setSongVersion(e, newSongVersion)}
                                value={this.song ? this.song.getVersion() : "0.0.0"}
                                ref={ref => this.fieldSongVersion = ref}
                                title="Song Version"
                            />
                        </Form>

                        <Form className="source" title="Source">
                            <InputButton
                                className="source"
                                action={(e, newSongVersion) => this.openSongSource(e, newSongVersion)}
                                title="Song Source"
                            >Source</InputButton>
                        </Form>
                    </Panel>
                    <Panel className="playlist" title="Playlist">
                        <Playlist
                            player={this}
                            ref={ref => this.playlist = ref}
                            />
                    </Panel>
                </Div>
                <Footer player={this} />
            </Div>
        )
    }

    renderMenu(menuKey = null) {
//             console.log('renderMenu', menuKey);
        switch(menuKey) {
            default:
                const vertical = !this.state.portrait;
                return (<>
                    <Menu vertical={vertical} key="file"        subMenu="file"      >File</Menu>
                    <Menu vertical={vertical} key="playlist"    subMenu="playlist"  >Playlist</Menu>
                    <Menu vertical={vertical} key="view"        subMenu="view"      >View</Menu>
                </>);
            // return [
            //     // Menu.cME('refresh',     'Refresh',  (e) => this.restart()),
            //     Menu.cSME({vertical, key:'file'},        'File',     () => this.renderMenu('file')),
            //     Menu.cSME({vertical, key:'playlist'},    'Playlist', () => this.renderMenu('playlist')),
            //     Menu.cSME({vertical, key:'view'},        'View',     () => this.renderMenu('view')),
            // ];

            case 'file':
                return (<>
                    <Menu key="memory"      subMenu="memory"      >Load from Memory</Menu>
                    <Menu key="file"        action={(e) => this.fieldSongFileLoad.click()} >Load from File</Menu>
                    <Menu key="url"         disabled>Load from URL</Menu>
                    <Menu key="library"     disabled>Load from Library</Menu>
                </>);

            case 'file-memory':
                const Storage = new Storage();
                const songRecentUUIDs = Storage.getRecentSongList() ;
                return songRecentUUIDs.length > 0
                    ? songRecentUUIDs.map((entry, i) =>
                        <Menu
                            key={i}
                            action={() => this.loadSongFromMemory(entry.uuid)}
                        >{entry.name || entry.uuid}</Menu>)
                    :<Menu
                        key="no-recent"
                        disabled
                    >No Songs Available</Menu>

            case 'playlist':
                return (<>
                    <Menu key="next"        action={(e) => this.playlistNext()}>Load from Memory</Menu>
                    <Menu key="clear"       action={(e) => this.clearPlaylist()} >Load from File</Menu>
                </>);

            case 'view':
                return (<>
                    <Menu key="fullscreen"          action={(e) => this.toggleFullscreen(e)}>${this.state.fullscreen ? 'Disable' : 'Enable'} Fullscreen</Menu>
                    <Menu key="hide-panel-song"     action={(e) => this.togglePanelSong(e)} >${this.state.showPanelSong ? 'Show' : 'Hide'} Song Forms</Menu>
                    <Menu key="hide-panel-playlist" action={(e) => this.togglePanelPlaylist(e)} >${this.state.showPanelPlaylist ? 'Show' : 'Hide'} Playlist</Menu>
                </>);
        }
    }

    render2() {
        return [
            // require('react').createElement(require('react-native-webview').WebView, {
            //     source: {uri: Platform.OS ==='android' ?'file:///android_asset/html/index.html' :'./external/html/index.html'}, key: 'browser', width: 200, height: 200
            // }),
            // isBrowser ? [
            //     this.createStyleSheetLink('../player/assets/audio-source-player.css', thisModule),
            //     this.createStyleSheetLink('../common/assets/audio-source-common.css', thisModule),
            // ] : null,
            this.containerElm = Div.cE('asp-container', [
                Header.cE({
                    // portrait: !!this.state.portrait,
                    key: 'asp-title-container',
                    menuContent: () => this.renderMenu(this.state.menuKey),
                    // onMenuPress: (e) => this.toggleMenu()
                }),

                Div.cE('asp-forms-container', [
                    ASPPanel.cE('song', [
                        Div.cE('title', 'Song'),
                        ASPForm.cE('playback', [
                            Div.cE('title', 'Playback'),
                            InputButton.cIB('song-play',
                                Icon.createIcon('play'),
                                e => this.playlistPlay(e),
                                "Play Song"),
                            InputButton.cIB('song-pause',
                                Icon.createIcon('pause'),
                                e => this.playlistPause(e),
                                "Pause Song"),
                            InputButton.cIB('song-stop',
                                Icon.createIcon('stop'),
                                e => this.playlistStop(e),
                                "Stop Song"),
                            InputButton.cIB('song-next',
                                Icon.createIcon('next'),
                                e => this.playlistNext(e),
                                "Next Song")
                        ]),

                        ASPForm.cE('file', [
                            Div.cE('title', 'File'),
                            InputFile.createInputFile('file-load',
                                e => this.loadSongFromFileInput(),
                                Icon.createIcon('file-load'),
                                `.json,.mid,.midi`,
                                "Load Song from File"
                            ),
                            InputButton.cE('file-save',
                                Icon.createIcon('file-save'),
                                e => this.saveSongToFile(),
                                "Save Song to File"
                            ),
                        ]),

                        ASPForm.cE('volume', [
                            Div.cE('title', 'Volume'),
                            InputRange.createInputRange('volume',
                                (e, newVolume) => this.setVolume(newVolume / 100), 1, 100, this.state.volume * 100, 'Song Volume')
                        ]),

                        ASPForm.cE('position', [
                            Div.cE('title', 'Position'),
                            InputRange.createInputRange({
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

                        ASPForm.cE('timing', [
                            Div.cE('title', 'Timing'),
                            InputText.createInputText({
                                    key:'timing',
                                    ref: ref => this.fieldSongTiming = ref,
                                },
                                (e, pos) => this.setSongPosition(pos),
                                '00:00:000',
                                'Song Timing',
                            )
                        ]),

                        ASPForm.cE('name', [
                            Div.cE('title', 'Name'),
                            InputText.createInputText('name',
                                (e, newSongName) => this.setSongName(e, newSongName),
                                this.song ? this.song.getName() : "no song loaded",
                                "Song Name"
                            )
                        ]),

                        ASPForm.cE('version', [
                            Div.cE('title', 'Version'),
                            InputText.createInputText('version',
                                (e, newSongVersion) => this.setSongVersion(e, newSongVersion),
                                this.song ? this.song.getVersion() : "0.0.0",
                                "Song Version",
                            )
                        ]),

                        ASPForm.cE('source', [
                            Div.cE('title', 'Source'),
                            InputButton.cIB('edit',
                                "Edit",
                                (e) => this.openSongSource(e),
                                "Open Song Source",
                                {disabled: true}
                            )
                        ])
                    ]),

                    ASPPanel.cE('playlist', [
                        Div.cE('title', 'Playlist'),
                        Playlist.cE({
                            key: 'playlist',
                            player: this,
                            // playlist: this.state.playlist,
                            ref:ref=>this.playlist=ref
                        })
                    ]),
                ]),

                Div.cE('asp-status-container', [
                    Div.cE({key: 'asp-status-text', ref:ref=>this.textStatus=ref}, () => this.state.status),
                    Div.cE({key: 'asp-version-text', ref:ref=>this.textVersion=ref}, () => this.state.version),
                ]),

            ])

        ];

        // this.containerElm.classList.toggle('fullscreen', this.classList.contains('fullscreen'));
        //
        // this.fieldSongName.value = this.song.getName();
        // this.fieldSongVersion.value = this.song.getVersion();
        //
        // this.fieldSongVolume.value = this.song.getVolumeValue();

    }


}

export default PlayerRenderer;
