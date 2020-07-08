import React from "react";

import {ASUIPanel} from "../../components";
import ASCPresetBrowser from "../program/browser/ASCPresetBrowser";

export default class ASComposerPresetBrowserPanel extends React.Component {

    render() {
        return (
            <ASUIPanel
                className="preset-browser"
                header="Preset Browser"
                title="Program Preset Browser">
                <ASCPresetBrowser
                    {...this.props}
                />
            </ASUIPanel>
        );
    }

}

