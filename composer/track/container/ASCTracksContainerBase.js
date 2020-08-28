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
        const songData = composer.getSong().getProxiedData();
        // composer.ref.activeTracks = {};
        const activeTracks = composer.ref.activeTracks;

        const selectedTrack = composer.state.selectedTrack;
        const selectedIndices = composer.state.selectedIndices;
        let trackList = Object.keys(songData.tracks);
        // let collapsed = false;
        // if(composer.state.portrait) {
            // collapsed = true;
            // const selectedTrackID = trackList.indexOf(selectedTrackName);
            // if (selectedTrackID !== -1)
            //     trackList.unshift(trackList.splice(selectedTrackID, 1)[0])
        // }
        return trackList.map((trackName) => {
            // if(!songData.tracks[trackName])
            //     return null;
            if(!activeTracks[trackName])
                activeTracks[trackName] = React.createRef(); // TODO: flaw?
            const selected = trackName === selectedTrack;
            return <ASCTrack
                ref={activeTracks[trackName]}
                key={trackName}
                trackName={trackName}
                selectedIndices={selected ? selectedIndices : []}
                // trackState={composer.state.activeTracks[trackName]}
                selected={selected}
                composer={composer}
                // collapsed={collapsed && !selected}
            />
        })
    }

}

