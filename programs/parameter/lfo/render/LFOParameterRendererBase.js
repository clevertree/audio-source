import React from 'react';
import {
    ASUIMenuAction,
    ASUIMenuBreak,
    ASUIInputRange, ASUIClickableDropDown, ASUIMenuItem,
} from "../../../../components";
import LibraryProcessor from "../../../../song/library/LibraryProcessor";
import PropTypes from "prop-types";


export default class LFOParameterRendererBase extends React.Component {
    /** Property validation **/
    static propTypes = {
        parentMenu: PropTypes.func,
    };

    /** Formatting Callbacks **/
    static formats = {
        hz: value => `${value}hz`,
        x: value => `${value}x`
    }

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
        this.library = LibraryProcessor.loadDefault();

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
        if(config.parameter) {
            const parameters = this.props.parameters;
            return "LFO: " + (parameters[config.parameter] || config.parameter);
        }
        return "LFO";
    }




    /** Parameters **/

    getParameters() {
        const config = this.props.config;
        return [
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
    }



    /** Inputs **/

    renderInput(paramName) {
        const config = this.props.config;
        switch(paramName) {

            case 'parameter':
                return <ASUIClickableDropDown
                    // className="small"
                    options={this.cb.renderParamMenu.parameter}
                >{config.parameter ? config.parameter : "No Param"}</ASUIClickableDropDown>


            case 'frequency':
                const frequency = typeof config.frequency !== "undefined" ? config.frequency : 5;
                return <ASUIInputRange
                    // className="small"
                    min={0}
                    max={24}
                    step={0.1}
                    value={frequency}
                    format={LFOParameterRendererBase.formats.hz}
                    onChange={this.cb.changeParam[paramName]}
                />;

            case 'amplitude':
                const value = typeof config[paramName] !== "undefined" ? config[paramName] : 0;
                return <ASUIInputRange
                    // className="small"
                    min={0}
                    max={10000}
                    step={1}
                    value={value}
                    format={ASUIInputRange.formats.percent}
                    onChange={this.cb.changeParam[paramName]}
                />;

            default:
                throw new Error("Unknown parameter: " + paramName);
        }
    }


    /** Actions **/

    toggleOpen() {
        const open = !this.props.open;
        this.props.setProps(this.props.programID, {open})
    }

    changeParam(paramName, newValue) {
        this.props.config[paramName] = newValue;
    }

    /** Menus **/

    renderMenuRoot() {
        return (<>
            <ASUIMenuAction onAction={()=>{}} disabled>{this.getTitle()}</ASUIMenuAction>
            {this.props.parentMenu ? <>
                <ASUIMenuBreak />
                {this.props.parentMenu(this.props.programID)}
            </> : null}
        </>);
    }

    renderMenuChangeSourceParameter() {
        const parameters = this.props.parameters;
        return (<>
            <ASUIMenuItem>Choose Source Parameter</ASUIMenuItem>
            <ASUIMenuBreak/>
            {Object.keys(parameters).map((parameter, i) =>
                <ASUIMenuAction key={i} onAction={e => this.changeParam('parameter', parameter)}>{parameters[parameter]}</ASUIMenuAction>
            )}
        </>);
    }
}
