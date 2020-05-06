import React from 'react';
import {
    ASUIMenuAction,
    ASUIMenuBreak,
    ASUIInputRange,
    ASUIMenuDropDown,
} from "../../../../components";
import Library from "../../../../song/library/Library";
import Values from "../../../../common/values/Values";


class OscillatorInstrumentRendererBase extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false
        };
        this.cb = {
            onClick: e => this.toggleOpen(),
        };
        this.library = Library.loadDefault();
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


    renderParameters() {
        if(!this.state.open)
            return [];
        const config = this.props.config;
        return (<>
            <ASUIMenuDropDown title="Edit Mixer"
                              className="mixer"
                              options={() => this.renderMenuChangeMixer()}
                              arrow={false}
                              vertical>
                {typeof config.mixer !== "undefined" ? config.mixer+'%' : '100%'}
            </ASUIMenuDropDown>
            <ASUIMenuDropDown title={`Detune by ${config.detune} cents`}
                              className="detune"
                              options={() => this.renderMenuChangeDetune()}
                              arrow={false}
                              vertical>
                {typeof config.detune !== "undefined" ? config.detune+'c' : '0c'}
            </ASUIMenuDropDown>
            {config.root ? <ASUIMenuDropDown title={`Key Root is ${config.root}`}
                                             className="root"
                                             options={() => this.renderMenuChangeKeyRoot()}
                                             arrow={false}
                                             vertical>
                {config.root ? config.root : "-"}
            </ASUIMenuDropDown> : null}
            {config.alias ? <ASUIMenuDropDown title={`Key Alias is ${config.alias}`}
                                              className="alias"
                                              options={() => this.renderMenuChangeKeyAlias()}
                                              arrow={false}
                                              vertical>
                {config.alias ? config.alias : "-"}
            </ASUIMenuDropDown> : null}
            {config.range ? <ASUIMenuDropDown title={`Key Range is ${config.range}`}
                                              className="range"
                                              options={() => this.renderMenuChangeKeyRange()}
                                              arrow={false}
                                              vertical>
                {config.range ? config.range : "-"}
            </ASUIMenuDropDown> : null}
            <ASUIMenuAction
                    className="loop"
                    title="Toggle Loop"
                    onAction={e => this.changeLoop(!config.loop)}
                    arrow={false}
                    vertical>
                    {config.loop?'∞':'1'}
            </ASUIMenuAction>
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


    changeOscillator(newType) {
        if(newType === 'custom') {
        } else {
            delete this.props.config.url;
            delete this.props.config.real;
            delete this.props.config.imag;
            delete this.props.config.title;
            this.props.config.type = newType;
        }
    }

    changeLoop(newLoopValue=null) {
        if(newLoopValue === null)
            newLoopValue = !this.props.config.loop;
        this.props.config.loop = newLoopValue?1:0;
    }

    loadPreset(preset) {
        console.log("Loading preset: ", preset);
        preset.type = 'custom';
        Object.assign(this.props.config, preset);
    }

    /** Menus **/

    renderMenuRoot() {
        return (<>
            <ASUIMenuAction onAction={()=>{}} disabled>Oscillator: {this.getTitle()}</ASUIMenuAction>
            <ASUIMenuBreak />
            <ASUIMenuDropDown options={() => this.renderMenuChangeOscillator()}>Change Oscillator</ASUIMenuDropDown>
            <ASUIMenuBreak />
            <ASUIMenuDropDown options={() => this.renderMenuChangeMixer()}>Edit Mixer</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChangeDetune()}>Edit Detune</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChangeKeyRoot()}>Edit Key Root</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChangeKeyAlias()}>Edit Key Alias</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChangeKeyRange()}>Edit Key Range</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChangeLoop()}>Toggle Loop</ASUIMenuDropDown>
            <ASUIMenuAction disabled={!this.props.onRemove} onAction={(e) => this.props.onRemove(this.props.instrumentID)}>Remove Oscillator</ASUIMenuAction>
        </>);
    }

    renderMenuChangeOscillator() {
        return (<>
            <ASUIMenuDropDown options={() => this.renderMenuChangeOscillatorStandard()}>Standard</ASUIMenuDropDown>
            {/*<MenuDropDown options={() => this.renderMenuChangeOscillator('custom')}>Custom</MenuDropDown>*/}
            <ASUIMenuBreak/>
            {this.library.renderMenuProgramAllPresets(([className, presetConfig]) => {
                this.loadPreset(className, presetConfig);
            })}
        </>);
    }

    renderMenuChangeOscillatorStandard() {
        return (<>
            <ASUIMenuAction onAction={e => this.changeOscillator('sine')}>Sine</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.changeOscillator('square')}>Square</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.changeOscillator('sawtooth')}>Sawtooth</ASUIMenuAction>
            <ASUIMenuAction onAction={e => this.changeOscillator('triangle')}>Triangle</ASUIMenuAction>
        </>);
    }



    renderMenuChangeMixer() {
        const config = this.props.config;
        return <ASUIInputRange
            min={0}
            max={100}
            value={typeof config.mixer !== "undefined" ? config.mixer : 100}
            onChange={(e, mixerValue) => this.changeMixer(mixerValue)}
        />;
    }

    renderMenuChangeDetune() {
        const config = this.props.config;
        return ( <ASUIInputRange
            min={-1000}
            max={1000}
            value={typeof config.detune !== "undefined" ? config.detune : 100}
            onChange={(e, detuneValue) => this.changeDetune(detuneValue)}
        />);
    }

    renderMenuChangeKeyRoot() {
        return Values.renderMenuSelectCommand(noteNameOctave => {
            this.changeRoot(noteNameOctave)
        });
    }

    renderMenuChangeKeyAlias() {
        return Values.renderMenuSelectCommand(noteNameOctave => {
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

export default OscillatorInstrumentRendererBase;
