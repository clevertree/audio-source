import React from "react";
import {
    ASUIIcon,
    ASUIButtonDropDown,
    ASUIButton,
} from "../../../components";
import ASCProgramRendererBase from "./ASCProgramRendererBase";

import "./ASCProgramRenderer.css";

export default class ASCProgramRenderer extends ASCProgramRendererBase {
    constructor(props) {
        super(props);
        this.cb = {
            onFocus: e => this.onFocus(e)
        }
    }
    render() {
        const song = this.getSong();
        const programID = this.getProgramID();
        let programIDHTML = (programID < 10 ? "0" : "") + (programID);

        let className = 'asc-instrument-renderer';

        // let contentClass = 'error';
        let titleHTML = '', renderProgram = false;
        if (song.hasProgram(programID)) {
            const [, programConfig] = song.programGetData(programID);
            titleHTML = programConfig.title || "No Title"
            renderProgram = true;
        } else {
            titleHTML = `Empty`;
            className += ' empty';
        }
        return (
            <div className={className} tabIndex={0} onFocus={this.cb.onFocus}>
                <div className="header">
                    <ASUIButton
                        className="toggle-container"
                        selected={this.props.open}
                        onAction={e => this.toggleContainer()}
                    >{programIDHTML}: {titleHTML}</ASUIButton>
                    <ASUIButtonDropDown
                        arrow={false}
                        className="program-config"
                        options={() => this.renderMenuRoot()}
                    >
                        <ASUIIcon source="config"/>
                    </ASUIButtonDropDown>
                </div>
                {this.props.open ? <div className="content">
                    {this.props.showBrowser || !renderProgram ? this.renderPresetBrowser() : this.renderProgramContent()}
                </div> : null}
            </div>
        );

        // return content;
    }


    /** Input **/

    onFocus(e) {
        this.getComposer().setSelectedComponent('program', this.getProgramID());
    }

}
