import React from "react";

import {ASUIIcon, ASUIForm, ASUIPanel, ASUIInputRange, ASUIButton} from "../../components";

export default class ASComposerSongPanel extends React.Component {
    constructor(props) {
        super(props);
        const composer = this.props.composer;
        this.formats = {
            songPosition: function(value) {
                return composer.values.formatPlaybackPosition(composer.songStats.position);
            }
        }
    }
    render() {
        const composer = this.props.composer;
        const song = this.props.composer.getSong();
        const cb = composer.cb;
        const state = composer.state;
        const songStats = composer.songStats;
        const panelModes = state.panelModes || {};
        // const positionString = composer.values.formatPlaybackPosition(songStats.position);
        return (
            <ASUIPanel viewKey="song" header="Song Information">
                <ASUIForm className="playback" horizontal header="Playback">
                    <ASUIButton
                        className="song-play wide"
                        onAction={cb.songPlay}
                    >
                        <ASUIIcon source="play"/>
                    </ASUIButton>
                    <ASUIButton
                        className="song-pause wide"
                        onAction={cb.songPause}
                    >
                        <ASUIIcon source="pause"/>
                    </ASUIButton>
                    <ASUIButton
                        className="song-stop wide"
                        onAction={cb.songStop}
                    >
                        <ASUIIcon source="stop"/>
                    </ASUIButton>
                </ASUIForm>

                {state.portrait ? null : <ASUIForm className="file" horizontal header="File">
                    <ASUIButton
                        className="file-load wide"
                        onAction={cb.loadSongFromFileInput}
                        accept=".json,.mid,.midi"
                        title="Load Song from File"
                    >
                        <ASUIIcon source="file-load"/>
                    </ASUIButton>
                    <ASUIButton
                        className="file-save wide"
                        onAction={cb.saveSongToMemory}
                        title="Save Song to File"
                    >
                        <ASUIIcon source="file-save"/>
                    </ASUIButton>
                </ASUIForm>}

                <ASUIForm className="volume" horizontal header="Volume">
                    <ASUIInputRange
                        className="volume"
                        onChange={(newVolume) => composer.setVolume(newVolume/100)}
                        value={state.volume*100}
                        format={ASUIInputRange.formats.percent}
                        min={0}
                        max={100}
                        title="Song Volume"
                    />
                </ASUIForm>

                <ASUIForm className="position" header="Position">
                    <ASUIInputRange
                        className="position"
                        onChange={(pos) => composer.setSongPositionPercentage(pos)}
                        value={Math.floor(songStats.position / (state.songLength || 1) * 100)}
                        format={this.formats.songPosition}
                        min={0}
                        max={100}
                        // ref={ref => this.fieldSongPosition = ref}
                        title="Song Position"
                    />
                </ASUIForm>

                {/*<ASUIForm className="timing" header="Timing">*/}
                {/*    <ASUIButton*/}
                {/*        className="timing wide"*/}
                {/*        onAction={(e, timingString) => composer.setSongPositionPrompt(timingString)}*/}
                {/*        title="Song Timing"*/}
                {/*        children={positionString}*/}
                {/*    />*/}
                {/*</ASUIForm>*/}

                {state.portrait ? null : <ASUIForm className="name" header="Name">
                    <ASUIButton
                        className="name wide"
                        onAction={(e) => composer.setSongNamePrompt()}
                        title="Song Name"
                        children={song ? song.data.title : "no song loaded"}
                    />
                </ASUIForm>}

                <ASUIForm className="version" header="Version">
                    <ASUIButton
                        className="version wide"
                        onAction={(e) => composer.setSongVersionPrompt()}
                        title="Song Version"
                        children={song ? song.data.version : "0.0.0"}
                    />
                </ASUIForm>

                <ASUIForm className="beatsPerMinute" header="BPM">
                    <ASUIButton
                        className="beats-per-minute wide"
                        onAction={(e) => composer.setSongStartingBPMPrompt()}
                        title="Song Beats Per Minute"
                        children={song ? song.data.beatsPerMinute : "N/A"}
                    />
                </ASUIForm>
            </ASUIPanel>
        );
    }
}


