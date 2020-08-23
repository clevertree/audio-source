import React from "react";

import ASComposerContainer from "./container/ASComposerContainer";
import ASCTracksContainer from "./track/container/ASCTracksContainer";
import ASComposerSongPanel from "./panel/ASComposerSongPanel";
import ASComposerSongProgramsPanel from "./panel/ASComposerSongProgramsPanel";
import ASComposerInstructionPanel from "./panel/ASComposerInstructionPanel";
import ASComposerTrackPanel from "./panel/ASComposerTrackPanel";
import ASComposerBase from "./ASComposerBase";
import ASUIGlobalContext from "../components/context/ASUIGlobalContext";

export default class ASComposerRenderer extends ASComposerBase {

    render() {
//         console.log('ASComposerRenderer.render()');
        return (
            <ASUIGlobalContext.Provider
                value={this.cb.global}>
                <ASComposerContainer
                    ref={this.ref.container}
                    composer={this}
                    >
                    {/*<div className="asui-panel-container">*/}
                    {this.state.showPanelSong ? <ASComposerSongPanel composer={this} ref={this.ref.panelSong} /> : null}
                    <div className="asui-panel-container-horizontal">
                        {this.state.showPanelInstruction ? <ASComposerInstructionPanel composer={this} /> : null}
                        {this.state.showPanelTrack ? <ASComposerTrackPanel composer={this} /> : null}
                    </div>
                    {this.state.showPanelProgram ? <ASComposerSongProgramsPanel composer={this} /> : null}
                    {/*</div>*/}
                    {/*{this.state.showPanelKeyboard ? <ASComposerKeyboardPanel composer={this} /> : null}*/}

                    <ASCTracksContainer
                        composer={this}
                        />
                    {this.renderWebViewProxy()}
                </ASComposerContainer>
            </ASUIGlobalContext.Provider>
        );
    }
//                         {this.state.showPanelPresetBrowser ? <ASComposerPresetBrowserPanel composer={this} /> : null}

}

