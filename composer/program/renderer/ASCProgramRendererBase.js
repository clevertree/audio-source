import React from "react";
import {
    ASUIMenuAction,
    ASUIMenuDropDown, ASUIMenuBreak, ASUIMenuItem,
} from "../../../components";
import {Library} from "../../../song";
import {ProgramLoader} from "../../../common";
import {ASCPresetBrowser} from "../index";


export default class ASCProgramRendererBase extends React.Component {
    // constructor(props) {
    //     super(props);
    //     // this.state = {
    //     //     open: false
    //     // }
    // }

    getComposer() { return this.props.composer; }
    getSong() { return this.getComposer().getSong(); }
    getProgramEntry(proxiedData=true) {
        let songData = this.getSong().data;
        if(!proxiedData)
            songData = this.getSong().getProxiedData();
        return songData.programs[this.props.programID] || ['Empty', {}];
    }


    renderProgramContent() {
        try {
            return this.getSong().programLoadRenderer(this.props.programID);

        } catch (e) {
            return e.message;
        }
    }


    renderPresetBrowser() {
        return <ASCPresetBrowser
            composer={this.getComposer()}
            />;
    }

    /** Actions **/


    // programReplace(e, programClassName, programConfig={}) {
    //     const programID = this.props.programID;
    //     // programConfig = ProgramLoader.createProgramConfig(programClassName, programConfig);
    //     this.getSong().programReplace(programID, programClassName, programConfig);
    // }
    programRename() {
        const programID = this.props.programID;
        this.getComposer().programRename(programID);
    }
    programRemove() {
        const programID = this.props.programID;
        this.getSong().programRemove(programID);
    }

    getProgramState() {
        return this.getComposer().programGetState(this.props.programID) || {};
    }

    setProgramState(state) {
        this.getComposer().programSetState(this.props.programID, state);
    }

    toggleContainer() {
        const programState = this.getProgramState();
        programState.open = !programState.open
        this.setProgramState(programState);
    }

    togglePresetBrowser() {
        const programState = this.getProgramState();
        programState.showBrowser = !programState.showBrowser;
        this.setProgramState(programState);
    }

    loadPreset(presetClassName, presetConfig={}) {
        console.log("Loading preset: ", presetClassName, presetConfig);
        const song = this.getSong();
        const programID = this.props.programID;
        song.programReplace(programID, presetClassName, presetConfig);
    }

    wrapPreset(presetClassName, presetConfig={}) {
        const {classRenderer: Renderer} = ProgramLoader.getProgramClassInfo(presetClassName);
        const [oldClassName, oldConfig] = this.getProgramEntry();
        Renderer.addChildProgramToConfig(presetConfig, oldClassName, oldConfig);
        this.loadPreset(presetClassName, presetConfig);
        // TODO: if classes match, prompt confirm
    }

    /** Menu **/


    renderMenuRoot() {
        const programState = this.getProgramState();
        return (<>
            <ASUIMenuAction onAction={() => this.togglePresetBrowser()}>{programState.showBrowser ? 'Hide' : 'Show'} Preset Browser</ASUIMenuAction>
            <ASUIMenuBreak />
            <ASUIMenuDropDown options={() => this.renderMenuChangeProgram()}>Change Program</ASUIMenuDropDown>
            <ASUIMenuBreak />
            {/*<ASUIMenuDropDown options={() => this.renderMenuWrapProgram()}>Wrap Program</ASUIMenuDropDown>*/}
            {/*<ASUIMenuBreak />*/}
            <ASUIMenuAction onAction={e => this.programRename()}>Rename Program</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.programRemove()}>Remove Program</ASUIMenuAction>
        </>);
    }

    renderMenuChangeProgram(menuTitle = "Change Program") {
        return (<>
            <ASUIMenuItem>{menuTitle}</ASUIMenuItem>
            <ASUIMenuBreak/>
            <ASUIMenuDropDown options={() => this.renderMenuChangePreset()}>Using Preset</ASUIMenuDropDown>
            <ASUIMenuBreak />
            {ProgramLoader.getRegisteredPrograms().map((config, i) =>
                <ASUIMenuAction key={i} onAction={e => this.loadPreset(config.className)}       >{config.title}</ASUIMenuAction>
            )}
        </>);
    }


    renderMenuWrapProgram(menuTitle = "Wrap Program") {
        return (<>
            <ASUIMenuItem>{menuTitle}</ASUIMenuItem>
            <ASUIMenuBreak/>
            <ASUIMenuDropDown options={() => this.renderMenuChangePreset()}>Using Preset</ASUIMenuDropDown>
            <ASUIMenuBreak />
            {ProgramLoader.getRegisteredPrograms().filter((config, i) => {
                return config.classRenderer && config.classRenderer.addChildProgramToConfig;
            }).map((config, i) =>
                <ASUIMenuAction key={i} onAction={e => this.wrapPreset(config.className)}       >{config.title}</ASUIMenuAction>
            )}
        </>);
    }

    async renderMenuChangePreset() {
        const library = Library.loadDefault();
        const programID = this.props.programID;
        let programClassName = null;
        if(this.getSong().hasProgram(programID))
            programClassName = this.getSong().programGetClassName(programID);
        return await library.renderMenuProgramAllPresets((className, presetConfig) => {
            this.loadPreset(className, presetConfig);
        }, programClassName);
    }

}
