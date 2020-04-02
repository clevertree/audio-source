import React from "react";

import {Div, Icon, InputRange, Form, Panel, MenuDropDown, Button, MenuOverlayContainer} from "../components";


import Playlist from "./playlist/Playlist";


class PlayerRenderer extends React.Component {
    constructor(props={}) {
        super(props);
        this.state = {
            title: "Audio Source Player",
            status: "[No Song Loaded]",
            version: require('../package.json').version,
            menuKey: 'root',
            fullscreen: false,
            portrait: true,
            showPanelSong: true,
            showPanelPlaylist: true,
        };
        this.playlist = null; // playlist ref;
        this.footerVersionText = React.createRef();
    }

    render() {
        return (
            <Div className={["asp-container", this.state.portrait ? 'portrait' : 'landscape'].join(' ')}>
                <MenuOverlayContainer
                    isActive={this.state.portrait}
                >
                    <Div key="header" className="asp-title-container">
                        <Div className="asp-title-text">{this.state.title}</Div>
                        {this.state.portrait
                            ? <MenuDropDown
                                arrow={false}
                                className="asp-menu-button-toggle"
                                options={(p) => this.renderRootMenu(p)}
                                >
                                <Icon className="menu" />
                              </MenuDropDown>
                            : <Div className="asp-menu-container">{(p) => this.renderRootMenu(p)}</Div>}
                    </Div>
                    <Div className="asp-forms-container">
                        <Panel className="song" header="Song">
                            <Form className="playback" header="Playback">
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

                            <Form className="file" header="File">
                                <Button
                                    className="file-load"
                                    onAction={(e) => this.loadSongFromFileInput(e)}
                                    accept=".json,.mid,.midi"
                                    ref={ref => this.fieldSongFileLoad = ref}
                                    title="Load Song from File"
                                >
                                    <Icon className="file-load"/>
                                </Button>
                                <Button
                                    className="file-save"
                                    onAction={e => this.saveSongToFile(e)}
                                    title="Save Song to File"
                                >
                                    <Icon className="file-save"/>
                                </Button>
                            </Form>

                            <Form className="volume" header="Volume">
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

                            <Form className="position" header="Position">
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

                            <Form className="timing" header="Timing">
                                <Button
                                    className="timing"
                                    onAction={(e) => this.setSongPosition(e)}
                                    ref={ref => this.fieldSongTiming = ref}
                                    title="Song Timing"
                                    children="00:00:000"
                                />
                            </Form>

                            <Form className="name" header="Name">
                                <Button
                                    className="name"
                                    onAction={(e) => this.setSongName(e)}
                                    title="Song Name"
                                    children={this.song ? this.song.data.title : "no song loaded"}
                                />
                            </Form>

                            <Form className="version" header="Version">
                                <Button
                                    className="version"
                                    onAction={(e) => this.setSongVersion(e)}
                                    ref={ref => this.fieldSongVersion = ref}
                                    title="Song Version"
                                    children={this.song ? this.song.data.version : "0.0.0"}
                                />
                            </Form>

                            <Form className="source" header="Source">
                                <Button
                                    className="source"
                                    onAction={(e, newSongVersion) => this.openSongSource(e, newSongVersion)}
                                    title="Song Source"
                                >
                                    <Icon className="source"/>
                                </Button>
                            </Form>
                        </Panel>
                        <Panel className="playlist" header="Playlist">
                            <Playlist
                                player={this}
                                ref={ref => this.playlist = ref}
                                />
                        </Panel>
                    </Div>
                    <Div key="footer" className="asp-footer-container">
                        <Div className="asp-status-text">{this.state.status}</Div>
                        <Div className="asp-version-text"
                             ref={this.footerVersionText}
                        >{this.state.version}</Div>
                    </Div>
                </MenuOverlayContainer>
            </Div>
        )
    }

}

export default PlayerRenderer;
