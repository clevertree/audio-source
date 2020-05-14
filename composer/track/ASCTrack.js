import * as React from "react";
import ASCTrackBase from "./ASCTrackBase";

import "./ASCTrack.css";

export default class ASCTrack extends ASCTrackBase {
    constructor(props) {
        super(props);
        this.container = React.createRef();
    }

    componentDidMount() {
        if(!this.props.collapsed)
            this.container.current.addEventListener('wheel', this.cb.onWheel, { passive: false });
    }

    componentWillUnmount() {
        if(!this.props.collapsed)
            this.container.current.removeEventListener('wheel', this.cb.onWheel);
    }


    /** User Input **/

    onWheel(e) {
        e.preventDefault();
        let rowOffset = this.state.rowOffset; // this.getTrackState().rowOffset;
        rowOffset += e.deltaY > 0 ? 1 : -1;
        if(rowOffset < 0)
            rowOffset = 0; // return console.log("Unable to scroll past beginning");
        this.setState({rowOffset});
        // this.getComposer().trackerSetRowOffset(this.getTrackName(), newRowOffset)
        // this.getComposer().trackerUpdateSegmentInfo(this.getTrackName());
        // this.getTrackInfo().changeRowOffset(this.getTrackName(), newRowOffset);
    }

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
            <div
                key="row-container"
                className="row-container"
                ref={this.container}
                tabIndex={0}
                onKeyDown={this.cb.onKeyDown}
                // onWheel={this.cb.onWheel}
            >
                {this.renderRowContent()}
            </div>
        ]
    }

}

