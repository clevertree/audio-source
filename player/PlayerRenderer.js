import React from "react";

import {Div, SubMenu, ActionMenu, Button, InputRange} from "../components";

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
                            <Button
                                className="song-play"
                                onAction={e => this.playlistPlay(e)}
                            >
                                <Icon className="play"/>
                            </Button>
                            <Button
                                className="song-pause"
                                onAction={e => this.playlistPause(e)}
                            >
                                <Icon className="pause"/>
                            </Button>
                            <Button
                                className="song-stop"
                                onAction={e => this.playlistStop(e)}
                            >
                                <Icon className="stop"/>
                            </Button>
                            <Button
                                className="song-next"
                                onAction={e => this.playlistNext(e)}
                            >
                                <Icon className="next"/>
                            </Button>
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
                            <Button
                                className="file-save"
                                onAction={e => this.saveSongToFile(e)}
                                title="Save Song to File"
                            >
                                <Icon className="file-save"/>
                            </Button>
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
                            <Button
                                className="timing"
                                onAction={(e) => this.setSongPosition(e)}
                                ref={ref => this.fieldSongTiming = ref}
                                title="Song Timing"
                                children="00:00:000"
                            />
                        </Form>

                        <Form className="name" title="Name">
                            <Button
                                className="name"
                                // onChange={(e, newSongName) => this.setSongName(e, newSongName)}
                                title="Song Name"
                                children={this.song ? this.song.getTitle() : "no song loaded"}
                            />
                        </Form>

                        <Form className="version" title="Version">
                            <Button
                                className="version"
                                // onChange={(e, newSongVersion) => this.setSongVersion(e, newSongVersion)}
                                ref={ref => this.fieldSongVersion = ref}
                                title="Song Version"
                                children={this.song ? this.song.getVersion() : "0.0.0"}
                            />
                        </Form>

                        <Form className="source" title="Source">
                            <Button
                                className="source"
                                onAction={(e, newSongVersion) => this.openSongSource(e, newSongVersion)}
                                title="Song Source"
                            >
                                <Icon className="source"/>
                            </Button>
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
                    <SubMenu vertical={vertical} key="file"        children={e => this.renderMenu('file')}      >File</SubMenu>
                    <SubMenu vertical={vertical} key="playlist"    children={e => this.renderMenu('playlist')}  >Playlist</SubMenu>
                    <SubMenu vertical={vertical} key="view"        children={e => this.renderMenu('view')}      >View</SubMenu>
                </>);
            // return [
            //     // Menu.cME('refresh',     'Refresh',  (e) => this.restart()),
            //     Menu.cSME({vertical, key:'file'},        'File',     () => this.renderMenu('file')),
            //     Menu.cSME({vertical, key:'playlist'},    'Playlist', () => this.renderMenu('playlist')),
            //     Menu.cSME({vertical, key:'view'},        'View',     () => this.renderMenu('view')),
            // ];

            case 'file':
                return (<>
                    <SubMenu key="memory"      children={e => this.renderMenu('file-memory')}      >Load from Memory</SubMenu>
                    <ActionMenu key="file"        onAction={(e) => this.openSongFromFileDialog(e)} >Load from File</ActionMenu>
                    <ActionMenu key="url"         disabled>Load from URL</ActionMenu>
                    <SubMenu key="library"     disabled>Load from Library</SubMenu>
                </>);

            case 'file-memory':
                const storage = new Storage();
                const songRecentUUIDs = storage.getRecentSongList() ;
                return songRecentUUIDs.length > 0
                    ? songRecentUUIDs.map((entry, i) =>
                        <ActionMenu
                            key={i}
                            onAction={() => this.loadSongFromMemory(entry.uuid)}
                        >{entry.name || entry.uuid}</ActionMenu>)
                    :<ActionMenu
                        key="no-recent"
                        disabled
                    >No Songs Available</ActionMenu>

            case 'playlist':
                return (<>
                    <ActionMenu key="next"        onAction={(e) => this.playlistNext()}>Load from Memory</ActionMenu>
                    <ActionMenu key="clear"       onAction={(e) => this.clearPlaylist()} >Load from File</ActionMenu>
                </>);

            case 'view':
                return (<>
                    <ActionMenu key="fullscreen"          onAction={(e) => this.toggleFullscreen(e)}>{this.state.fullscreen ? 'Disable' : 'Enable'} Fullscreen</ActionMenu>
                    <ActionMenu key="hide-panel-song"     onAction={(e) => this.togglePanelSong(e)} >{this.state.showPanelSong ? 'Show' : 'Hide'} Song Forms</ActionMenu>
                    <ActionMenu key="hide-panel-playlist" onAction={(e) => this.togglePanelPlaylist(e)} >{this.state.showPanelPlaylist ? 'Show' : 'Hide'} Playlist</ActionMenu>
                </>);

            default:
                throw new Error("Unknown menu key: " + menuKey);
        }
    }

}

export default PlayerRenderer;
