import * as React from "react";
import ASCTrackInstructionBase from "./ASCTrackInstructionBase";

import "./ASCTrackInstruction.css";

export default class ASCTrackInstruction extends ASCTrackInstructionBase {
    constructor(props) {
        super(props);

        // this.dropdown = React.createRef();
        this.cb = {
            // onContextMenu: (e) => this.onContextMenu(e),
            // onKeyDown: (e) => this.onKeyDown(e),
            onMouseUp: e => this.onMouseUp(e),
            onMouseDown: e => this.onMouseDown(e),
            onClick: e => this.onClick(e),
            // onContextMenu: e => this.onContextMenu(e),
            // options: () => this.renderMenuEditSet()
        };
        this.timeout = {
            mouseDown: null
        }
    }

    isOpen() { return this.props.cursor || this.props.selected || this.props.playing; }
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
            // ref={input => this.props.cursor && this.getTrack().props.selected && input && input.focus()}
            // tabIndex={0}
            className={className}
            onKeyDown={this.cb.onKeyDown}
            // onClick={this.cb.onClick}
            onMouseUp={this.cb.onMouseUp}
            onMouseDown={this.cb.onMouseDown}
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
        // if(param === null)
        //     return null;
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

        this.selectInstruction(!e.ctrlKey);
        // if(e.shiftKey)
        //     this.playInstruction();
    }


    onMouseUp(e) {
        clearTimeout(this.timeout.mouseDown);
    }

    onMouseDown(e) {
        if(e.defaultPrevented)
            return;
        e.preventDefault();

        // const newEvent = {
        //     ctrlKey: e.ctrlKey,
        //     clientX: e.clientX,
        //     clientY: e.clientY,
        // }
        // console.log(e.type, e.button);
        if(e.button === 2) {
            this.selectInstruction(!e.ctrlKey, true, false);
            // this.getTrack().toggleDropDownMenu(newEvent); // Handled by Row Container onContextMenu

        } else {
            this.selectInstruction(!e.ctrlKey, e.shiftKey ? null : true);
            //
            // this.timeout.mouseDown = setTimeout(() => {
            //     this.getTrack().toggleDropDownMenu(newEvent);
            // }, ASCTrackInstructionBase.TIMEOUT_LONGPRESS)
        }
        // if(e.shiftKey)
        //     this.playInstruction();

    }

    // onContextMenu(e) {
    //     if(e.defaultPrevented || e.altKey)
    //         return;
    //     e.preventDefault();
    //
    //     clearTimeout(this.timeout.mouseDown);
    //     const selectedIndices = this.getTrack().getTrackState().getSelectedIndices();
    //     if(selectedIndices.indexOf(this.props.index) === -1)
    //         this.selectInstruction(!e.ctrlKey, null, false);
    //     // if(e.shiftKey)
    //     //     this.playInstruction();
    //     this.getTrack().openContextMenu(e);
    // }



}
