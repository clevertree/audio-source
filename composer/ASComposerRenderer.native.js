import React from "react";

import ASComposerContainer from "./container/ASComposerContainer";
import ASCTracksContainer from "./track/container/ASCTracksContainer";
import ASComposerSongPanel from "./panel/ASComposerSongPanel";
import ASComposerSongProgramsPanel from "./panel/ASComposerSongProgramsPanel";
import ASComposerInstructionPanel from "./panel/ASComposerInstructionPanel";
import ASComposerTrackPanel from "./panel/ASComposerTrackPanel";
import ASComposerPresetBrowserPanel from "./panel/ASComposerPresetBrowserPanel";
import ASComposerBase from "./ASComposerBase";

export default class ASComposerRenderer extends ASComposerBase {

    render() {
//         console.log('ASComposerRenderer.render()');
        return <ASComposerContainer
                    ref={this.ref.container}
                    composer={this}
                    >
                    {this.state.showPanelSong ? <ASComposerSongPanel composer={this} ref={this.ref.panelSong} /> : null}
                    {this.state.showPanelProgram ? <ASComposerSongProgramsPanel composer={this} /> : null}
                    {this.state.showPanelTrack ? <ASComposerTrackPanel composer={this} /> : null}
                    {this.state.showPanelInstruction ? <ASComposerInstructionPanel composer={this} /> : null}
                    {this.state.showPanelPresetBrowser ? <ASComposerPresetBrowserPanel composer={this} /> : null}
                    {/*{this.state.showPanelKeyboard ? <ASComposerKeyboardPanel composer={this} /> : null}*/}


                    <ASCTracksContainer
                        composer={this}
                        />
                    {this.renderWebViewProxy()}
                </ASComposerContainer>;
    }


}

