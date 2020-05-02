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

class ASCProgramRenderer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: true
        }
    }

    getComposer() { return this.props.composer; }
    getSong() { return this.getComposer().getSong(); }

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

    renderProgramContent() {
        try {
            return this.getSong().programLoadRenderer(this.props.programID);

        } catch (e) {
            return e.message;
        }
    }

    /** Actions **/


    toggleContainer() {
        this.setState({open: !this.state.open});
    }

    loadPreset(presetClassName, presetConfig) {
        console.log("Loading preset: ", presetClassName, presetConfig);
        const song = this.getSong();
        const programID = this.props.programID;
        song.programReplace(programID, presetClassName, presetConfig);
    }

    /** Menu **/




    renderMenuRoot() {
        return (<>
            <ASUIMenuDropDown options={() => this.renderMenuChangePreset()}>Change Preset</ASUIMenuDropDown>
            <ASUIMenuBreak />
            <ASUIMenuDropDown options={() => this.renderMenuChangeProgram()}>Change Program</ASUIMenuDropDown>
            <ASUIMenuAction onAction={e => this.programRename()}>Rename Program</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.programRemove()}>Remove Program</ASUIMenuAction>
        </>);
    }

    renderMenuChangeProgram() {
        const library = Library.loadDefault();
        return library.renderMenuProgramAll(([className, presetConfig]) => {
            this.loadPreset(className, presetConfig);
        });

    }

    renderMenuChangePreset() {
        const library = Library.loadDefault();
        const programID = this.props.programID;
        const programClassName = this.getSong().programGetClassName(programID);
        return library.renderMenuProgramAllPresets((className, presetConfig) => {
            this.loadPreset(className, presetConfig);
        }, programClassName);
    }


    programReplace(e, programClassName, programConfig={}) {
        const programID = this.props.programID;
        // programConfig = ProgramLoader.createProgramConfig(programClassName, programConfig);
        this.getSong().programReplace(programID, programClassName, programConfig);
    }
    programRename() {
        const programID = this.props.programID;
        this.getComposer().programRename(programID);
    }
    programRemove() {
        const programID = this.props.programID;
        this.getSong().programRemove(programID);
    }
}

export default ASCProgramRenderer;
