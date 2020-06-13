import * as React from "react";
import ASCTrackBase from "./ASCTrackBase";

import "./ASCTrack.css";
import {ASUIDropDownContainer} from "../../components/menu";
import ASCTrackRowContainer from "./row-container/ASCTrackRowContainer";

export default class ASCTrack extends ASCTrackBase {
    constructor(props) {
        super(props);
        this.container = React.createRef();
        // this.state.clientPosition = null;
        // this.cb.onContextMenu = e => this.onContextMenu(e);

    }

    // componentDidMount() {
    //     console.log(this.container.current, this.props);
    //     if(this.container.current)
    //         this.container.current.addEventListener('wheel', this.cb.onWheel, { passive: false });
    // }
    //
    // componentWillUnmount() {
    //     if(this.container.current)
    //         this.container.current.removeEventListener('wheel', this.cb.onWheel);
    // }


    /** User Input **/

    // onWheel(e) {
    //     e.preventDefault();
    //     let rowOffset = parseInt(this.state.rowOffset) || 0; // this.getTrackState().rowOffset;
    //     rowOffset += e.deltaY > 0 ? 1 : -1;
    //     if(rowOffset < 0)
    //         rowOffset = 0; // return console.log("Unable to scroll past beginning");
    //
    //     this.setRowOffset(rowOffset);
    //     // console.log('onWheel', e.deltaY);
    //     // this.getComposer().trackerSetRowOffset(this.getTrackName(), newRowOffset)
    //     // this.getComposer().trackerUpdateSegmentInfo(this.getTrackName());
    //     // this.getTrackInfo().changeRowOffset(this.getTrackName(), newRowOffset);
    // }
    //
    // toggleDropDownMenu(e) {
    //     // console.log(e);
    //     const state = {menuOpen: !this.state.menuOpen, clientPosition: null};
    //     if(e)
    //         state.clientPosition = [e.clientX, e.clientY];
    //     this.setState(state);
    // }

    /** Render **/

    render() {
        // console.log('ASCTrack.render');
        let className = "asc-track";
        // if(this.props.className)
        //     className += ' ' + this.props.className;
        if(this.props.selected)
            className += ' selected';
        return (
            <div
                className={className}
                >
                <div className="header">
                    {this.getTrackName()}
                </div>
                {this.renderContent()}

            </div>
        );
    }

    renderContent() {
        if(this.props.collapsed) {
            return (
                <div className="buttons-select-track">
                    {this.renderSelectTrackButton()}
                </div>
            )
        }
        return [
            <div
                key="buttons"
                className="buttons">
                <div className="segments">
                    {this.renderRowSegments()}
                </div>
                <div className="options">
                    {this.renderRowOptions()}
                    {this.renderQuantizationButton()}
                </div>
            </div>,
            <ASCTrackRowContainer
                track={this}
                />
        ]
    }

    /** Menu **/

    onContextMenu(e) {
        if(e.defaultPrevented || e.altKey)
            return;
        e.preventDefault();
        this.toggleDropDownMenu(e);
    }


    renderContextMenu() {
        // const selectedIndices = this.getTracker().getSelectedIndices();
        return this.getComposer().renderMenuEdit();
    }

}

