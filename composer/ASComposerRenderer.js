import React from "react";

import ASComposerContainer from "./container/ASComposerContainer";
import ASComposerSongPanel from "./panel/ASComposerSongPanel";
import ASComposerSongProgramsPanel from "./panel/ASComposerSongProgramsPanel";
import ASComposerTrackPanel from "./panel/ASComposerTrackPanel";
import ASComposerBase from "./ASComposerBase";
import ASUIGlobalContext from "../components/context/ASUIGlobalContext";

import ASCTrack from "./track/ASCTrack";

import ASComposerLoginModal from "./modal/ASComposerLoginModal";
import ASComposerRegistrationModal from "./modal/ASComposerRegistrationModal";
import ASComposerPublishModal from "./modal/ASComposerPublishModal";
import ASComposerMessageModal from "./modal/ASComposerMessageModal";
import ASComposerLogoutModal from "./modal/ASComposerLogoutModal";
import ASComposerPublishSuccessModal from "./modal/ASComposerPublishSuccessModal";

export default class ASComposerRenderer extends ASComposerBase {

    render() {
        // console.log('ASComposerRenderer.render()');
        return (
            <ASUIGlobalContext.Provider
                value={this.cb.global}>
                <ASComposerContainer
                    ref={this.ref.container}
                    composer={this}
                    >
                    {this.state.portrait ? this.renderSongPanelPortrait() : this.renderSongPanelLandscape()}
                    {this.renderTracks()}
                    {this.state.showModal ? this.renderModals() : null}
                </ASComposerContainer>
            </ASUIGlobalContext.Provider>
        );
    }
//                         {this.state.showPanelPresetBrowser ? <ASComposerPresetBrowserPanel composer={this} /> : null}

    renderSongPanelPortrait() {
        return <>
            <ASComposerSongPanel composer={this} ref={this.ref.panelSong} />
            <div className="asui-panel-container-horizontal">
                <ASComposerTrackPanel composer={this} ref={this.ref.panelTrack} />
            </div>
            <ASComposerSongProgramsPanel composer={this} ref={this.ref.panelProgram}/>
        </>
    }

    renderSongPanelLandscape() {
        return <>
            <ASComposerSongPanel composer={this} ref={this.ref.panelSong} />

            <br className="asui-track-panel-break"/>
            <ASComposerTrackPanel composer={this} ref={this.ref.panelTrack} />
            <br className="asui-track-panel-break"/>
            <ASComposerSongProgramsPanel composer={this} ref={this.ref.panelProgram}/>
            <br />
        </>

    }

    /** Render Modals **/
    renderModals() {
        const props = {
            composer: this,
            modalArgs: this.state.modalArgs
        }
        switch(this.state.showModal) {
            case "message":
                return <ASComposerMessageModal {...props}/>

            case "login":
                return <ASComposerLoginModal {...props}/>

            case "logout":
                return <ASComposerLogoutModal {...props}/>

            case "registration":
                return <ASComposerRegistrationModal {...props}/>

            case "publish":
                return <ASComposerPublishModal {...props}/>

            case "publish-success":
                return <ASComposerPublishSuccessModal {...props}/>
            default:
                throw new Error("Invalid modal: " + this.state.showModal);
        }
    }

    /** Render Tracks **/

    // TODO: auto scroll to selected track when selected track changes?

    renderTracks() {
        const songTracks = this.getSong().data.tracks;
        // composer.ref.activeTracks = {};
        const activeTracks = this.ref.activeTracks;

        const selectedTrack = this.getSelectedTrackName();
        // const selectedIndices = composer.state.selectedIndices;
        // let trackList = Object.keys(songData.tracks);
        // let collapsed = false;
        // if(composer.state.portrait) {
        // collapsed = true;
        // const selectedTrackID = trackList.indexOf(selectedTrackName);
        // if (selectedTrackID !== -1)
        //     trackList.unshift(trackList.splice(selectedTrackID, 1)[0])
        // }
        return Object.keys(songTracks).map((trackName) => {
            // if(!songData.tracks[trackName])
            //     return null;
            if(!activeTracks[trackName])
                activeTracks[trackName] = React.createRef(); // TODO: flaw?
            const selected = trackName === selectedTrack;
            return <ASCTrack
                ref={activeTracks[trackName]}
                key={trackName}
                trackName={trackName}
                // selectedIndices={selected ? selectedIndices : []}
                // trackState={composer.state.activeTracks[trackName]}
                selected={selected}
                composer={this}
                // collapsed={collapsed && !selected}
            />
        })
    }


    /** Render WebView Proxy **/
    renderWebViewProxy() {
        return null;
    }

}

