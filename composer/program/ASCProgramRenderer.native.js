import React from "react";
import {Text, View} from 'react-native';

import {
    ASUIIcon,
    ASUIButtonDropDown,
    ASUIButton,
} from "../../components";
import ASCProgramRendererBase from "./ASCProgramRendererBase";

import styles from "./ASCProgramRenderer.style"

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
            <View className="asc-instrument-renderer-empty">
                <View className="header">
                    <ASUIButton
                        className="toggle-container"
                        onAction={e => this.toggleContainer()}
                        children={`${programIDHTML}: ${titleHTML}`}
                        />
                    <ASUIButtonDropDown
                        arrow={false}
                        className="program-config"
                        options={() => this.renderMenuRoot()}
                    >
                        <ASUIIcon source="config"/>
                    </ASUIButtonDropDown>
                </View>
                {this.state.open ? <View className="content">
                    {this.renderProgramContent()}
                </View> : null}
            </View>
        );

        // return content;
    }
}

