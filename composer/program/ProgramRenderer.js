import React from "react";
import {
    Div,
    Icon,
    // Button,
    ButtonDropDown,
    MenuAction,
    MenuDropDown, Button, MenuBreak,
} from "../../components";
import {Library} from "../../song";

import "./assets/ProgramRenderer.css";

class ProgramRenderer extends React.Component {
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
            <Div className="asc-instrument-renderer-empty">
                <Div className="header">
                    <Button
                        className="toggle-container"
                        onAction={e => this.toggleContainer()}
                    >{programIDHTML}: {titleHTML}</Button>
                    <ButtonDropDown
                        arrow={false}
                        className="program-config"
                        options={() => this.renderMenuRoot()}
                    >
                        <Icon className="config"/>
                    </ButtonDropDown>
                </Div>
                {this.state.open ? <Div className="content">
                    {this.renderProgramContent()}
                </Div> : null}
            </Div>
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
            <MenuDropDown options={() => this.renderMenuChangePreset()}>Change Preset</MenuDropDown>
            <MenuBreak />
            <MenuDropDown options={() => this.renderMenuChangeProgram()}>Change Program</MenuDropDown>
            <MenuAction onAction={e => this.programRename()}>Rename Program</MenuAction>
            <MenuAction onAction={e => this.programRemove()}>Remove Program</MenuAction>
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

export default ProgramRenderer;
