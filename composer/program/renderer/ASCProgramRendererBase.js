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

    getProgramID() { return this.props.programID; }
    getComposer() { return this.props.composer; }
    getSong() { return this.getComposer().getSong(); }
    // getProgramEntry(proxiedData=true) {
    //     let songData = proxiedData
    //         ? this.getSong().data
    //         :this.getSong().getProxiedData();
    //     return songData.programs[this.props.programID];
    // }


    renderProgramContent() {
        try {
            return this.getSong().programLoadRenderer(this.props.programID);

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
        console.log('handleMIDIInput', e);


        // console.log("MIDI", e.data, e, selectedComponent);
        // switch (e.data[0]) {
        //     case 144:   // Note On
        //         break;
        //     // TODO: refactor
        //     // e.preventDefault();
        //     // throw new Error("TODO: Implement");
        //     // const midiImport = new MIDIImport();
        //     // let newMIDICommand = midiImport.getCommandFromMIDINote(e.data[1]);
        //     // let newMIDIVelocity = Math.round((e.data[2] / 128) * 100);
        //     // console.log("MIDI ", newMIDICommand, newMIDIVelocity);
        //
        //     // this.instructionInsertOrUpdate(e, newMIDICommand);
        //     // this.playSelectedInstructions(e);
        //     // this.focus();
        //     case 128:   // Note Off
        //         // TODO: turn off playing note, optionally set duration of note
        //         break;
        //
        //     default:
        //         break;
        // }
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


    /** @deprecated **/
    wrapPreset(presetClassName, presetConfig={}) {
        const {classRenderer: Renderer} = ProgramLoader.getProgramClassInfo(presetClassName);
        const [oldClassName, oldConfig] = this.getSong().getProxiedData().programs[this.props.programID] || ['Empty', {}];
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
