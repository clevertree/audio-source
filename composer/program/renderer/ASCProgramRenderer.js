import React from "react";
import {
    ASUIIcon,
    ASUIButtonDropDown,
    ASUIButton,
} from "../../../components";
import ASCProgramRendererBase from "./ASCProgramRendererBase";

import "./ASCProgramRenderer.css";

export default class ASCProgramRenderer extends ASCProgramRendererBase {

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
                        onAction={this.cb.toggleContainer}
                    >
                        {programIDHTML}: {titleHTML}
                    </ASUIButton>
                    {!this.props.showBrowser ? <ASUIButtonDropDown
                        arrow={false}
                        className="program-config"
                        options={this.cb.menuRoot}
                    >
                        <ASUIIcon source="config"/>
                    </ASUIButtonDropDown> : <ASUIButton
                        className="preset-browser-close"
                        onAction={this.cb.togglePresetBrowser}
                    >
                        <ASUIIcon source="close"/>
                    </ASUIButton>}
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
