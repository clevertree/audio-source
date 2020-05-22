import React from "react";

import {
    ASUIButton,
    ASUIDiv,
    ASUIForm,
    ASUIIcon,
    ASUIInputRange,
    ASUIMenuOverlayContainer,
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
                <ASUIMenuOverlayContainer
                    isActive={this.state.portrait}
                >
                    <ASUIDiv key="header" className="asp-title-container">
                        <ASPlayerHeader
                            title={this.state.title}
                            portrait={this.state.portrait}
                            menuContent={() => this.renderRootMenu()}
                            />
                    </ASUIDiv>
                    <ASUIDiv className="asp-forms-container">
                        <ASUIPanel className="song" header="Song">
                            <ASUIForm className="playback" header="Playback">
                                <ASUIButton
                                    className="song-play"
                                    onAction={e => this.playlistPlay(e)}
                                >
                                    <ASUIIcon source="play"/>
                                </ASUIButton>
                                <ASUIButton
                                    className="song-pause"
                                    onAction={e => this.playlistPause(e)}
                                >
                                    <ASUIIcon source="pause"/>
                                </ASUIButton>
                                <ASUIButton
                                    className="song-stop"
                                    onAction={e => this.playlistStop(e)}
                                >
                                    <ASUIIcon source="stop"/>
                                </ASUIButton>
                                <ASUIButton
                                    className="song-next"
                                    onAction={e => this.playlistNext(e)}
                                >
                                    <ASUIIcon source="next"/>
                                </ASUIButton>
                            </ASUIForm>

                            <ASUIForm className="file" header="File">
                                <ASUIButton
                                    className="file-load"
                                    onAction={(e) => this.loadSongFromFileInput(e)}
                                    accept=".json,.mid,.midi"
                                    ref={ref => this.fieldSongFileLoad = ref}
                                    title="Load Song from File"
                                >
                                    <ASUIIcon source="file-load"/>
                                </ASUIButton>
                                <ASUIButton
                                    className="file-save"
                                    onAction={e => this.saveSongToFile(e)}
                                    title="Save Song to File"
                                >
                                    <ASUIIcon source="file-save"/>
                                </ASUIButton>
                            </ASUIForm>

                            <ASUIForm className="volume" header="Volume">
                                <ASUIInputRange
                                    className="volume"
                                    onChange={(newVolume) => this.setVolume(newVolume / 100)}
                                    value={this.state.volume}
                                    min={1}
                                    max={100}
                                    ref={ref => this.fieldSongVolume = ref}
                                    title="Song Volume"
                                />
                            </ASUIForm>

                            <ASUIForm className="position" header="Position">
                                <ASUIInputRange
                                    className="position"
                                    onChange={(pos) => this.setSongPosition(pos)}
                                    value={0}
                                    min={0}
                                    max={Math.ceil(this.state.songLength) || 1}
                                    ref={ref => this.fieldSongPosition = ref}
                                    title="Song Position"
                                />
                            </ASUIForm>

                            <ASUIForm className="timing" header="Timing">
                                <ASUIButton
                                    className="timing"
                                    onAction={(e) => this.setSongPositionPrompt()}
                                    ref={ref => this.fieldSongTiming = ref}
                                    title="Song Timing"
                                    children="00:00:000"
                                />
                            </ASUIForm>

                            <ASUIForm className="name" header="Name">
                                <ASUIButton
                                    className="name"
                                    onAction={(e) => this.setSongNamePrompt()}
                                    title="Song Name"
                                    children={this.song ? this.song.data.title : "no song loaded"}
                                />
                            </ASUIForm>

                            <ASUIForm className="version" header="Version">
                                <ASUIButton
                                    className="version"
                                    onAction={(e) => this.setSongVersionPrompt()}
                                    ref={ref => this.fieldSongVersion = ref}
                                    title="Song Version"
                                    children={this.song ? this.song.data.version : "0.0.0"}
                                />
                            </ASUIForm>

                            <ASUIForm className="source" header="Source">
                                <ASUIButton
                                    className="source"
                                    onAction={(e, newSongVersion) => this.openSongSource(e, newSongVersion)}
                                    title="Song Source"
                                >
                                    <ASUIIcon source="source"/>
                                </ASUIButton>
                            </ASUIForm>
                        </ASUIPanel>
                        <ASUIPanel className="playlist" header="Playlist" styleContainer={{}}>
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
                </ASUIMenuOverlayContainer>
            </ASUIDiv>
        )
    }

}

export default ASPlayerRenderer;
