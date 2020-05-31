import React from "react";

import {ASUIForm, ASUIPanel, ASUIInputRange, ASUIButton, ASUIButtonDropDown} from "../../components";
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
        // const params = composer.state.selectedInstructionArgs;
        const instructionData = [0].concat(composer.state.selectedInstructionArgs);
        // let [commandString, ...params] = composer.state.selectedInstructionArgs;
        // let commandString = params.shift();
        const processor = new InstructionProcessor(instructionData);
        const [, argTypeList] = processor.processInstructionArgs();
        // commandString = InstructionProcessor.getCommandStringFromInstruction(commandString, params);
        // console.log('commandString', commandString, params);
        let paramPosition = 1;
        return argTypeList.map((argType, i) => {
            if(!argType.consumesArgument)
                return null;
            let param = instructionData[paramPosition++];
            switch(argType) {
                case ArgType.command: // TODO: resolve conflict?
                    return this.renderCommandForm(i, param);

                case ArgType.frequency:
                    return this.renderFrequencyForm(i, param);

                case ArgType.trackKey:
                    return this.renderFrequencyForm(i, param, "Key", "Track Key");

                case ArgType.duration:
                    return this.renderDurationForm(i, param, 'Duration', 'Instruction Duration');

                case ArgType.velocity:
                    return this.renderVelocityForm(i, param, "Velocity", "Instruction Velocity");

                /** Track Args **/

                case ArgType.trackDuration:
                    return this.renderDurationForm(i, param, 'Duration', 'Track Duration');

                case ArgType.trackOffset:
                    return this.renderDurationForm(i, param, 'Offset', 'Track Offset');

                case ArgType.trackName:
                    return this.renderTrackNameForm(i, param, 'Track', 'Select Track');



                default:
                    return this.renderUnknownArg(i, param);
            }
        });
    }

    renderCommandForm(i, param, header="Command", title="Select Command") {
        const composer = this.props.composer;
        return <ASUIForm key={i} header={header}>
            <ASUIButtonDropDown
                arrow={'▼'}
                title={title}
                options={() => composer.renderMenuSelectCommand()}
            >{param}</ASUIButtonDropDown>
        </ASUIForm>
    }

    renderFrequencyForm(i, param, header="Frequency", title="Select Frequency") {
        const composer = this.props.composer;
        return <ASUIForm key={i} header={header}>
            <ASUIButtonDropDown
                arrow={'▼'}
                title={title}
                options={() => composer.renderMenuSelectCommand()}
            >{param}</ASUIButtonDropDown>
        </ASUIForm>

    }

    renderDurationForm(i, param, header, title) {
        const composer = this.props.composer;

        const durationString = param === null ? 'N/A'
            : composer.values.formatSongDuration(param);

        return <ASUIForm key={i} header={header}>
            <ASUIButtonDropDown
                arrow={'▼'}
                options={() => composer.renderMenuEditSetDuration()}
                title={title}
            >{durationString}</ASUIButtonDropDown>
        </ASUIForm>
    }


    renderVelocityForm(i, param, header="Velocity", title="Instruction Velocity") {
        const composer = this.props.composer;

        return <ASUIForm key={i} header={header}>
            <ASUIInputRange
                // className="velocity"
                onChange={(newVelocity) => composer.instructionReplaceVelocityPrompt(null, null, newVelocity, false)}
                value={param || 0}
                min={1}
                max={127}
                // ref={ref => this.fieldProgramVelocity = ref}
                title={title}
                // disabled={selectedIndices.length === 0}
            />
        </ASUIForm>;
    }

    /** Track Args **/

    renderTrackNameForm(i, param, header="Track Name", title="Select Track") {
        const composer = this.props.composer;
        return <ASUIForm key={i} header={header}>
            <ASUIButtonDropDown
                arrow={'▼'}
                title={title}
                options={() => composer.renderMenuSelectCommand()}
            >{param}</ASUIButtonDropDown>
        </ASUIForm>
    }

    /** Unknown ArgType **/

    renderUnknownArg(i, param) {
        const composer = this.props.composer;
        return <ASUIForm key={i} header={`Arg ${i}`}>
            <ASUIButton
                onAction={() => composer.renderMenuEditSetDuration()}
                title={`Instruction Argument ${i}`}
                // disabled={selectedIndices.length === 0}
            >{param}</ASUIButton>
        </ASUIForm>
    }
}
