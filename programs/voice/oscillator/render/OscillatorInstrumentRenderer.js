import React from 'react';
import {
    ASUIMenuAction,
    ASUIMenuBreak,
    ASUIInputRange,
    ASUIMenuDropDown, ASUIIcon,
} from "../../../../components";
import LibraryIterator from "../../../../song/library/LibraryIterator";
import Values from "../../../../common/values/Values";
import OscillatorInstrumentRendererContainer from "./container/OscillatorInstrumentRendererContainer";
import OscillatorInstrumentRendererParameter from "./parameter/OscillatorInstrumentRendererParameter";


class OscillatorInstrumentRenderer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false
        };
        this.cb = {
            onClick: e => this.toggleOpen(),
            renderMenuRoot: () => this.renderMenuRoot()
        };
        this.library = LibraryIterator.loadDefault();
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
        let title = this.getTitle();

        return <OscillatorInstrumentRendererContainer
            onClick={this.cb.onClick}
            open={this.props.config.open}
            title={title}
            >
            {this.renderParameters()}
            <OscillatorInstrumentRendererParameter
                arrow={false}
                className="config"
                options={this.cb.renderMenuRoot}
            >
                <ASUIIcon source="config" size="small"/>
            </OscillatorInstrumentRendererParameter>
        </OscillatorInstrumentRendererContainer>;
    }

    renderParameters() {
        if(!this.props.config.open)
            return [];
        const config = this.props.config;

        // TODO: Add frequency LFO
        return (<>
            <OscillatorInstrumentRendererParameter
                className="mixer"
                title="Edit Mixer"
                options={() => this.renderMenuChangeMixer()}
                arrow={false}
                vertical
                children={typeof config.mixer !== "undefined" ? config.mixer+'%' : '100%'}
                />
            <OscillatorInstrumentRendererParameter
                className="detune"
                title={`Detune by ${config.detune} cents`}
                options={() => this.renderMenuChangeDetune()}
                arrow={false}
                vertical
                children={typeof config.detune !== "undefined" ? config.detune+'c' : '0c'}
                />
            {config.root ? <OscillatorInstrumentRendererParameter
                className="root"
                title={`Key Root is ${config.root}`}
                options={() => this.renderMenuChangeKeyRoot()}
                arrow={false}
                children={config.root ? config.root : "-"}
            /> : null}
            {config.alias ? <OscillatorInstrumentRendererParameter
                className="alias"
                title={`Key Alias is ${config.alias}`}
                options={() => this.renderMenuChangeKeyAlias()}
                arrow={false}
                children={config.alias ? config.alias : "-"}
            /> : null}
            {config.range ? <OscillatorInstrumentRendererParameter
                className="range"
                title={`Key Range is ${config.range}`}
                options={() => this.renderMenuChangeKeyRange()}
                arrow={false}
                children={config.range ? config.range : "-"}
            /> : null}
            {/*<ASUIMenuAction*/}
            {/*        className="loop"*/}
            {/*        title="Toggle Loop"*/}
            {/*        onAction={e => this.changeLoop(!config.loop)}*/}
            {/*        arrow={false}*/}
            {/*        vertical>*/}
            {/*        {config.loop?'∞':'1'}*/}
            {/*</ASUIMenuAction>*/}
        </>);
    }


    /** Actions **/

    toggleOpen() {
        const config = this.props.config;
        if(config.open)
            delete config.open;
        else
            config.open = true;
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

    // changeLoop(newLoopValue=null) {
    //     if(newLoopValue === null)
    //         newLoopValue = !this.props.config.loop;
    //     this.props.config.loop = newLoopValue?1:0;
    // }

    loadPreset(className, presetConfig) {
        if(className !== this.props.program[0])
            throw new Error(`This preset is for class ${className}, not ${this.props.program[0]}`);
        if(!presetConfig.type)
            presetConfig.type = 'custom';
        this.props.program[1] = presetConfig;
        console.log("Loaded preset: ", presetConfig);
    }

    /** Menus **/

    renderMenuRoot() {
        return (<>
            <ASUIMenuAction onAction={()=>{}} disabled>{`Oscillator: ${this.getTitle()}`}</ASUIMenuAction>
            <ASUIMenuBreak />
            <ASUIMenuDropDown options={() => this.renderMenuChangeOscillator()}>Change Oscillator</ASUIMenuDropDown>
            <ASUIMenuBreak />
            <ASUIMenuDropDown options={() => this.renderMenuChangeMixer()}>Edit Mixer</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChangeDetune()}>Edit Detune</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChangeKeyRoot()}>Edit Key Root</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChangeKeyAlias()}>Edit Key Alias</ASUIMenuDropDown>
            <ASUIMenuDropDown options={() => this.renderMenuChangeKeyRange()}>Edit Key Range</ASUIMenuDropDown>
            {/*<ASUIMenuDropDown options={() => this.renderMenuChangeLoop()}>Toggle Loop</ASUIMenuDropDown>*/}
            <ASUIMenuAction disabled={!this.props.onRemove} onAction={(e) => this.props.onRemove(this.props.instrumentID)}>Remove Oscillator</ASUIMenuAction>
        </>);
    }

    async renderMenuChangeOscillator() {
        return (<>
            <ASUIMenuDropDown options={() => this.renderMenuChangeOscillatorStandard()}>Standard</ASUIMenuDropDown>
            {/*<MenuDropDown options={() => this.renderMenuChangeOscillator('custom')}>Custom</MenuDropDown>*/}
            <ASUIMenuBreak/>
            {await this.library.renderMenuProgramAllPresets((className, presetConfig) => {
                this.loadPreset(className, presetConfig);
            }, this.props.program[0])}
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
        return (<>
            <ASUIInputRange
                min={0}
                max={100}
                value={typeof config.mixer !== "undefined" ? config.mixer : 100}
                onChange={(mixerValue) => this.changeMixer(mixerValue)}
               />
               <ASUIMenuAction onAction={() => {}} disabled>Add LFO</ASUIMenuAction>
            </>);
    }

    renderMenuChangeDetune() {
        const config = this.props.config;
        return (<>
            <ASUIInputRange
                min={-1000}
                max={1000}
                value={typeof config.detune !== "undefined" ? config.detune : 100}
                onChange={(detuneValue) => this.changeDetune(detuneValue)}
                />
            <ASUIMenuAction onAction={() => {}} disabled>Add LFO</ASUIMenuAction>
        </>);
    }

    renderMenuChangeKeyRoot() {
        return new Values().renderMenuSelectCommand(noteNameOctave => {
            this.changeRoot(noteNameOctave)
        });
    }

    renderMenuChangeKeyAlias() {
        return new Values().renderMenuSelectCommand(noteNameOctave => {
            this.changeAlias(noteNameOctave)
        });
    }


    renderMenuChangeKeyRange() {
        return (<>TODO</>);
    }

    // renderMenuChangeLoop() {
    //     return (<>TODO</>);
    // }
}

export default OscillatorInstrumentRenderer;
