import React from "react";

import {Div, Icon, Button, InputRange, Form, Panel} from "../components";


import Header from "./header/Header";
import Playlist from "./playlist/Playlist";
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

    render() {
        return (
            <Div className="asp-container">
                <Header
                    key="header"
                    menuContent={() => this.renderRootMenu()}
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

}

export default PlayerRenderer;
