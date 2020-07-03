import React from "react";
import {
    ASUIIcon,
    ASUIButtonDropDown,
    ASUIButton,
} from "../../components";
import ASCProgramRendererBase from "./ASCProgramRendererBase";

import "./assets/ASCProgramRenderer.css";

export default class ASCProgramRenderer extends ASCProgramRendererBase {
    render() {
        const song = this.getSong();
        const programID = this.props.programID;
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
            <div className={className}>
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
                {this.props.open && renderProgram ? <div className="content">
                    {this.renderProgramContent()}
                </div> : null}
            </div>
        );

        // return content;
    }

}
