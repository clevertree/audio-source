import React from 'react';
import {
    ASUIMenuAction,
    ASUIMenuBreak,
    ASUIInputRange, ASUIButtonDropDown, ASUIMenuDropDown, ASUIMenuItem,
} from "../../../../components";
import LibraryIterator from "../../../../song/library/LibraryIterator";
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
                parameter: () => this.renderMenuChangeSourceParameter(),
            },
            changeParam: {
                frequency:    (newValue) => this.changeParam('frequency', newValue),
                amplitude:   (newValue) => this.changeParam('amplitude', newValue),
            },
        };
        this.library = LibraryIterator.loadDefault();

        // console.log(`${this.constructor.name}.constructor`, props);
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
                label:      'Parameter',
                title:      `Parameter to automate`,
                children:   this.renderInput('parameter'),
            },
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
        const config = this.props.config;
        switch(paramName) {

            case 'parameter':
                return <ASUIButtonDropDown
                    className="small"
                    options={this.cb.renderParamMenu.parameter}
                >{config.parameter ? config.parameter : "No Param"}</ASUIButtonDropDown>

            default:
                const value = typeof config[paramName] !== "undefined" ? config[paramName] : 100;
                return <ASUIInputRange
                    // className="small"
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

    renderMenuChangeSourceParameter() {
        const parameters = this.props.parameters;
        return (<>
            <ASUIMenuItem>Choose Source Parameter</ASUIMenuItem>
            <ASUIMenuBreak/>
            {Object.keys(parameters).map(parameter =>
                <ASUIMenuAction onAction={e => this.changeParam('parameter', parameter)}>{parameters[parameter]}</ASUIMenuAction>
            )}
        </>);
    }
}

export default LFOParameterRenderer;