import React from "react";

import {ASUIIcon, ASUIForm, ASUIPanel, ASUIInputRange, ASUIButton} from "../../components";

export default class ASComposerSongPanel extends React.Component {
    render() {
        const composer = this.props.composer;
        const song = this.props.composer.getSong();
        const cb = composer.cb;
        const state = composer.state;
        const songStats = composer.songStats;
        return (
            <ASUIPanel className="song" header="Song">
                <ASUIForm className="playback" header="Playback">
                    <ASUIButton
                        className="song-play"
                        onAction={cb.songPlay}
                    >
                        <ASUIIcon source="play"/>
                    </ASUIButton>
                    <ASUIButton
                        className="song-pause"
                        onAction={cb.songPause}
                    >
                        <ASUIIcon source="pause"/>
                    </ASUIButton>
                    <ASUIButton
                        className="song-stop"
                        onAction={cb.songStop}
                    >
                        <ASUIIcon source="stop"/>
                    </ASUIButton>
                </ASUIForm>

                {state.portrait ? null : <ASUIForm className="file" header="File">
                    <ASUIButton
                        className="file-load"
                        onAction={cb.loadSongFromFileInput}
                        accept=".json,.mid,.midi"
                        title="Load Song from File"
                    >
                        <ASUIIcon source="file-load"/>
                    </ASUIButton>
                    <ASUIButton
                        className="file-save"
                        onAction={cb.saveSongToFile}
                        title="Save Song to File"
                    >
                        <ASUIIcon source="file-save"/>
                    </ASUIButton>
                </ASUIForm>}

                <ASUIForm className="volume" header="Volume">
                    <ASUIInputRange
                        className="volume"
                        onChange={(newVolume) => composer.setVolume(newVolume)}
                        value={state.volume}
                        min={0}
                        max={1}
                        step={0.02}
                        title="Song Volume"
                    />
                </ASUIForm>

                <ASUIForm className="position" header="Position">
                    <ASUIInputRange
                        className="position"
                        onChange={(pos) => composer.setSongPositionPercentage(pos)}
                        value={Math.floor(songStats.position / (state.songLength || 1) * 100)}
                        min={0}
                        max={100}
                        // ref={ref => this.fieldSongPosition = ref}
                        title="Song Position"
                    />
                </ASUIForm>

                <ASUIForm className="timing" header="Timing">
                    <ASUIButton
                        onAction={(e, timingString) => composer.setSongPositionPrompt(timingString)}
                        title="Song Timing"
                        children={composer.values.formatPlaybackPosition(songStats.position)}
                    />
                </ASUIForm>

                {state.portrait ? null : <ASUIForm className="name" header="Name">
                    <ASUIButton
                        className="name"
                        onAction={(e) => composer.setSongNamePrompt()}
                        title="Song Name"
                        children={song ? song.data.title : "no song loaded"}
                    />
                </ASUIForm>}

                <ASUIForm className="version" header="Version">
                    <ASUIButton
                        className="version"
                        onAction={(e) => composer.setSongVersionPrompt()}
                        title="Song Version"
                        children={song ? song.data.version : "0.0.0"}
                    />
                </ASUIForm>

                <ASUIForm className="beatsPerMinute" header="BPM">
                    <ASUIButton
                        className="bpm"
                        onAction={(e) => composer.setSongStartingBPMPrompt()}
                        title="Song Beats Per Minute"
                        children={song ? song.data.beatsPerMinute : "N/A"}
                    />
                </ASUIForm>
            </ASUIPanel>
        );
    }
}


