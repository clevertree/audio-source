import React from 'react';

import {ASUIButtonDropDown, ASUIIcon, ASUIClickableDropDown} from "../../../../components";
import {ProgramLoader} from "../../../../common/";

import "./EnvelopeEffectRenderer.css";
import EnvelopeEffectRendererContainer from "./container/EnvelopeEffectRendererContainer";

export default class EnvelopeEffectRenderer extends React.Component {
    constructor(props) {
        super(props);
        this.cb = {
            onClick: e => this.toggleOpen(),
            renderMenuRoot: () => this.renderMenuRoot()
        };
    }


    render() {
        const voice = this.props.config.voice;
//         console.log('voices', voices);
        // Presets are handled by composer

        return <EnvelopeEffectRendererContainer
            onClick={this.cb.onClick}
            open={this.props.config.open}
        >
            <ASUIClickableDropDown
                arrow={false}
                className="config"
                options={this.cb.renderMenuRoot}
            >
                <ASUIIcon source="config" size="small"/>
            </ASUIClickableDropDown>
            {this.renderParameters()}
            {voice ? this.renderVoice()
                : <ASUIButtonDropDown
                    title="Add voice"
                    className="add-voice"
                    arrow={false}
                    options={() => this.renderMenuAddVoice()}>
                    Set Voice
                </ASUIButtonDropDown>}


        </EnvelopeEffectRendererContainer>;
    }

    renderVoice() {
        const voice = this.props.config.voice;
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

        // TODO: Add frequency LFO
        return (<>
            <ASUIClickableDropDown
                className="mixer"
                title="Edit Mixer"
                options={() => this.renderMenuChangeMixer()}
                arrow={false}
                vertical
                children={typeof config.mixer !== "undefined" ? config.mixer+'%' : '100%'}
            />
            <ASUIClickableDropDown
                className="detune"
                title={`Detune by ${config.detune} cents`}
                options={() => this.renderMenuChangeDetune()}
                arrow={false}
                vertical
                children={typeof config.detune !== "undefined" ? config.detune+'c' : '0c'}
            />
            {config.root ? <ASUIClickableDropDown
                className="root"
                title={`Key Root is ${config.root}`}
                options={() => this.renderMenuChangeKeyRoot()}
                arrow={false}
                children={config.root ? config.root : "-"}
            /> : null}
            {config.alias ? <ASUIClickableDropDown
                className="alias"
                title={`Key Alias is ${config.alias}`}
                options={() => this.renderMenuChangeKeyAlias()}
                arrow={false}
                children={config.alias ? config.alias : "-"}
            /> : null}
            {config.range ? <ASUIClickableDropDown
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
}
