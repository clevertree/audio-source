import React from 'react';
import {
    // Button,
    // InputSelect,
    Div,
    Button,
    MenuAction,
    MenuBreak,
    Icon, InputRange, MenuDropDown, ButtonDropDown,
} from "../../../components";
import {Values} from "../../../song";

import "./assets/OscillatorNodeInstrumentRenderer.css";

class OscillatorNodeInstrumentRenderer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: true
        }
    }


    getTitle() {
        return this.props.config.title
            || this.props.config.type
            || "Unknown Osc";
    }

    render() {
        let className = "oscillatornode-instrument-renderer";
        if(this.state.open)
            className += ' open';
        const config = this.props.config;
        let title = this.getTitle();
        const open = this.props.open;
        return <Div className={className}>
            <Div
                className="title"
                title={`Oscillator: ${title}`}
                onClick={(e) => this.toggleOpen()}
                vertical>
                {title}
            </Div>
            {typeof !open || config.mixer === 'undefined' ? null : (
                <MenuDropDown title="Edit Mixer"
                              className="mixer"
                              options={() => this.renderMenuChangeMixer()}
                              vertical>
                    {config.mixer+'%'}
                </MenuDropDown>
            )}
            {typeof !open || config.detune === 'undefined' ? null : (
                <MenuDropDown title={`Detune by ${config.detune} cents`}
                              className="detune"
                              options={() => this.renderMenuChangeDetune()}
                              vertical>
                    {config.detune+'c'}
                </MenuDropDown>
            )}
            {typeof !open || config.root === 'undefined' ? null : (
                <MenuDropDown title={`Key Root is ${config.root}`}
                              className="root"
                              options={() => this.renderMenuChangeKeyRoot()}
                              vertical>
                    {config.root}
                </MenuDropDown>
            )}
            {typeof !open || config.alias === 'undefined' ? null : (
                <MenuDropDown title={`Key Alias is ${config.alias}`}
                              className="alias"
                              options={() => this.renderMenuChangeKeyAlias()}
                              vertical>
                    {config.alias}
                </MenuDropDown>
            )}
            {typeof !open || config.range === 'undefined' ? null : (
                <MenuDropDown title={`Key Range is ${config.range}`}
                              className="range"
                              options={() => this.renderMenuChangeKeyRange()}
                              vertical>
                    {config.range}
                </MenuDropDown>
            )}
            {typeof config.loop === 'undefined' ? null : (
                <Div title="Toggle Loop" className="loop">
                    <Button title="" onAction={e => this.changeLoop(!config.loop)} arrow={false} vertical>
                        {config.loop?'∞':'⇥'}
                    </Button>
                </Div>
            )}

            <MenuDropDown
                arrow={false}
                className="config"
                options={() => this.renderMenuRoot()}
            >
                <Icon className="config"/>
            </MenuDropDown>
        </Div>;
    }


    /** Actions **/

    toggleOpen() {
        this.setState({open: !this.state.open});
    }

    changeMixer(newMixerValue) {
        if(!Number.isInteger(newMixerValue))
            throw new Error("Invalid mixer value type: " + typeof newMixerValue);
        this.props.config.mixer = newMixerValue;
    }

    changeDetune(newDetuneValue) {
        if(!Number.isInteger(newDetuneValue))
            throw new Error("Invalid detune value type: " + typeof newDetuneValue);
        this.props.config.detune = newDetuneValue;
    }

    changeRoot(newRootValue) {
        this.props.config.root = newRootValue;
    }

    changeAlias(newAliasValue) {
        this.props.config.alias = newAliasValue;
    }

    changeLoop(newLoopValue=null) {
        if(newLoopValue === null)
            newLoopValue = !this.props.config.loop;
        this.props.config.loop = newLoopValue?1:0;
    }

    /** Menus **/

    renderMenuRoot() {
        return (<>
            <MenuAction onAction={()=>{}} disabled>Oscillator: {this.getTitle()}</MenuAction>
            <MenuBreak />
            <MenuDropDown options={() => this.renderMenuChangeMixer()}>Edit Mixer</MenuDropDown>
            <MenuDropDown options={() => this.renderMenuChangeDetune()}>Edit Detune</MenuDropDown>
            <MenuDropDown options={() => this.renderMenuChangeKeyRoot()}>Edit Key Root</MenuDropDown>
            <MenuDropDown options={() => this.renderMenuChangeKeyAlias()}>Edit Key Alias</MenuDropDown>
            <MenuDropDown options={() => this.renderMenuChangeKeyRange()}>Edit Key Range</MenuDropDown>
            <MenuDropDown options={() => this.renderMenuChangeLoop()}>Toggle Loop</MenuDropDown>
            <MenuBreak />
            <MenuDropDown options={() => this.renderMenuChangeSample()}>Change Sample</MenuDropDown>
            <MenuAction disabled={!this.props.onRemove} onAction={(e) => this.props.onRemove(e)}>Remove Sample</MenuAction>
        </>);
    }

    // TODO: use generic menu/value library
    renderMenuChangeSample() {
        const config = this.props.config;
        return <InputRange min={0} max={100} value={config.mixer} />;
    }

    renderMenuChangeMixer() {
        const config = this.props.config;
        return <InputRange
            min={0}
            max={100}
            value={typeof config.mixer !== "undefined" ? config.mixer : 100}
            onChange={(e, mixerValue) => this.changeMixer(mixerValue)}
        />;
    }

    renderMenuChangeDetune() {
        const config = this.props.config;
        return ( <InputRange
            min={-1000}
            max={1000}
            value={typeof config.detune !== "undefined" ? config.detune : 100}
            onChange={(e, detuneValue) => this.changeDetune(detuneValue)}
        />);
    }

    renderMenuChangeKeyRoot() {
        const values = new Values();
        return (<>
            <MenuAction onAction={()=>{}} disabled>Edit Key Root</MenuAction>
            <MenuBreak />
            {values.getNoteOctaves((octave) =>
                <MenuDropDown
                    key={octave}
                    options={() =>
                    values.getNoteFrequencies((noteName) =>
                        <MenuAction
                            key={noteName}
                            onAction={e => this.changeRoot(noteName+octave)}
                        >{noteName+octave}</MenuAction>
                    )
                }>{octave}</MenuDropDown>)}
        </>);
    }

    renderMenuChangeKeyAlias() {
        const values = new Values();
        return (<>
            <MenuAction onAction={()=>{}} disabled>Edit Key Root</MenuAction>
            <MenuBreak />
            {values.getNoteOctaves((octave) =>
                <MenuDropDown
                    key={octave}
                    options={() =>
                    values.getNoteFrequencies((noteName) =>
                        <MenuAction
                            key={noteName}
                            onAction={e => this.changeAlias(noteName+octave)}
                        >{noteName+octave}</MenuAction>

                )}>{octave}</MenuDropDown>)}
        </>);
    }



    renderMenuChangeKeyRange() {
        return (<></>);
    }

    renderMenuChangeLoop() {
        return (<></>);
    }
}

export default OscillatorNodeInstrumentRenderer;
