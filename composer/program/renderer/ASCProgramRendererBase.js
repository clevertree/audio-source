import React from "react";
import {
    ASUIMenuAction,
    ASUIMenuDropDown, ASUIMenuBreak, ASUIMenuItem,
} from "../../../components";
import {LibraryProcessor} from "../../../song";
import {ProgramLoader} from "../../../common";
import {ASCPresetBrowser} from "../index";


export default class ASCProgramRendererBase extends React.Component {
    constructor(props) {
        super(props);
        this.cb = {
            togglePresetBrowser: () => this.togglePresetBrowser(),
            toggleContainer: e => this.toggleContainer(),
            onFocus: e => this.onFocus(e),
            menuRoot: () => this.renderMenuRoot(),
            parentMenu: programID => this.renderMenuManageProgram(programID)
        }
    }

    // constructor(props) {
    //     super(props);
    //     // this.state = {
    //     //     open: false
    //     // }
    // }

    getProgramID() { return this.props.programID; }
    getComposer() { return this.props.composer; }
    getSong() { return this.getComposer().getSong(); }
    // getProgramEntry(proxiedData=true) {
    //     let songData = proxiedData
    //         ? this.getSong().data
    //         :this.getSong().getProxiedData();
    //     return songData.programs[this.props.programID];
    // }


    renderProgramContent(props={}) {
        try {
            return this.getSong().programLoadRenderer(this.props.programID, props);

        } catch (e) {
            return e.message;
        }
    }


    renderPresetBrowser() {
        const program = this.getSong().getProxiedData().programs[this.props.programID] || ['Empty', {}];
        return <ASCPresetBrowser
            composer={this.getComposer()}
            programID={this.props.programID}
            program={program}
        />;
    }

    /** Input **/

    handleMIDIInput(e) {
        // console.log('handleMIDIInput', e);
        const destination = this.getComposer().getDestination();
        this.getSong().playMIDIEvent(destination, this.getProgramID(), e.data);

    }

    /** Actions **/


    // programReplace(e, programClassName, programConfig={}) {
    //     const programID = this.props.programID;
    //     // programConfig = ProgramLoader.createProgramConfig(programClassName, programConfig);
    //     this.getSong().programReplace(programID, programClassName, programConfig);
    // }
    programRename() {
        const programID = this.props.programID;
        this.getComposer().programRenamePrompt(programID);
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
        if(programState.showBrowser)
            programState.open = true;
        this.setProgramState(programState);
    }

    async loadPreset(presetClassName, presetConfig={}) {
        console.log("Loading preset: ", presetClassName, presetConfig);
        const instance = ProgramLoader.loadInstance(presetClassName, presetConfig);
        if(typeof instance.waitForAssetLoad)
            await instance.waitForAssetLoad();
        const song = this.getSong();
        const programID = this.props.programID;
        song.programReplace(programID, presetClassName, presetConfig);
    }


    // wrapPreset(presetClassName, presetConfig={}) {
    //     const {classRenderer: Renderer} = ProgramLoader.getProgramClassInfo(presetClassName);
    //     const [oldClassName, oldConfig] = this.getSong().getProxiedData().programs[this.props.programID] || ['Empty', {}];
    //     Renderer.addChildProgramToConfig(presetConfig, oldClassName, oldConfig);
    //     this.loadPreset(presetClassName, presetConfig);
    //     // TODO: if classes match, prompt confirm
    // }

    /** Menu **/


    renderMenuManageProgram() {
        const composer = this.getComposer();
        return (<>
            <ASUIMenuAction onAction={e => composer.programRenamePrompt(this.props.programID)}>Rename Program</ASUIMenuAction>
            <ASUIMenuAction onAction={e => composer.programRemovePrompt(this.props.programID)}>Remove Program</ASUIMenuAction>
        </>);
    }


    renderMenuRoot() {
        const composer = this.getComposer();
        const programState = this.getProgramState();
        return (<>
            <ASUIMenuAction onAction={this.cb.togglePresetBrowser}>{programState.showBrowser ? 'Hide' : 'Show'} Preset Browser</ASUIMenuAction>
            <ASUIMenuBreak />
            <ASUIMenuDropDown options={() => this.renderMenuChangeProgram()}>Change Program</ASUIMenuDropDown>
            <ASUIMenuBreak />
            {this.renderMenuManageProgram()}
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


    // renderMenuWrapProgram(menuTitle = "Wrap Program") {
    //     return (<>
    //         <ASUIMenuItem>{menuTitle}</ASUIMenuItem>
    //         <ASUIMenuBreak/>
    //         <ASUIMenuDropDown options={() => this.renderMenuChangePreset()}>Using Preset</ASUIMenuDropDown>
    //         <ASUIMenuBreak />
    //         {ProgramLoader.getRegisteredPrograms().filter((config, i) => {
    //             return config.classRenderer && config.classRenderer.addChildProgramToConfig;
    //         }).map((config, i) =>
    //             <ASUIMenuAction key={i} onAction={e => this.wrapPreset(config.className)}       >{config.title}</ASUIMenuAction>
    //         )}
    //     </>);
    // }

    async renderMenuChangePreset() {
        const library = LibraryProcessor.loadDefault();
        const programID = this.props.programID;
        let programClassName = null;
        if(this.getSong().hasProgram(programID))
            programClassName = this.getSong().programGetClassName(programID);
        return await library.renderMenuPresets((className, presetConfig) => {
            this.loadPreset(className, presetConfig);
        }, programClassName);
    }

}
