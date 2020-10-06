import React from "react";

import {ASUIIcon, ASUIFormEntry, ASUIPanel, ASUIInputRange, ASUIClickable} from "../../components";
import {Values} from "../../song";

export default class ASComposerSongPanel extends React.Component {
    constructor(props) {
        super(props);
        const composer = this.props.composer;
        this.formats = {
            songPosition: function(value) {
                return Values.instance.formatPlaybackPosition(composer.songStats.position);
            }
        }
        this.cb = {
            setSongPositionPercentage: (pos) => composer.setSongPositionPercentage(pos),
            setSongNamePrompt: (e) => composer.setSongNamePrompt(),
            setVolume: (newVolume) => composer.setVolume(newVolume/100),
            setSongVersionPrompt: (e) => composer.setSongVersionPrompt(),
            setSongStartingBPMPrompt: (e) => composer.setSongStartingBPMPrompt(),
        }
    }
    render() {
        const composer = this.props.composer;
        const song = this.props.composer.getSong();
        const cb = composer.cb;
        const state = composer.state;
        const songStats = composer.songStats;
        // console.log('state', state);
        // const positionString = composer.values.formatPlaybackPosition(songStats.position);
        return (
            <ASUIPanel viewKey="song" header="Song Information">
                <ASUIFormEntry className="playback" horizontal header="Playback">
                    <ASUIClickable
                        button wide
                        className="song-play"
                        onAction={cb.songPlay}
                    >
                        <ASUIIcon source="play"/>
                    </ASUIClickable>
                    <ASUIClickable
                        button wide
                        className="song-pause wide"
                        onAction={cb.songPause}
                    >
                        <ASUIIcon source="pause"/>
                    </ASUIClickable>
                    <ASUIClickable
                        button wide
                        className="song-stop wide"
                        onAction={cb.songStop}
                    >
                        <ASUIIcon source="stop"/>
                    </ASUIClickable>
                </ASUIFormEntry>

                {state.portrait ? null : <ASUIFormEntry className="file" horizontal header="File">
                    <ASUIClickable
                        button wide
                        className="file-load"
                        onAction={cb.openSongFromFileDialog}
                        accept=".json,.mid,.midi"
                        title="Load Song from File"
                    >
                        <ASUIIcon source="file-load"/>
                    </ASUIClickable>
                    <ASUIClickable
                        button wide
                        className="file-save"
                        onAction={cb.saveSongToMemory}
                        title="Save Song to File"
                    >
                        <ASUIIcon source="file-save"/>
                    </ASUIClickable>
                </ASUIFormEntry>}

                <ASUIFormEntry className="volume" horizontal header="Volume">
                    <ASUIInputRange
                        className="volume"
                        onChange={this.cb.setVolume}
                        value={state.volume*100}
                        format={ASUIInputRange.formats.percent}
                        min={0}
                        max={100}
                        title="Song Volume"
                    />
                </ASUIFormEntry>

                <ASUIFormEntry className="position" header="Position">
                    <ASUIInputRange
                        className="position"
                        onChange={this.cb.setSongPositionPercentage}
                        value={Math.floor(songStats.position / (state.songLength || 1) * 100)}
                        format={this.formats.songPosition}
                        min={0}
                        max={100}
                        // ref={ref => this.fieldSongPosition = ref}
                        title="Song Position"
                    />
                </ASUIFormEntry>

                {/*<ASUIFormEntry className="timing" header="Timing">*/}
                {/*    <ASUIClickable*/}
                {/*        className="timing wide"*/}
                {/*        onAction={(e, timingString) => composer.setSongPositionPrompt(timingString)}*/}
                {/*        title="Song Timing"*/}
                {/*        children={positionString}*/}
                {/*    />*/}
                {/*</ASUIFormEntry>*/}

                {state.portrait ? null : <ASUIFormEntry className="name" header="Name">
                    <ASUIClickable
                        button wide
                        className="name"
                        onAction={this.cb.setSongNamePrompt}
                        title="Song Name"
                        children={song ? song.data.title : "no song loaded"}
                    />
                </ASUIFormEntry>}

                <ASUIFormEntry className="version" header="Version">
                    <ASUIClickable
                        button wide
                        className="version"
                        onAction={this.cb.setSongVersionPrompt}
                        title="Song Version"
                        children={song ? song.data.version : "0.0.0"}
                    />
                </ASUIFormEntry>

                <ASUIFormEntry className="beatsPerMinute" header="BPM">
                    <ASUIClickable
                        button wide
                        className="beats-per-minute"
                        onAction={this.cb.setSongStartingBPMPrompt}
                        title="Song Beats Per Minute"
                        children={song ? song.data.beatsPerMinute : "N/A"}
                    />
                </ASUIFormEntry>
            </ASUIPanel>
        );
    }
}


