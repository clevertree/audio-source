import * as React from "react";
import ASCTrack from "../ASCTrack";

export default class ASCTracksContainerBase extends React.Component {
    /** Render **/

    render() {
        return this.renderTracks();
    }

    // TODO: auto scroll to selected track when selected track changes?

    renderTracks() {
        const composer = this.props.composer;
        const selectedTrackName = this.props.selectedTrackName;
        let trackList = Object.keys(composer.state.activeTracks);
        let collapsed = false;
        if(composer.state.portrait) {
            collapsed = true;
            // const selectedTrackID = trackList.indexOf(selectedTrackName);
            // if (selectedTrackID !== -1)
            //     trackList.unshift(trackList.splice(selectedTrackID, 1)[0])
        }
        return trackList.map(trackName => {
            const selected = trackName === selectedTrackName;
            return <ASCTrack
                key={trackName}
                trackName={trackName}
                trackState={composer.state.activeTracks[trackName]}
                selected={selected}
                composer={composer}
                collapsed={collapsed && !selected}
            />
        })
    }

}

