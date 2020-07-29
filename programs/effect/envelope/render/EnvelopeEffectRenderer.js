import React from 'react';

import {
    ASUIButtonDropDown,
    ASUIIcon,
    ASUIClickable,
    ASUIClickableDropDown,
    ASUIInputRange
} from "../../../../components";
import {ProgramLoader} from "../../../../common/";

import EnvelopeEffectRendererContainer from "./container/EnvelopeEffectRendererContainer";

export default class EnvelopeEffectRenderer extends React.Component {
    constructor(props) {
        super(props);
        this.cb = {
            onClick: e => this.toggleOpen(),
            renderMenuRoot: () => this.renderMenuRoot(),
            renderMenuChange: (paramName) => this.renderMenuChange(paramName),
            parameterMenu: {
                attack: () => this.renderMenuChange('attack'),
                hold: () => this.renderMenuChange('hold'),
                delay: () => this.renderMenuChange('delay'),
                sustain: () => this.renderMenuChange('sustain'),
                release: () => this.renderMenuChange('release'),
            }
        };
    }


    render() {
        const config = this.props.config;
        return <EnvelopeEffectRendererContainer
            onClick={this.cb.onClick}
            config={this.props.config}
            renderMenuChange={this.cb.renderMenuChange}
            parameters={[
                {
                    paramName:  'attack',
                    title:      'Edit Envelope Attack',
                    children:   `${Math.round((config.attack||0) / 10) / 100}s`,
                    options:    this.cb.parameterMenu.attack
                },
                {
                    paramName:  'hold',
                    title:      'Edit Envelope Hold',
                    children:   `${Math.round((config.hold||0) / 10) / 100}s`,
                    options:    this.cb.parameterMenu.hold
                },
                {
                    paramName:  'delay',
                    title:      'Edit Envelope Delay',
                    children:   `${Math.round((config.delay||0) / 10) / 100}s`,
                    options:    this.cb.parameterMenu.delay
                },
                {
                    paramName:  'sustain',
                    title:      'Edit Envelope Sustain',
                    children:   `${Math.round((config.sustain||0) / 10) / 100}s`,
                    options:    this.cb.parameterMenu.sustain
                },
                {
                    paramName:  'release',
                    title:      'Edit Envelope Release',
                    children:   `${Math.round((config.release||0) / 10) / 100}s`,
                    options:    this.cb.parameterMenu.release
                },
            ]}
            >
            {this.renderVoice()}
        </EnvelopeEffectRendererContainer>;
    }

    renderVoice() {
        const voice = this.props.config.voice;
        if(!voice) {
            return <ASUIButtonDropDown
                title="Add voice"
                className="add-voice"
                arrow={false}
                options={() => this.renderMenuAddVoice()}>
                Set Voice
            </ASUIButtonDropDown>;
        }

        const [className, config] = voice;
        const {classRenderer: Renderer} = ProgramLoader.getProgramClassInfo(className);

        return <div className="voice">
                 <Renderer
                    onRemove={this.cb.onRemove}
                    instrumentID={0}
                    config={config}
                    program={voice}
                />
        </div>;
    }


    renderParameters() {
        if(!this.props.config.open)
            return [];
        const config = this.props.config;

        // TODO: rethink native parameters?
        return (<>
            <ASUIClickableDropDown
                className="attack"
                title="Edit Envelope Attack"
                options={() => this.renderMenuChange('attack')}
                arrow={false}
                vertical
                children={`${Math.round((config.attack||0) / 10) / 100}s`}
            />
            <ASUIClickableDropDown
                className="hold"
                title="Edit Envelope Hold"
                options={() => this.renderMenuChange('hold')}
                arrow={false}
                vertical
                children={`${Math.round((config.hold||0) / 10) / 100}s`}
            />
            <ASUIClickableDropDown
                className="delay"
                title="Edit Envelope Delay"
                options={() => this.renderMenuChange('delay')}
                arrow={false}
                vertical
                children={`${Math.round((config.delay||0) / 10) / 100}s`}
            />
            <ASUIClickableDropDown
                className="sustain"
                title="Edit Envelope Sustain"
                options={() => this.renderMenuChange('sustain')}
                arrow={false}
                vertical
                children={`${Math.round((config.sustain||0) / 10) / 100}s`}
            />
            <ASUIClickableDropDown
                className="release"
                title="Edit Envelope Release"
                options={() => this.renderMenuChange('release')}
                arrow={false}
                vertical
                children={`${Math.round((config.release||0) / 10) / 100}s`}
            />
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

    /** Menu **/



    renderMenuChange(paramName) {
        const config = this.props.config;
        return <ASUIInputRange
            min={0}
            max={100}
            value={typeof config.mixer !== "undefined" ? config.mixer : 100}
            onChange={(mixerValue) => this.changeMixer(mixerValue)}
        />;
    }
}
