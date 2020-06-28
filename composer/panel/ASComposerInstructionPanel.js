import React from "react";

import {ASUIForm, ASUIPanel, ASUIInputRange, ASUIButtonDropDown} from "../../components";
import {ArgType, InstructionProcessor} from "../../common";

export default class ASComposerInstructionPanel extends React.Component {

    render() {
        return (
            <ASUIPanel
                className="instructions"
                header={`Instruction`}>
                {this.renderInstructionForms()}
            </ASUIPanel>
        );
    }

    // TODO: combine with InstructionBase?
    renderInstructionForms() {
        const composer = this.props.composer;

        const instructionData = composer.state.selectedInstructionData;
        const processor = new InstructionProcessor(instructionData);
        const [, argTypeList] = processor.processInstructionArgs();

        // console.log('commandString', commandString, params);
        let argIndex = 0;
        return argTypeList.map((argType, i) => {
            if(!argType.consumesArgument)
                return null;
            argIndex++;
            let paramValue = instructionData[argIndex];
            switch(argType) {
                case ArgType.command:
                case ArgType.duration:
                case ArgType.frequency:
                case ArgType.offset:
                case ArgType.trackName:
                default:
                    return this.renderDropDownForm(instructionData, argType, argIndex, paramValue);

                case ArgType.velocity:
                    return this.renderVelocityForm(instructionData, argType, argIndex, paramValue);
            }
        });
    }

    renderDropDownForm(instructionData, argType, argIndex, paramValue) {
        let header = argType.title.split(' ').pop(); // Long text hack
        const composer = this.props.composer;
        return <ASUIForm key={argIndex} header={header}>
            <ASUIButtonDropDown
                arrow={'▼'}
                title={`Change ${argType.title}`}
                options={() => composer.renderMenuEditInstructionArgOptions(instructionData, argType, argIndex, paramValue)}
            >{argType.format(paramValue, composer.getSong().values)}</ASUIButtonDropDown>
        </ASUIForm>
    }

    renderVelocityForm(instructionData, argType, argIndex, paramValue, header="Velocity", title="Instruction Velocity") {
        const composer = this.props.composer;

        return <ASUIForm key={argIndex} header={header}>
            <ASUIInputRange
                // className="velocity"
                onChange={(newVelocity) => {
                    composer.instructionReplaceArgByType(composer.state.selectedTrack, composer.state.selectedTrackIndices, argType, newVelocity);
                }}
                value={paramValue || 0}
                min={1}
                max={127}
                // ref={ref => this.fieldProgramVelocity = ref}
                title={title}
                // disabled={selectedIndices.length === 0}
            />
        </ASUIForm>;
    }

}
