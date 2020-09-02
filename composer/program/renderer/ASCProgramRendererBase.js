import React from "react";

import {
    ASUIMenuAction,
    ASUIMenuDropDown, ASUIMenuBreak, ASUIMenuItem,
} from "../../../components";
import {LibraryProcessor} from "../../../song";
import {ProgramLoader} from "../../../common";
import ASCPresetBrowser from "../browser/ASCPresetBrowser";


export default class ASCProgramRendererBase extends React.Component {
    constructor(props) {
        super(props);
        this.cb = {
            togglePresetBrowser: () => this.togglePresetBrowser(),
            toggleContainer: e => this.toggleContainer(),
            onFocus: e => this.onFocus(e),
            menuRoot: () => this.renderMenuRoot(),
            parentMenu: programID => this.renderMenuManageProgram(programID),
            programLoad: (programID, programClass, programConfig) => this.programLoad(programID, programClass, programConfig),
            setProps: (programID, props) => this.setProps(programID, props)
        }
        // this.state = {
        //     open: false
        // }
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
    getProgramData() {
        let songData = this.getSong().getProxiedData();
        return songData.programs[this.getProgramID()];

    }
    // getProgramEntry(proxiedData=true) {
    //     let songData = proxiedData
    //         ? this.getSong().data
    //         :this.getSong().getProxiedData();
    //     return songData.programs[this.props.programID];
    // }


    renderProgramContent() {
        try {
            let songData = this.getSong().data; // getProxiedData();

            const programID = this.props.programID;
            const program = songData.programs[programID];
            const [className, config] = program;
            const {classRenderer: Renderer} = ProgramLoader.getProgramClassInfo(className);
            const programProps = this.getProgramRendererState().programProps || {};
            // console.log('this.getProgramRendererState()', this.getProgramRendererState(), className);
            return (
                <Renderer
                    programID={programID}
                    program={program}
                    config={config}
                    setProps={this.cb.setProps}
                    programLoad={this.cb.programLoad}
                    parentMenu={this.cb.parentMenu}
                    {...programProps}
                />
            );

        } catch (e) {
            return e.message;
        }
    }


    renderPresetBrowser() {
        const program = this.getSong().getProxiedData().programs[this.props.programID] || ['Empty', {}];
        return <ASCPresetBrowser
            programLoad={this.cb.programLoad}
            programID={this.props.programID}
            program={program}
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
        this.getComposer().programRenamePrompt(programID);
    }
    programRemove() {
        const programID = this.props.programID;
        this.getSong().programRemove(programID);
    }

    async programLoad(presetClassName, presetConfig={}) {
        console.log("Loading preset: ", presetClassName, presetConfig);
        const instance = ProgramLoader.loadInstance(presetClassName, presetConfig);
        if(typeof instance.waitForAssetLoad)
            await instance.waitForAssetLoad();
        const song = this.getSong();
        const programID = this.props.programID;
        song.programReplace(programID, presetClassName, presetConfig);
    }

    // getProgramState() {
    //     return this.getComposer().programGetState(this.props.programID) || {};
    // }
    //
    // setProgramState(state) {
    //     this.getComposer().programSetState(this.props.programID, state);
    // }

    setProps(programID, props) {
        const rendererState = this.getProgramRendererState();
        if(!rendererState.programProps)     rendererState.programProps = props;
        else                                Object.assign(rendererState.programProps, props);
        this.setProgramRendererState(rendererState);
    }

    getProgramRendererState() {
        return this.props.composer.state.programStates[this.props.programID] || {};
    }
    setProgramRendererState(state) {
        const programStates = this.props.composer.state.programStates;
        const programID = this.props.programID;
        if(!programStates[programID])   programStates[programID] = state;
        else                            Object.assign(programStates[programID], state);
        this.props.composer.setState({
            programStates
        });
    }

    toggleContainer() {
        const rendererState = this.getProgramRendererState();
        rendererState.open = !rendererState.open;
        this.setProgramRendererState(rendererState);
    }



    togglePresetBrowser() {
        const rendererState = this.getProgramRendererState();
        rendererState.open = rendererState.open === 'browser' ? true : 'browser';
        this.setProgramRendererState(rendererState);
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
        // const composer = this.getComposer();
        // const programState = this.getGlobalProgramState();
        return (<>
            <ASUIMenuAction onAction={this.cb.togglePresetBrowser}>{this.props.open === 'browser' ? 'Hide' : 'Show'} Preset Browser</ASUIMenuAction>
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
                <ASUIMenuAction key={i} onAction={e => this.programLoad(config.className)}       >{config.title}</ASUIMenuAction>
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
            this.programLoad(className, presetConfig);
        }, programClassName);
    }


    /** Input **/

    handleMIDIInput(e) {
        // console.log('handleMIDIInput', e);
        const destination = this.getComposer().getDestination();
        this.getSong().playMIDIEvent(destination, this.getProgramID(), e.data);

    }

}
