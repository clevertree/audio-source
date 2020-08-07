import React from 'react';

import {
    ASUIButtonDropDown,
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
            // renderMenuChange: (paramName) => this.renderMenuChange(paramName),
            parameterMenu: {
                attack: () => this.renderMenuChange('attack'),
                hold: () => this.renderMenuChange('hold'),
                delay: () => this.renderMenuChange('delay'),
                sustain: () => this.renderMenuChange('sustain'),
                release: () => this.renderMenuChange('release'),
            },
            changeParam: {
                attack:     (newValue) => this.changeParam('attack', newValue),
                hold:       (newValue) => this.changeParam('hold', newValue),
                delay:      (newValue) => this.changeParam('delay', newValue),
                sustain:    (newValue) => this.changeParam('sustain', newValue),
                release:    (newValue) => this.changeParam('release', newValue),
            },
        };
    }


    render() {
        return <EnvelopeEffectRendererContainer
            onClick={this.cb.onClick}
            renderMenuRoot={this.cb.renderMenuRoot}
            config={this.props.config}
            parameters={[
                {
                    label:      'Attack',
                    title:      'Edit Envelope Attack',
                    children:   this.renderInput('attack'),
                },
                {
                    label:      'Hold',
                    title:      'Edit Envelope Hold',
                    children:   this.renderInput('hold'),
                },
                {
                    label:      'Delay',
                    title:      'Edit Envelope Delay',
                    children:   this.renderInput('delay'),
                },
                {
                    label:      'Sustain',
                    title:      'Edit Envelope Sustain',
                    children:   this.renderInput('sustain'),
                },
                {
                    label:      'Release',
                    title:      'Edit Envelope Release',
                    children:   this.renderInput('release'),
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

        return <Renderer
                    onRemove={this.cb.onRemove}
                    instrumentID={0}
                    config={config}
                    program={voice}
                />;
    }


    /** Inputs **/

    renderInput(paramName) {
        const config = this.props.config;
        switch(paramName) {
            default:
                const value = typeof config[paramName] !== "undefined" ? config[paramName] : 100;
                return <ASUIInputRange
                    className="small"
                    min={0}
                    max={100}
                    value={value}
                    children={`${value}%`}
                    onChange={this.cb.changeParam[paramName]}
                />;

        }
    }




    /** Actions **/

    toggleOpen() {
        const config = this.props.config;
        if(config.open)
            delete config.open;
        else
            config.open = true;
    }

    changeParam(paramName, newValue) {
        this.props.config[paramName] = newValue;
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
