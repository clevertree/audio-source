import React from "react";
import {
    ASUIMenuAction,
    ASUIMenuDropDown, ASUIMenuBreak,
} from "../../components";
import {Library} from "../../song";


export default class ASCProgramRendererBase extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: true
        }
    }

    getComposer() { return this.props.composer; }
    getSong() { return this.getComposer().getSong(); }


    renderProgramContent() {
        if(this.props.empty) {
            return null;
        } else {
            try {
                return this.getSong().programLoadRenderer(this.props.programID);

            } catch (e) {
                return e.message;
            }
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
