import React from "react";

import ASComposerContainer from "./container/ASComposerContainer";
import ASCTracksContainer from "./track/container/ASCTracksContainer";
import ASComposerSongPanel from "./panel/ASComposerSongPanel";
import ASComposerSongProgramsPanel from "./panel/ASComposerSongProgramsPanel";
import ASComposerTrackPanel from "./panel/ASComposerTrackPanel";
import ASComposerBase from "./ASComposerBase";
import ASUIGlobalContext from "../components/context/ASUIGlobalContext";
import ASComposerLoginModal from "./modal/ASComposerLoginModal";
import ASComposerRegistrationModal from "./modal/ASComposerRegistrationModal";
import ASComposerLoginSuccessModal from "./modal/ASComposerLoginSuccessModal";
import ASComposerRegistrationSuccessModal from "./modal/ASComposerRegistrationSuccessModal";
import ASComposerPublishModal from "./modal/ASComposerPublishModal";
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
                    <ASComposerSongProgramsPanel composer={this} ref={this.ref.panelProgram}/>

                    <ASCTracksContainer
                        composer={this}
                        />
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
        </>
    }

    renderSongPanelLandscape() {
        return <>
            <ASComposerSongPanel composer={this} ref={this.ref.panelSong} />

            <br  className="asui-track-panel-break"/>
            <ASComposerTrackPanel composer={this} ref={this.ref.panelTrack} />
            <br  className="asui-track-panel-break"/>
        </>

    }

    /** Render Modals **/
    renderModals() {
        switch(this.state.showModal) {
            case "login":
                return <ASComposerLoginModal composer={this}/>
            case "login-success":
                return <ASComposerLoginSuccessModal composer={this}/>

            case "registration":
                return <ASComposerRegistrationModal composer={this}/>
            case "registration-success":
                return <ASComposerRegistrationSuccessModal composer={this}/>

            case "publish":
                return <ASComposerPublishModal composer={this}/>
            case "publish-success":
                return <ASComposerPublishSuccessModal composer={this}/>
            default:
                throw new Error("Invalid modal: " + this.state.showModal);
        }
    }


    /** Render WebView Proxy **/
    renderWebViewProxy() {
        return null;
    }

}

