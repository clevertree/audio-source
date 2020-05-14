import React from "react";
import {
    ASUIMenuAction,
    ASUIMenuDropDown, ASUIMenuBreak, ASUIMenuItem,
} from "../../components";
import {Library} from "../../song";
import ProgramLoader from "../../common/program/ProgramLoader";


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

    loadPreset(presetClassName, presetConfig={}) {
        console.log("Loading preset: ", presetClassName, presetConfig);
        const song = this.getSong();
        const programID = this.props.programID;
        song.programReplace(programID, presetClassName, presetConfig);
    }

    wrapPreset(presetClassName, presetConfig={}) {

    }

    /** Menu **/


    renderMenuRoot() {
        return (<>
            <ASUIMenuDropDown options={() => this.renderMenuChangeProgram()}>Change Program</ASUIMenuDropDown>
            <ASUIMenuBreak />
            <ASUIMenuDropDown options={() => this.renderMenuWrapProgram()}>Wrap Program</ASUIMenuDropDown>
            <ASUIMenuBreak />
            <ASUIMenuAction onAction={e => this.programRename()}>Rename Program</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.programRemove()}>Remove Program</ASUIMenuAction>
        </>);
    }

    renderMenuChangeProgram(menuTitle = "Change Program") {
        return (<>
            <ASUIMenuDropDown options={() => this.renderMenuChangePreset()}>Using Preset</ASUIMenuDropDown>
            <ASUIMenuBreak />
            {ProgramLoader.getRegisteredPrograms().map((config, i) =>
                <ASUIMenuAction key={i} onAction={e => this.loadPreset(config.className)}       >{config.title}</ASUIMenuAction>
            )}
        </>);
    }


    renderMenuWrapProgram(menuTitle = "Change Program") {
        return (<>
            <ASUIMenuDropDown options={() => this.renderMenuChangePreset()}>Using Preset</ASUIMenuDropDown>
            <ASUIMenuBreak />
            {ProgramLoader.getRegisteredPrograms().filter((config, i) => {
                return config.classRenderer && config.classRenderer.prototype.addChildProgram;
            }).map((config, i) =>
                <ASUIMenuAction key={i} onAction={e => this.loadPreset(config.className)}       >{config.title}</ASUIMenuAction>
            )}
        </>);
    }

    renderMenuChangePreset() {
        const library = Library.loadDefault();
        const programID = this.props.programID;
        let programClassName = null;
        if(this.getSong().hasProgram(programID))
            programClassName = this.getSong().programGetClassName(programID);
        return library.renderMenuProgramAllPresets((className, presetConfig) => {
            this.loadPreset(className, presetConfig);
        }, programClassName);
    }


    // programReplace(e, programClassName, programConfig={}) {
    //     const programID = this.props.programID;
    //     // programConfig = ProgramLoader.createProgramConfig(programClassName, programConfig);
    //     this.getSong().programReplace(programID, programClassName, programConfig);
    // }
    // programRename() {
    //     const programID = this.props.programID;
    //     this.getComposer().programRename(programID);
    // }
    // programRemove() {
    //     const programID = this.props.programID;
    //     this.getSong().programRemove(programID);
    // }
}
