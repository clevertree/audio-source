import React from "react";
import {
    ASUIDiv,
    ASUIIcon,
    // Button,
    ASUIButtonDropDown,
    ASUIMenuAction,
    ASUIMenuDropDown, ASUIButton, ASUIMenuBreak,
} from "../../components";
import {Library} from "../../song";

import "./assets/ASCProgramRenderer.css";
import ASCProgramRendererBase from "./ASCProgramRendererBase";

export default class ASCProgramRenderer extends ASCProgramRendererBase {
    render() {
        const song = this.getSong();
        const programID = this.props.programID;
        const programConfig = song.programGetData(programID);
        const programIDHTML = (programID < 10 ? "0" : "") + (programID);


        // let contentClass = 'error';
        let titleHTML = '';
        if (song.hasProgram(programID)) {
            titleHTML = programConfig.title || "No Title"

        } else {
            titleHTML = `Empty`;
        }
        return (
            <ASUIDiv className="asc-instrument-renderer-empty">
                <ASUIDiv className="header">
                    <ASUIButton
                        className="toggle-container"
                        onAction={e => this.toggleContainer()}
                    >{programIDHTML}: {titleHTML}</ASUIButton>
                    <ASUIButtonDropDown
                        arrow={false}
                        className="program-config"
                        options={() => this.renderMenuRoot()}
                    >
                        <ASUIIcon source="config"/>
                    </ASUIButtonDropDown>
                </ASUIDiv>
                {this.state.open ? <ASUIDiv className="content">
                    {this.renderProgramContent()}
                </ASUIDiv> : null}
            </ASUIDiv>
        );

        // return content;
    }

}
