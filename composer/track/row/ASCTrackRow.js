import * as React from "react";
import ASCTrackPosition from "../position/ASCTrackPosition";
import ASCTrackInstructionAdd from "../instruction/ASCTrackInstructionAdd";
import ASCTrackDelta from "../delta/ASCTrackDelta";
import ASCTrackRowBase from "./ASCTrackRowBase";

import "./ASCTrackRow.css";

class ASCTrackRow extends ASCTrackRowBase {
    constructor(props) {
        super(props);
        this.cb.onMouseDown = (e) => this.onMouseDown(e);
    }

    render() {
        let className = "asct-row";
        if (this.props.highlight)
            className += ' ' + (this.props.highlight||[]).join(' '); // ' highlight';
        const composer = this.getComposer();
        const rowDeltaDuration = composer.state.showTrackRowDurationInTicks ? this.props.deltaDuration : composer.values.formatDuration(this.props.deltaDuration);
        const rowPosition = composer.state.showTrackRowPositionInTicks ? this.props.positionTicks : composer.values.formatDurationAsDecimal(this.props.positionTicks);
        return (
            <div
                // tabIndex={0}
                className={className}
                // onClick={this.cb.onMouseInput}
                onMouseDown={this.cb.onMouseDown}
                // onContextMenu={this.cb.onContextMenu}
                // onKeyDown={this.cb.onKeyDown}
            >
                <ASCTrackPosition position={rowPosition}/>
                {this.props.children}
                {this.props.cursor ? <ASCTrackInstructionAdd // TODO: render on hover
                    cursorPosition={this.props.cursorPosition}
                /> : null}
                <ASCTrackDelta duration={rowDeltaDuration}/>
                {/*{this.state.menuOpen ? <ASUIDropDownContainer*/}
                {/*    clientPosition={this.state.clientPosition}*/}
                {/*    // ref={this.dropdown}*/}
                {/*    options={() => this.renderRowMenu()}*/}
                {/*    onClose={() => this.closeDropDownMenu()}*/}
                {/*    vertical={true}*/}
                {/*/> : null}*/}
            </div>
        )
    }


    /** User Input **/


    onMouseDown(e) {
        if (e.defaultPrevented)
            return;
        e.preventDefault();
        // console.log('ASCTrackRow.onMouseDown', e);
        this.selectRow();
    }

    // onContextMenu(e) {
    //     if (e.defaultPrevented || e.shiftKey)
    //         return;
    //     e.preventDefault();
    //     this.toggleMenu(e);
    // }
    //
    // onKeyDown(e) {
    //     if (e.isDefaultPrevented())
    //         return;
    //     switch (e.key) {
    //         case 'ContextMenu':
    //             e.preventDefault();
    //             this.toggleMenu();
    //             break;
    //
    //         default:
    //             break;
    //     }
    // }

}

export default ASCTrackRow;
