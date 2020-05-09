import React from "react";
import {
    ASUIIcon,
    ASUIButtonDropDown,
    ASUIButton,
} from "../../components";

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
            <div className="asc-instrument-renderer-empty">
                <div className="header">
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
                </div>
                {this.state.open ? <div className="content">
                    {this.renderProgramContent()}
                </div> : null}
            </div>
        );

        // return content;
    }

}
