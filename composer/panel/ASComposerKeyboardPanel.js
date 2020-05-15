import React from "react";

import {ASUIForm, ASUIPanel, ASUIButtonDropDown} from "../../components";

export default class ASComposerKeyboardPanel extends React.Component {
    render() {
        return (
            <ASUIPanel
                className="keyboard"
                header="Keyboard">
                <ASUIForm className="keyboard-octave" header="Octave">
                    <ASUIButtonDropDown
                        arrow={'▼'}
                        className="keyboard-octave"
                        options={() => this.renderMenuKeyboardSetOctave()}
                        title="Change Keyboard Octave"
                    >{this.state.keyboardOctave}</ASUIButtonDropDown>
                </ASUIForm>
            </ASUIPanel>
        );
    }
}


