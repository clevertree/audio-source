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

        let open = this.props.open;
        // let contentClass = 'error';
        let titleHTML = '';
        if (song.hasProgram(programID)) {
            const [, programConfig] = song.programGetData(programID);
            titleHTML = programConfig.title || "No Title"
        } else {
            titleHTML = `Empty`;
            className += ' empty';
            open = 'browser';
        }
        if(open)
            className += ' open';
        return (
            <div className={className}
                 tabIndex={0}
                 onFocus={this.cb.onFocus}
                 onKeyDown={this.cb.onKeyPress}
                 onKeyUp={this.cb.onKeyPress}
            >
                <div className="header">
                    <ASUIClickable
                        button
                        className="toggle-container"
                        selected={!!open}
                        onAction={this.cb.toggleContainer}
                    >
                        {programIDHTML}: {titleHTML}
                    </ASUIClickable>
                    {typeof open !== "string" ? <ASUIClickableDropDown
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
                        onAction={this.cb.toggleContainer}
                    >
                        <ASUIIcon source="close"/>
                    </ASUIClickable>}
                </div>
                {open ? this.renderContent(open) : null}
            </div>
        );

        // return content;
    }

    renderContent(open) {
        switch(open) {
            case 'browser':
                return this.renderPresetBrowser();
            case 'source':
                return this.renderSourceEdit();
            default:
                return this.renderProgramContent();

        }
    }

}
