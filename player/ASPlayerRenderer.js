import React from "react";

import {
    ASUIClickable,
    ASUIDiv,
    ASUIFormEntry,
    ASUIIcon,
    ASUIInputRange,
    ASUIContextMenuContainer,
    ASUIPanel
} from "../components";


import ASPPlaylist from "./playlist/ASPPlaylist";
import ASPlayerStyle from "./ASPlayerStyle";
import ASPlayerHeader from "./header/ASPlayerHeader";

class ASPlayerRenderer extends ASPlayerStyle {
    constructor(props={}) {
        super(props);
        this.state = {
            title: "Audio Source Player",
            statusText: "[No Song Loaded]",
            statusType: "log",
            version: require('../package.json').version,
            // menuKey: 'root',
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
            <ASUIDiv className={["asp-container", this.state.portrait ? 'portrait' : 'landscape'].join(' ')}>
                <ASUIContextMenuContainer
                    portrait={this.state.portrait}
                >
                    <ASUIDiv key="header" className="asp-title-container">
                        <ASPlayerHeader
                            title={this.state.title}
                            portrait={this.state.portrait}
                            menuContent={() => this.renderRootMenu()}
                            />
                    </ASUIDiv>
                    <ASUIDiv className="asp-forms-container">
                        <ASUIPanel viewKey="song" header="Song">
                            <ASUIFormEntry className="playback" header="Playback">
                                <ASUIClickable
                                    className="song-play"
                                    onAction={e => this.playlistPlay(e)}
                                >
                                    <ASUIIcon source="play"/>
                                </ASUIClickable>
                                <ASUIClickable
                                    className="song-pause"
                                    onAction={e => this.playlistPause(e)}
                                >
                                    <ASUIIcon source="pause"/>
                                </ASUIClickable>
                                <ASUIClickable
                                    className="song-stop"
                                    onAction={e => this.playlistStop(e)}
                                >
                                    <ASUIIcon source="stop"/>
                                </ASUIClickable>
                                <ASUIClickable
                                    className="song-next"
                                    onAction={e => this.playlistNext(e)}
                                >
                                    <ASUIIcon source="next"/>
                                </ASUIClickable>
                            </ASUIFormEntry>

                            <ASUIFormEntry className="file" header="File">
                                <ASUIClickable
                                    className="file-load"
                                    onAction={(e) => this.loadSongFromFileInput(e)}
                                    accept=".json,.mid,.midi"
                                    ref={ref => this.fieldSongFileLoad = ref}
                                    title="Load Song from File"
                                >
                                    <ASUIIcon source="file-load"/>
                                </ASUIClickable>
                                <ASUIClickable
                                    className="file-save"
                                    onAction={e => this.saveSongToFile(e)}
                                    title="Save Song to File"
                                >
                                    <ASUIIcon source="file-save"/>
                                </ASUIClickable>
                            </ASUIFormEntry>

                            <ASUIFormEntry className="volume" header="Volume">
                                <ASUIInputRange
                                    className="volume"
                                    onChange={(newVolume) => this.setVolume(newVolume / 100)}
                                    value={this.state.volume}
                                    min={1}
                                    max={100}
                                    ref={ref => this.fieldSongVolume = ref}
                                    title="Song Volume"
                                />
                            </ASUIFormEntry>

                            <ASUIFormEntry className="position" header="Position">
                                <ASUIInputRange
                                    className="position"
                                    onChange={(pos) => this.setSongPosition(pos)}
                                    value={Math.floor(this.state.songPosition / (this.state.songLength || 1) * 100)}
                                    min={0}
                                    max={Math.ceil(this.state.songLength) || 1}
                                    ref={ref => this.fieldSongPosition = ref}
                                    title="Song Position"
                                />
                            </ASUIFormEntry>

                            <ASUIFormEntry className="timing" header="Timing">
                                <ASUIClickable
                                    className="timing"
                                    onAction={(e) => this.setSongPositionPrompt()}
                                    ref={ref => this.fieldSongTiming = ref}
                                    title="Song Timing"
                                    children="00:00:000"
                                />
                            </ASUIFormEntry>

                            <ASUIFormEntry className="name" header="Name">
                                <ASUIClickable
                                    className="name"
                                    onAction={(e) => this.setSongNamePrompt()}
                                    title="Song Name"
                                    children={this.song ? this.song.data.title : "no song loaded"}
                                />
                            </ASUIFormEntry>

                            <ASUIFormEntry className="version" header="Version">
                                <ASUIClickable
                                    className="version"
                                    onAction={(e) => this.setSongVersionPrompt()}
                                    ref={ref => this.fieldSongVersion = ref}
                                    title="Song Version"
                                    children={this.song ? this.song.data.version : "0.0.0"}
                                />
                            </ASUIFormEntry>

                            <ASUIFormEntry className="source" header="Source">
                                <ASUIClickable
                                    className="source"
                                    onAction={(e, newSongVersion) => this.openSongSource(e, newSongVersion)}
                                    title="Song Source"
                                >
                                    <ASUIIcon source="source"/>
                                </ASUIClickable>
                            </ASUIFormEntry>
                        </ASUIPanel>
                        <ASUIPanel viewKey="playlist" header="Playlist" styleContainer={{}}>
                            <ASPPlaylist
                                player={this}
                                ref={ref => this.playlist = ref}
                                />
                        </ASUIPanel>
                    </ASUIDiv>
                    <ASUIDiv key="footer" className="asp-footer-container">
                        <ASUIDiv className={`asp-status-text ${this.state.statusType}`}>{this.state.statusText}</ASUIDiv>
                        <ASUIDiv className="asp-version-text"
                             ref={this.footerVersionText}
                        >{this.state.version}</ASUIDiv>
                    </ASUIDiv>
                </ASUIContextMenuContainer>
            </ASUIDiv>
        )
    }

}

export default ASPlayerRenderer;
