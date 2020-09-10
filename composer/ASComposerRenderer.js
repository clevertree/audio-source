import React from "react";

import ASComposerContainer from "./container/ASComposerContainer";
import ASCTracksContainer from "./track/container/ASCTracksContainer";
import ASComposerSongPanel from "./panel/ASComposerSongPanel";
import ASComposerSongProgramsPanel from "./panel/ASComposerSongProgramsPanel";
import ASComposerTrackPanel from "./panel/ASComposerTrackPanel";
import ASComposerBase from "./ASComposerBase";
import ASUIGlobalContext from "../components/context/ASUIGlobalContext";
import ASComposerSessionPanel from "./panel/ASComposerSessionPanel";

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
                    <ASComposerSessionPanel composer={this} ref={this.ref.panelSession} />
                    <ASComposerSongProgramsPanel composer={this} ref={this.ref.panelProgram}/>

                    <ASCTracksContainer
                        composer={this}
                        />
                    {this.renderWebViewProxy()}
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
}

