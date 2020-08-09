import * as React from "react";

import {ASUIContextMenu} from "../../../components";
import ASCTrackRowContainerBase from "./ASCTrackRowContainerBase";
import "./ASCTrackRowContainer.css";

export default class ASCTrackRowContainer extends ASCTrackRowContainerBase {
    constructor(props) {
        super(props);
        this.state.clientPosition = null;
        this.cb.onContextMenu = e => this.onContextMenu(e);
        this.cb.onWheel = e => this.onWheel(e);
        this.ref = {
            container: {current: null}
        };
    }

    focus() {
        const container = this.ref.container.current;
        if(container !== document.activeElement) {
            container.focus({ preventScroll: true });
            // console.log('ASCTrackRowContainer.focus()', container)
        }
    }

    render() {
        return <div
                key="row-container"
                className="row-container"
                ref={elm => {
                    elm && elm.addEventListener('wheel', this.cb.onWheel, {passive: false});
                    this.ref.container.current = elm;
                }}
                tabIndex={0}
                onKeyDown={this.cb.onKeyDown}
                onContextMenu={this.cb.onContextMenu}
                // onWheel={this.cb.onWheel}
            >
                {this.renderRowContent()}
                {this.state.menuOpen ? <ASUIContextMenu
                    clientPosition={this.state.clientPosition}
                    key="dropdown"
                    ref={this.dropdown}
                    options={this.cb.options}
                    vertical={true}
                    onClose={e => this.toggleDropDownMenu(e)}
                /> : null}
            </div>
    }


    /** User Input **/

    onWheel(e) {
        e.preventDefault();
        let rowOffset = parseInt(this.getTrack().getRowOffset()) || 0; // this.getTrackState().rowOffset;
        rowOffset += e.deltaY > 0 ? 1 : -1;
        if(rowOffset < 0)
            rowOffset = 0; // return console.log("Unable to scroll past beginning");

        this.getTrack().setRowOffset(rowOffset);
        // console.log('onWheel', e.deltaY);
        // this.getComposer().trackerSetRowOffset(this.getTrackName(), newRowOffset)
        // this.getComposer().trackerUpdateSegmentInfo(this.getTrackName());
        // this.getTrackInfo().changeRowOffset(this.getTrackName(), newRowOffset);
    }

}

