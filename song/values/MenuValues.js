import Values from "./Values";
import {MenuAction, MenuBreak, MenuDropDown} from "../../components/menu";
import {InputRange} from "../../components";
import ProgramLoader from "../program/ProgramLoader";
import React from "react";

export default class MenuValues {

    renderMenuSelectCommand(onSelectValue, keyboardOctave=null) {
        return (<>
            <MenuDropDown options={() => this.renderMenuSelectCommandByFrequency(onSelectValue, keyboardOctave)}           >By Frequency</MenuDropDown>
            <MenuDropDown options={() => this.renderMenuSelectCommandByOctave(onSelectValue, keyboardOctave)}              >By Octave</MenuDropDown>
            <MenuBreak />
            <MenuDropDown disabled options={() => this.renderMenuSelectCommandByNamed(onSelectValue)}               >By Alias</MenuDropDown>
            <MenuDropDown disabled options={() => this.renderMenuSelectCommandByTrack(onSelectValue)}               >By Group</MenuDropDown>
            <MenuAction onAction={async e => onSelectValue(await this.openPromptDialog("Insert custom command"))}      >Custom Command</MenuAction>
        </>);

    }


    // renderMenuSelectCommandByCurrentOctave(onSelectValue, octave=null) {
    //     octave = octave !== null ? octave : this.state.keyboardOctave;
    //     return new Values().getNoteFrequencies((noteName) =>
    //         <MenuAction key={noteName} onAction={e => onSelectValue(`${noteName}${octave}`)}     >{noteName}{octave}</MenuAction>
    //     );
    // }


    renderMenuSelectCommandByFrequency(onSelectValue, keyboardOctave=null) {
        return new Values().getNoteFrequencies((noteName) =>
            <MenuDropDown key={noteName} options={() => this.renderMenuSelectCommandByFrequencyOctave(onSelectValue, noteName, keyboardOctave)}>
                {noteName}
            </MenuDropDown>
        );
    }

    // TODO: move into lower menu?
    renderMenuSelectCommandByFrequencyOctave(onSelectValue, noteName, keyboardOctave=null) {
        return (<>
            {keyboardOctave !== null ? <MenuAction onAction={() => onSelectValue(noteName+''+keyboardOctave)}>{noteName+''+keyboardOctave} (Current)</MenuAction> : null}
            {new Values().getNoteOctaves((octave) =>
                <MenuAction key={octave} onAction={() => onSelectValue(noteName+''+octave)}>
                    {noteName+''+octave}
                </MenuAction>
            )}
        </>)
    }

    renderMenuSelectCommandByOctave(onSelectValue, keyboardOctave=null) {
        return (<>
            {keyboardOctave !== null ? <MenuDropDown key={keyboardOctave} options={() => this.renderMenuSelectCommandByOctaveFrequency(onSelectValue, keyboardOctave)}>
                {keyboardOctave} (Current)
            </MenuDropDown> : null}
            {new Values().getNoteOctaves((octave) =>
                <MenuDropDown key={octave} options={() => this.renderMenuSelectCommandByOctaveFrequency(onSelectValue, octave)}>
                    {octave}
                </MenuDropDown>
            )}
        </>)
    }

    renderMenuSelectCommandByOctaveFrequency(onSelectValue, octave) {
        return new Values().getNoteFrequencies((noteName) =>
            <MenuAction key={noteName} onAction={() => onSelectValue(noteName+''+octave)}     >{noteName+''+octave}</MenuAction>
        );
    }


    renderMenuSelectDuration(onSelectValue, currentDuration, timeDivision) {
        return (<>
            <MenuDropDown disabled options={() => renderMenuSelect('recent')}    >Recent</MenuDropDown>
            <MenuBreak />
            <MenuDropDown options={() => renderMenuSelect('fraction')}  >Fraction</MenuDropDown>
            <MenuDropDown options={() => renderMenuSelect('triplet')}   >Triplet</MenuDropDown>
            <MenuDropDown options={() => renderMenuSelect('dotted')}    >Dotted</MenuDropDown>
            <MenuBreak />
            <MenuDropDown disabled options={() => renderMenuSelect('custom')}    >Custom</MenuDropDown>
        </>);

        function renderMenuSelect(key) {
            let results = [];
            switch(key) {
                case 'fraction':
                    for (let i = 64; i > 1; i /= 2)
                        results.push(
                            <MenuAction key={`${i}a`} onAction={() => onSelectValue(1 / i * timeDivision, `1/${i}B`)}  >{`1/${i}B`}</MenuAction>
                        );
                    for (let i = 1; i <= 16; i++)
                        results.push(
                            <MenuAction key={`${i}b`} onAction={() => onSelectValue(i * timeDivision, i + 'B')}  >{i + 'B'}</MenuAction>
                        );
                    break;

                case 'triplet':
                    for (let i = 64; i > 1; i /= 2)
                        results.push(
                            <MenuAction key={`${i}a`} onAction={() => onSelectValue(1 / (i / 1.5) * timeDivision, `1/${i}T`)}  >{`1/${i}T`}</MenuAction>
                        );
                    for (let i = 1; i <= 16; i++)
                        results.push(
                            <MenuAction key={`${i}b`} onAction={() => onSelectValue((i / 1.5) * timeDivision, i + 'T')}  >{i + 'T'}</MenuAction>
                        );
                    break;

                case 'dotted':
                    for (let i = 64; i > 1; i /= 2)
                        results.push(
                            <MenuAction key={`${i}a`} onAction={() => onSelectValue(1 / (i * 1.5) * timeDivision, `1/${i}D`)}  >{`1/${i}D`}</MenuAction>
                        );
                    for (let i = 1; i <= 16; i++)
                        results.push(
                            <MenuAction key={`${i}b`} onAction={() => onSelectValue((i * 1.5) * timeDivision, i + 'D')}  >{i + 'D'}</MenuAction>
                        );
                    break;

                default:
                    throw new Error("Unknown key");
            }
            return results;
        }
    }

    renderMenuSelectVelocity(onSelectValue, currentVelocity=null) {
        const customAction = async () => {
            const velocity = await this.openPromptDialog("Enter custom velocity (1-127)", 127);
            onSelectValue(velocity);
        };
        return (<>
            <MenuAction onAction={()=>{}} disabled>Set Velocity</MenuAction>
            <InputRange
                min={0}
                max={127}
                value={currentVelocity}
                onChange={(e, mixerValue) => onSelectValue(mixerValue)}
            />
            <MenuBreak/>
            {new Values().getNoteVelocities((velocity) =>
                <MenuAction key={velocity} onAction={() => onSelectValue(velocity)}  >{velocity}</MenuAction>)}
            <MenuAction onAction={customAction} hasBreak >Custom</MenuAction>
        </>);
    }

    /** @deprecated moved to Library **/
    renderMenuSelectAvailableProgram(onSelectValue, menuTitle=null) {
        return (<>
            {menuTitle ? <><MenuAction disabled onAction={() => {}}>{menuTitle}</MenuAction><MenuBreak/></> : null}
            {ProgramLoader.getRegisteredPrograms().map((config, i) =>
                <MenuAction key={i} onAction={() => onSelectValue(config.className)}       >{config.title}</MenuAction>
            )}
        </>);
    }


    /** Prompt **/

    async openPromptDialog(message, defaultValue='') {
        return window.prompt(message, defaultValue);
    }

    async openConfirmDialog(message) {
        return window.confirm(message);
    }
}
