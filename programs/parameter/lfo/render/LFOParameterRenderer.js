import React from 'react';
import {
    ASUIMenuAction,
    ASUIMenuBreak,
    ASUIInputRange,
    ASUIMenuDropDown, ASUIIcon, ASUIButtonDropDown,
} from "../../../../components";
import LibraryIterator from "../../../../song/library/LibraryIterator";
import Values from "../../../../common/values/Values";
import LFOParameterRendererContainer from "./container/LFOParameterRendererContainer";


class LFOParameterRenderer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false
        };
        this.cb = {
            onClick: e => this.toggleOpen(),
            renderMenu: {
                root: () => this.renderMenuRoot(),
            },
            renderParamMenu: {
                root: () => this.renderMenuChangeKeyRoot(),
                alias: () => this.renderMenuChangeKeyAlias(),
                range: () => this.renderMenuChangeKeyRange(),
                source: () => this.renderMenuChangeOscillator(),
            },
            changeParam: {
                mixer:    (newValue) => this.changeParam('mixer', newValue),
                detune:   (newValue) => this.changeParam('detune', newValue),
            },
        };
        this.library = LibraryIterator.loadDefault();

        console.log(`${this.constructor.name}.constructor`, props);
    }


    componentDidUpdate(prevProps, prevState, snapshot) {
        // if(!this.props.config.type) {
        //     console.warn("No default oscillator type was set. Setting to 'sawtooth'");
        //     this.props.config.type = 'sawtooth';
        // }
    }

    getTitle() {
        const config = this.props.config;
        if(config.parameter)
            return "LFO: " + config.parameter;
        return "LFO";
    }



    render() {
        let title = this.getTitle();
        const config = this.props.config;

        const parameters = [
            {
                label:      'Frequency',
                title:      `Frequency in ${config.frequency} cents`,
                children:   this.renderInput('frequency'),
            },
            {
                label:      'Amplitude',
                title:      `Amplitude is ${config.amplitude}`,
                children:   this.renderInput('amplitude'),
            },
        ];

        return <LFOParameterRendererContainer
            onClick={this.cb.onClick}
            renderMenuRoot={this.cb.renderMenu.root}
            config={this.props.config}
            parameters={parameters}
            title={title}
        >
        </LFOParameterRendererContainer>;
    }


    /** Inputs **/

    renderInput(paramName) {
        let value;
        const config = this.props.config;
        switch(paramName) {
            default:
                const value = typeof config[paramName] !== "undefined" ? config[paramName] : 100;
                return <ASUIInputRange
                    className="small"
                    min={0}
                    max={100}
                    value={value}
                    children={`${value}c`}
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

    /** Menus **/

    renderMenuRoot() {
        return (<>
            <ASUIMenuAction onAction={()=>{}} disabled>{this.getTitle()}</ASUIMenuAction>
            <ASUIMenuBreak />
        </>);
    }

}

export default LFOParameterRenderer;
