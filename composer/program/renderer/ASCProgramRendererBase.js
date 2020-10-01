import React from "react";

import {
    ASUIClickable,
    ASUIForm, ASUIFormEntry,
    ASUIInputTextArea,
    ASUIMenuAction,
    ASUIMenuBreak,
    ASUIMenuDropDown,
    ASUIMenuItem,
} from "../../../components";
import {PresetLibrary, ProgramLoader} from "../../../song";
import ASCPresetBrowser from "../browser/ASCPresetBrowser";
import ASCKeyboard from "../../../common/keyboard/ASCKeyboard";


export default class ASCProgramRendererBase extends React.Component {
    constructor(props) {
        super(props);
        this.cb = {
            togglePresetBrowser: () => this.togglePresetBrowser(),
            toggleSourceEdit: () => this.toggleSourceEdit(),
            onSourceEdit: e => this.onSourceEdit(e),
            toggleContainer: e => this.toggleContainer(),
            onFocus: e => this.onFocus(e),
            onKeyPress: e => this.onKeyPress(e),
            menuRoot: () => this.renderMenuRoot(),
            parentMenu: programID => this.renderMenuManageProgram(programID),
            programLoad: (programID, programClass, programConfig) => this.programLoad(programID, programClass, programConfig),
            setProps: (programID, props) => this.setProps(programID, props),
        }
        this.ref = {
            textSource: React.createRef()
        }
        this.state = {
            playingFrequencies: []
        }

        this.playingKeys = {};
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
    getProgramData(proxiedData=true) {
        const loader = new ProgramLoader(this.getSong());
        return loader.getData(this.getProgramID(), proxiedData)
    }
    // getProgramEntry(proxiedData=true) {
    //     let songData = proxiedData
    //         ? this.getSong().data
    //         :this.getSong().getProxiedData();
    //     return songData.programs[this.props.programID];
    // }


    renderProgramContent() {
        try {
            let songData = this.getSong().getProxiedData();

            const programID = this.props.programID;
            const program = songData.programs[programID];
            const [className, config] = program;
            const {classRenderer: Renderer} = ProgramLoader.getProgramClassInfo(className);
            const programProps = this.getRendererState().programProps || {};
            // console.log('this.getRendererState()', this.getRendererState(), className);
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
        const program = this.getProgramData(this.props.programID, true) || ['Empty', {}];
        return <ASCPresetBrowser
            programLoad={this.cb.programLoad}
            programID={this.props.programID}
            program={program}
        />;
    }

    renderSourceEdit() {
        const [className, config] = this.getProgramData(this.props.programID, true) || ['Empty', {}];
        const jsonString = JSON.stringify(config, null, "\t");
        return <ASUIForm
            onSubmit={this.cb.onSourceEdit}
        >
            <ASUIFormEntry header={`Class: ${className}`}>
                <ASUIInputTextArea
                    defaultValue={jsonString}
                    ref={this.ref.textSource}
                    placeholder={`{\n  "type":"square"\n}`}
                    rows={16}
                    cols={28}

                    />
            </ASUIFormEntry>
            <ASUIFormEntry header={`Update`}>
                <ASUIClickable onAction={this.cb.onSourceEdit}>
                    Update
                </ASUIClickable>
            </ASUIFormEntry>
        </ASUIForm>;
    }

    onSourceEdit(e) {
        const textSource = this.ref.textSource.current;
        let jsonString = textSource.getValue();
        try {
            let json = JSON.parse(jsonString);
            const program = this.getSong().getProxiedData().programs[this.props.programID];
            program[1] = json;
            console.log("Updated Program Source: ", json);
            this.toggleContainer(true);
        } catch (e) {
            this.getComposer().setError("Invalid Source: " + e.message);
        }
    }

    /** Actions **/

    updatePlayingFrequency(state, frequency) {
        const playingFrequencies = this.state.playingFrequencies;

        let i;
        switch(state) {
            case 'play':
                i = playingFrequencies.indexOf(frequency);
                if(i === -1) {
                    playingFrequencies.push(frequency);
                    this.setState({
                        playingFrequencies,
                        playing: true
                    })
                }
                break;
            case 'stop':
                i = playingFrequencies.indexOf(frequency);
                if(i !== -1) {
                    playingFrequencies.splice(i, 1);
                    this.setState({
                        playingFrequencies,
                        playing: playingFrequencies.length > 0
                    })
                } else {
                    console.warn("Playing frequency not found: ", frequency);
                }
                break;
        }
        // console.log(state, frequency, playingFrequencies);

    }


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
        this.getComposer().programRemovePrompt(programID);
    }

    async programLoad(presetClassName, presetConfig={}) {
        const song = this.getSong();
        let [, oldProgramConfig] = song.data.programs[this.props.programID] || [null, null];
        console.log("Loading preset: ", presetClassName, presetConfig, oldProgramConfig);
        if(oldProgramConfig && oldProgramConfig.title && !presetConfig.title)
            presetConfig.title = oldProgramConfig.title;
        const instance = ProgramLoader.loadInstance(presetClassName, presetConfig);
        if(typeof instance.waitForAssetLoad)
            await instance.waitForAssetLoad();
        const programID = this.props.programID;
        song.programReplace(programID, presetClassName, presetConfig);
        this.toggleContainer(true);


    }

    // getProgramState() {
    //     return this.getComposer().programGetState(this.props.programID) || {};
    // }
    //
    // setProgramState(state) {
    //     this.getComposer().programSetState(this.props.programID, state);
    // }

    setProps(programID, props) {
        const rendererState = this.getRendererState();
        if(!rendererState.programProps)     rendererState.programProps = props;
        else                                Object.assign(rendererState.programProps, props);
        this.setRendererState(rendererState);
    }

    getRendererState() {
        return this.props.composer.programGetRendererState(this.props.programID);
    }
    setRendererState(state) {
        return this.props.composer.programSetRendererState(this.props.programID, state);
    }

    toggleContainer(openState=null) {
        const rendererState = this.getRendererState();
        if(openState === null) {
            if(typeof rendererState.open === "string")
                openState = true;
            else
                openState = !rendererState.open;
        }
        rendererState.open = openState;
        // if(!rendererState.programProps)
        //     rendererState.programProps = {open: true};
        this.setRendererState(rendererState);
    }



    togglePresetBrowser() {
        const rendererState = this.getRendererState();
        rendererState.open = rendererState.open === 'browser' ? true : 'browser';
        this.setRendererState(rendererState);
    }

    toggleSourceEdit() {
        const rendererState = this.getRendererState();
        rendererState.open = rendererState.open === 'source' ? true : 'source';
        this.setRendererState(rendererState);
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
            <ASUIMenuDropDown options={() => this.renderMenuChangePreset()}>Change Preset</ASUIMenuDropDown>
            <ASUIMenuBreak />
            <ASUIMenuAction onAction={this.cb.toggleSourceEdit}>{this.props.open === 'source' ? 'Hide' : 'Edit'} Source</ASUIMenuAction>
            <ASUIMenuBreak />
            {this.renderMenuManageProgram()}
        </>);
    }

    renderMenuChangeProgram() {
        return (<>
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



    renderMenuChangePreset() {
        const onSelectPreset = (presetClass, presetConfig) => this.programLoad(presetClass, presetConfig);
        const libraries = PresetLibrary.renderMenuLibraryOptions(async (library) => {
            await library.waitForAssetLoad();
            return library.renderMenuPresets(onSelectPreset);
        });
        const recentPresets = PresetLibrary.renderMenuRecentPresets(onSelectPreset);
        return (
            <>
                <ASUIMenuBreak />
                {libraries}
                {recentPresets ? <>
                    <ASUIMenuBreak />
                    <ASUIMenuItem>Recent Presets</ASUIMenuItem>
                    {recentPresets}
                </> : null}
            </>
        );
    }


    /** Input **/

    handleMIDIInput(e) {
        // console.log('handleMIDIInput', e);
        const destination = this.getComposer().getDestination();
        this.getSong().playMIDIEvent(destination, this.getProgramID(), e.data);

    }

    onFocus(e) {
        this.getComposer().setSelectedComponent('program', this.getProgramID());
    }

    onKeyPress(e) {
        const rendererState = this.getRendererState();
        switch(rendererState.open) {
            case 'source':
            case false:
                return;
            default:
        }
        const {keyboardOctave} = this.getComposer().getTrackPanelState();
        const keyboardCommand = ASCKeyboard.instance.getKeyboardCommand(e.key, keyboardOctave);
        if(keyboardCommand) {
            switch(e.type) {
                case 'keydown':
                    if(!this.playingKeys[e.key]) {
                        const destination = this.getComposer().getDestination();
                        this.playingKeys[e.key] = this.getSong().playInstrumentFrequency(destination, this.getProgramID(), keyboardCommand);
                    } else {
                        // console.warn("Key already playing: ", e.key, this.playingKeys);
                    }
                    break;

                case 'keyup':
                    if(typeof this.playingKeys.hasOwnProperty(e.key)) {
                        const source = this.playingKeys[e.key];
                        delete this.playingKeys[e.key];
                        source && source.noteOff();
                        // console.log('source', source);
                    } else {
                        console.warn("Playing key not found: ", e.key, this.playingKeys);
                    }
                    break;
                default:
                    break;
            }
        } else {
            console.warn("No keyboard command found for: ", e.key);
        }
    }

}
