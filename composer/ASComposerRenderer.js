import React from "react";

import ASComposerContainer from "./container/ASComposerContainer";
import ASCTracksContainer from "./track/container/ASCTracksContainer";
import ASComposerSongPanel from "./panel/ASComposerSongPanel";
import ASComposerProgramPanel from "./panel/ASComposerProgramPanel";
import ASComposerInstructionPanel from "./panel/ASComposerInstructionPanel";
import ASComposerTrackPanel from "./panel/ASComposerTrackPanel";

class ASComposerRenderer extends React.Component {
    constructor(props) {
        console.log('ASComposerRenderer.constructor', props);
        super(props);
        this.cb = {
            songPlay: () => this.songPlay(),
            songPause: () => this.songPause(),
            songStop: () => this.songStop(),
            loadSongFromFileInput: this.loadSongFromFileInput.bind(this),
            saveSongToFile: this.saveSongToFile.bind(this),
        }
        this.ref = {
            container: React.createRef(),
            panelSong: React.createRef()
        }
    }

    /** TODO: Error Handling **/

    // static getDerivedStateFromError(error) {
    //     console.log('getDerivedStateFromError', error);
    //     this.setError(error);
    //     // Update state so the next render will show the fallback UI.
    //     return { hasError: false };
    // }
    // componentDidCatch(error, errorInfo) {
    //     console.log('componentDidCatch', error, errorInfo);
    //     this.setError(error);
    // }

    openMenu(menuName) {
        this.ref.container.current.openMenu(menuName);
    }

    render() {
//         console.log('ASComposerRenderer.render()');
        return <ASComposerContainer
                    ref={this.ref.container}
                    composer={this}
                    >
                    {this.state.showPanelSong ? <ASComposerSongPanel composer={this} ref={this.ref.panelSong} /> : null}
                    {this.state.showPanelProgram ? <ASComposerProgramPanel composer={this} /> : null}
                    {this.state.showPanelInstruction ? <ASComposerInstructionPanel composer={this} /> : null}
                    {this.state.showPanelTrack ? <ASComposerTrackPanel composer={this} /> : null}
                    {/*{this.state.showPanelKeyboard ? <ASComposerKeyboardPanel composer={this} /> : null}*/}


                    <ASCTracksContainer
                        composer={this}
                        />
                    {this.renderWebViewProxy()}
                </ASComposerContainer>;
    }


    /** Render WebView Proxy **/
    renderWebViewProxy() {
        return null;
    }

}


export default ASComposerRenderer
