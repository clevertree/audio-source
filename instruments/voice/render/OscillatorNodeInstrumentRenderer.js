import React from 'react';
import {
    // Button,
    // InputSelect,
    Div,
    MenuAction,
    MenuBreak,
    Icon,
    InputRange,
    MenuDropDown,
} from "../../../components";
import {MenuValues} from "../../../song";

import "./assets/OscillatorNodeInstrumentRenderer.css";

class OscillatorNodeInstrumentRenderer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false
        };
        this.cb = {
            onClick: e => this.toggleOpen(),
        };
    }


    componentDidUpdate(prevProps, prevState, snapshot) {
        if(!this.props.config.type) {
            console.warn("No default oscillator type was set. Setting to 'sawtooth'");
            this.props.config.type = 'sawtooth';
        }
    }

    getTitle() {
        return this.props.config.title
            || this.props.config.type
            || "Unknown Osc";
    }

    render() {
        let className = "instrument-renderer-oscillator-node";
        if(this.state.open)
            className += ' open';
        let title = this.getTitle();


        return <Div className={className}>
            <Div
                className="title"
                title={`Oscillator: ${title}`}
                onClick={this.cb.onClick}
                >
                {title}
            </Div>
            {this.renderParameters()}
            <MenuDropDown
                arrow={false}
                className="config"
                options={() => this.renderMenuRoot()}
            >
                <Icon className="config"/>
            </MenuDropDown>
        </Div>;
    }

    renderParameters() {
        if(!this.state.open)
            return [];
        const config = this.props.config;
        return (<>
            <MenuDropDown title="Edit Mixer"
                          className="mixer"
                          options={() => this.renderMenuChangeMixer()}
                          arrow={false}
                          vertical>
                {typeof config.mixer !== "undefined" ? config.mixer+'%' : '100%'}
            </MenuDropDown>
            <MenuDropDown title={`Detune by ${config.detune} cents`}
                          className="detune"
                          options={() => this.renderMenuChangeDetune()}
                          arrow={false}
                          vertical>
                {typeof config.detune !== "undefined" ? config.detune+'c' : '0c'}
            </MenuDropDown>
            {config.root ? <MenuDropDown title={`Key Root is ${config.root}`}
                          className="root"
                          options={() => this.renderMenuChangeKeyRoot()}
                          arrow={false}
                          vertical>
                {config.root ? config.root : "-"}
            </MenuDropDown> : null}
            {config.alias ? <MenuDropDown title={`Key Alias is ${config.alias}`}
                          className="alias"
                          options={() => this.renderMenuChangeKeyAlias()}
                          arrow={false}
                          vertical>
                {config.alias ? config.alias : "-"}
            </MenuDropDown> : null}
            {config.range ? <MenuDropDown title={`Key Range is ${config.range}`}
                          className="range"
                          options={() => this.renderMenuChangeKeyRange()}
                          arrow={false}
                          vertical>
                {config.range ? config.range : "-"}
            </MenuDropDown> : null}
            <MenuAction
                    className="loop"
                    title="Toggle Loop"
                    onAction={e => this.changeLoop(!config.loop)}
                    arrow={false}
                    vertical>
                    {config.loop?'∞':'1'}
            </MenuAction>
        </>);
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
            <MenuDropDown options={() => this.renderMenuChangeOscillator()}>Change Oscillator</MenuDropDown>
            <MenuAction disabled={!this.props.onRemove} onAction={(e) => this.props.onRemove(this.props.instrumentID)}>Remove Oscillator</MenuAction>
        </>);
    }

    // TODO: use generic menu/value library
    renderMenuChangeOscillator() {
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
        return new MenuValues().renderMenuSelectCommand(noteNameOctave => {
            this.changeRoot(noteNameOctave)
        });
    }

    renderMenuChangeKeyAlias() {
        return new MenuValues().renderMenuSelectCommand(noteNameOctave => {
            this.changeAlias(noteNameOctave)
        });
    }


    renderMenuChangeKeyRange() {
        return (<>TODO</>);
    }

    renderMenuChangeLoop() {
        return (<>TODO</>);
    }
}

export default OscillatorNodeInstrumentRenderer;
