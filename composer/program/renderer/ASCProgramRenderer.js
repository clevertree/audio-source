import React from "react";
import {
    ASUIIcon,
    ASUIClickableDropDown,
    ASUIClickable,
} from "../../../components";
import ASCProgramRendererBase from "./ASCProgramRendererBase";

import "./ASCProgramRenderer.css";

export default class ASCProgramRenderer extends ASCProgramRendererBase {

    render() {
        const song = this.getSong();
        const programID = this.getProgramID();
        let programIDHTML = (programID < 10 ? "0" : "") + (programID);

        let className = 'asc-instrument-renderer';
        if(this.props.selected)
            className += ' selected';

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
        const open = this.props.open;
        if(open)
            className += ' open';
        return (
            <div className={className}
                 // tabIndex={0}
                 onFocus={this.cb.onFocus}>
                <div className="header">
                    <ASUIClickable
                        button
                        className="toggle-container"
                        selected={!!open}
                        onAction={this.cb.toggleContainer}
                    >
                        {programIDHTML}: {titleHTML}
                    </ASUIClickable>
                    {open !== 'browser' ? <ASUIClickableDropDown
                        button
                        arrow={false}
                        vertical={false}
                        className="program-config"
                        options={this.cb.menuRoot}
                    >
                        <ASUIIcon source="config"/>
                    </ASUIClickableDropDown> : <ASUIClickable
                        button
                        className="preset-browser-close"
                        onAction={this.cb.togglePresetBrowser}
                    >
                        <ASUIIcon source="close"/>
                    </ASUIClickable>}
                </div>
                {open ? <div className="content">
                    {open === 'browser' || !renderProgram ? this.renderPresetBrowser() : this.renderProgramContent()}
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
