import React from "react";

import {ASUIPanel} from "../../components";

export default class ASComposerKeyboardPanel extends React.Component {
    render() {
        const composer = this.props.composer;
        return (
            <ASUIPanel
                viewKey="keyboard"
                header="Keyboard">
                {/*<ASUIForm className="keyboard-octave" header="Octave">*/}
                {/*    <ASUIButtonDropDown*/}
                {/*        arrow={'▼'}*/}
                {/*        className="keyboard-octave"*/}
                {/*        options={() => this.renderMenuKeyboardSetOctave()}*/}
                {/*        title="Change Keyboard Octave"*/}
                {/*    >{composer.state.keyboardOctave}</ASUIButtonDropDown>*/}
                {/*</ASUIForm>*/}
            </ASUIPanel>
        );
    }
}


