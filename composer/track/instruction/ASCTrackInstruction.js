import * as React from "react";
import ASCTrackInstructionBase from "./ASCTrackInstructionBase";

import "./ASCTrackInstruction.css";

export default class ASCTrackInstruction extends ASCTrackInstructionBase {
    constructor(props) {
        super(props);

        this.cb = {
            // onContextMenu: (e) => this.onContextMenu(e),
            // onKeyDown: (e) => this.onKeyDown(e),
            onMouseInput: e => this.onMouseInput(e),
        };
        this.commandParam = React.createRef();
    }

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

        const parameters = this.renderParameters();
        return <div
            ref={input => this.props.cursor && this.getTracker().props.selected && input && input.focus()}
            tabIndex={0}
            className={className}
            onKeyDown={this.cb.onKeyDown}
            // onClick={this.cb.onMouseInput}
            // onMouseDown={this.cb.onMouseInput} // TODO: fix inputs
            >
            {parameters}
        </div>;
    }

}
