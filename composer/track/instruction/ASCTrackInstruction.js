import * as React from "react";
import ASCTrackInstructionBase from "./ASCTrackInstructionBase";

import "./ASCTrackInstruction.css";
import {ASUIDropDownContainer} from "../../../components/menu";

export default class ASCTrackInstruction extends ASCTrackInstructionBase {
    constructor(props) {
        super(props);

        this.dropdown = React.createRef();
        this.cb = {
            // onContextMenu: (e) => this.onContextMenu(e),
            // onKeyDown: (e) => this.onKeyDown(e),
            onMouseDown: e => this.onMouseDown(e),
            onClick: e => this.onClick(e),
            onContextMenu: e => this.onContextMenu(e),
            options: () => this.renderMenuEditSet()
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

        const instruction = this.props.instruction;
        const open = this.isOpen();
        return <div
            ref={input => this.props.cursor && this.getTracker().props.selected && input && input.focus()}
            tabIndex={0}
            className={className}
            onKeyDown={this.cb.onKeyDown}
            onContextMenu={this.cb.onContextMenu}
            // onMouseDown={this.cb.onMouseInput} // TODO: fix inputs
            >
            <div
                className="command"
                onMouseDown={this.cb.onMouseDown}
                >
                {instruction.command}
            </div>
            <ASUIDropDownContainer
                ref={this.dropdown}
                options={this.cb.options}
                vertical={true}
            />
            {open ? this.renderParameters() : null}
        </div>;
    }

    /** User Input **/

    onClick(e) {
        console.log(e.type);
        if(e.defaultPrevented)
            return;

        if(e.button === 2) {
            e.preventDefault();
            e.stopPropagation();
            this.toggleDropDownMenu();
        }
    }

    onContextMenu(e) {
        if(e.defaultPrevented || e.altKey)
            return;
        e.preventDefault();

        this.selectInstructionWithAction(!e.ctrlKey);
        this.toggleDropDownMenu();
    }

    onMouseDown(e) {
//         console.log(e.ctrlKey);
        if(e.defaultPrevented)
            return;
        e.preventDefault();

        this.selectInstructionWithAction(!e.ctrlKey);
    }

    /** Actions **/

    toggleDropDownMenu() {
        this.dropdown.current.toggleMenu();
    }


}
