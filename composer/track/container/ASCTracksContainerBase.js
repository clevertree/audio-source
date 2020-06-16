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
        composer.activeTracks = {};

        const selectedTrackName = composer.state.selectedTrack;
        let trackList = Object.keys(composer.state.activeTracks);
        let collapsed = false;
        if(composer.state.portrait) {
            collapsed = true;
            // const selectedTrackID = trackList.indexOf(selectedTrackName);
            // if (selectedTrackID !== -1)
            //     trackList.unshift(trackList.splice(selectedTrackID, 1)[0])
        }
        return trackList.map((trackName) => {
            composer.activeTracks[trackName] = React.createRef(); // TODO: flaw?
            const selected = trackName === selectedTrackName;
            return <ASCTrack
                ref={composer.activeTracks[trackName]}
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

