import React from "react";

import Div from "../components/div/Div";
import Icon from "../components/icon/Icon";
import Menu from "../components/menu/Menu";
import InputButton from "../components/input-button/InputButton";
import InputFile from "../components/input-file/InputFile";
import InputRange from "../components/input-range/InputRange";
import InputText from "../components/input-text/InputText";
import Storage from "../song/Storage";

import Header from "./header/Header";
import Playlist from "./playlist/Playlist";
import Panel from "./panel/Panel";
import Form from "./form/Form";
import Footer from "./footer/Footer";


class PlayerRenderer extends React.Component {
    constructor(props={}) {
        super(props);
        this.state = {
            status: "[No Song Loaded]",
            version: require('../package.json').version,
            menuKey: 'root',
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

    // openSubMenu(menuKey) {
    //     this.state.menuKey = menuKey;
    //     // if(this.props.onUpdateMenu)
    //         this.props.onUpdateMenu();
    //     // setTimeout(e => this.toggleMenu(), 10);
    // }
    //
    // toggleMenu(menuKey=null) {
    //     if(this.props.onToggleMenu)
    //         this.props.onToggleMenu();
    // }

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
                                onAction={e => this.playlistPlay(e)}
                            >
                                <Icon className="play"/>
                            </InputButton>
                            <InputButton
                                className="song-pause"
                                onAction={e => this.playlistPause(e)}
                            >
                                <Icon className="pause"/>
                            </InputButton>
                            <InputButton
                                className="song-stop"
                                onAction={e => this.playlistStop(e)}
                            >
                                <Icon className="stop"/>
                            </InputButton>
                            <InputButton
                                className="song-next"
                                onAction={e => this.playlistNext(e)}
                            >
                                <Icon className="next"/>
                            </InputButton>
                        </Form>

                        <Form className="file" title="File">
                            <InputFile
                                className="file-load"
                                onFile={(e, file) => this.addInputFileToPlaylist(file)}
                                accept=".json,.mid,.midi"
                                title="Load Song from File"
                            >
                                <Icon className="file-load"/>
                            </InputFile>
                            <InputButton
                                className="file-save"
                                onAction={e => this.saveSongToFile(e)}
                                title="Save Song to File"
                            >
                                <Icon className="file-save"/>
                            </InputButton>
                        </Form>

                        <Form className="volume" title="Volume">
                            <InputRange
                                className="volume"
                                onChange={(e, newVolume) => this.setVolume(newVolume / 100)}
                                value={this.state.volume}
                                min={1}
                                max={100}
                                ref={ref => this.fieldSongVolume = ref}
                                title="Song Volume"
                            />
                        </Form>

                        <Form className="position" title="Position">
                            <InputRange
                                className="position"
                                onChange={(e, pos) => this.setSongPosition(pos)}
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
                                onChange={(e, timingString) => this.setSongPosition(timingString)}
                                value="00:00:000"
                                ref={ref => this.fieldSongTiming = ref}
                                title="Song Timing"
                            />
                        </Form>

                        <Form className="name" title="Name">
                            <InputText
                                className="name"
                                // onChange={(e, newSongName) => this.setSongName(e, newSongName)}
                                value={this.song ? this.song.getName() : "no song loaded"}
                                ref={ref => this.fieldSongVersion = ref}
                                title="Song Name"
                            />
                        </Form>

                        <Form className="version" title="Version">
                            <InputText
                                className="version"
                                // onChange={(e, newSongVersion) => this.setSongVersion(e, newSongVersion)}
                                value={this.song ? this.song.getVersion() : "0.0.0"}
                                ref={ref => this.fieldSongVersion = ref}
                                title="Song Version"
                            />
                        </Form>

                        <Form className="source" title="Source">
                            <InputButton
                                className="source"
                                onAction={(e, newSongVersion) => this.openSongSource(e, newSongVersion)}
                                title="Song Source"
                            >
                                <Icon className="source"/>
                            </InputButton>
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
            case 'root':
                const vertical = !this.state.portrait;
                return (<>
                    <Menu vertical={vertical} key="file"        options={e => this.renderMenu('file')}      >File</Menu>
                    <Menu vertical={vertical} key="playlist"    options={e => this.renderMenu('playlist')}  >Playlist</Menu>
                    <Menu vertical={vertical} key="view"        options={e => this.renderMenu('view')}      >View</Menu>
                </>);
            // return [
            //     // Menu.cME('refresh',     'Refresh',  (e) => this.restart()),
            //     Menu.cSME({vertical, key:'file'},        'File',     () => this.renderMenu('file')),
            //     Menu.cSME({vertical, key:'playlist'},    'Playlist', () => this.renderMenu('playlist')),
            //     Menu.cSME({vertical, key:'view'},        'View',     () => this.renderMenu('view')),
            // ];

            case 'file':
                return (<>
                    <Menu key="memory"      options={e => this.renderMenu('file-memory')}      >Load from Memory</Menu>
                    <Menu key="file"        onAction={(e) => this.openSongFromFileDialog(e)} >Load from File</Menu>
                    <Menu key="url"         disabled>Load from URL</Menu>
                    <Menu key="library"     disabled>Load from Library</Menu>
                </>);

            case 'file-memory':
                const storage = new Storage();
                const songRecentUUIDs = storage.getRecentSongList() ;
                return songRecentUUIDs.length > 0
                    ? songRecentUUIDs.map((entry, i) =>
                        <Menu
                            key={i}
                            onAction={() => this.loadSongFromMemory(entry.uuid)}
                        >{entry.name || entry.uuid}</Menu>)
                    :<Menu
                        key="no-recent"
                        disabled
                    >No Songs Available</Menu>

            case 'playlist':
                return (<>
                    <Menu key="next"        onAction={(e) => this.playlistNext()}>Load from Memory</Menu>
                    <Menu key="clear"       onAction={(e) => this.clearPlaylist()} >Load from File</Menu>
                </>);

            case 'view':
                return (<>
                    <Menu key="fullscreen"          onAction={(e) => this.toggleFullscreen(e)}>{this.state.fullscreen ? 'Disable' : 'Enable'} Fullscreen</Menu>
                    <Menu key="hide-panel-song"     onAction={(e) => this.togglePanelSong(e)} >{this.state.showPanelSong ? 'Show' : 'Hide'} Song Forms</Menu>
                    <Menu key="hide-panel-playlist" onAction={(e) => this.togglePanelPlaylist(e)} >{this.state.showPanelPlaylist ? 'Show' : 'Hide'} Playlist</Menu>
                </>);

            default:
                throw new Error("Unknown menu key: " + menuKey);
        }
    }

}

export default PlayerRenderer;
