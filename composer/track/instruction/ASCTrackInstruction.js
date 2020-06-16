import * as React from "react";
import ASCTrackInstructionBase from "./ASCTrackInstructionBase";
import {ASUIDropDownContainer} from "../../../components/menu";

import "./ASCTrackInstruction.css";

export default class ASCTrackInstruction extends ASCTrackInstructionBase {
    constructor(props) {
        super(props);

        // this.dropdown = React.createRef();
        this.cb = {
            // onContextMenu: (e) => this.onContextMenu(e),
            // onKeyDown: (e) => this.onKeyDown(e),
            // onMouseDown: e => this.onMouseDown(e),
            onClick: e => this.onClick(e),
            // onContextMenu: e => this.onContextMenu(e),
            // options: () => this.renderMenuEditSet()
        };
    }

    isOpen() { return this.props.cursor || this.props.selected; }
    render() {
        let className = "asct-instruction";
        // if(this.props.className)
        //     className += ' ' + this.props.className;
        if(this.props.cursor)
            className += ' cursor';
        if(this.props.selected)
            className += ' selected';
        if(this.props.playing)
            className += ' playing';

        const instructionData = this.getInstructionData();
        const open = this.isOpen();
        return <div
            ref={input => this.props.cursor && this.getTracker().props.selected && input && input.focus()}
            tabIndex={0}
            className={className}
            onKeyDown={this.cb.onKeyDown}
            onClick={this.cb.onClick}
            // onContextMenu={this.cb.onContextMenu}
            // onMouseDown={this.cb.onMouseInput} // TODO
            //  : fix inputs
            >

            {!open ? <div
                    className="asct-parameter command"
                    >
                    {instructionData[1]}
                </div>
            : this.renderParameters()}

            {/*{this.state.menuOpen ? <ASUIDropDownContainer*/}
            {/*    key="dropdown"*/}
            {/*    ref={this.dropdown}*/}
            {/*    options={this.cb.options}*/}
            {/*    vertical={true}*/}
            {/*    onClose={() => this.toggleDropDownMenu(false)}*/}
            {/*/> : null}*/}
        </div>;
    }

    renderParameter(argIndex, param, className) {
        return <div
            key={argIndex}
            className={className}
            // title={title}
            children={param}
        />
    }

    /** User Input **/

    onClick(e) {
        // console.log(e.type);
        if(e.defaultPrevented)
            return;
        e.preventDefault();

        // if(e.button === 2) {
        //     e.preventDefault();
        //     e.stopPropagation();
        //     this.toggleDropDownMenu();
        // } else {
            this.selectInstruction(!e.ctrlKey);
            if(e.shiftKey)
                this.playInstruction();
        // }
    }


    // onContextMenu(e) {
    //     if(e.defaultPrevented || e.altKey)
    //         return;
    //     e.preventDefault();
    //
    //     this.selectInstructionWithAction(!e.ctrlKey);
    //     this.toggleDropDownMenu();
    // }



}
