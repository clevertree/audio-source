import * as React from "react";
import PropTypes from 'prop-types';

import {TrackerInstruction, TrackerRow, TrackInfo} from "./";
import {Button, ButtonDropDown, Panel} from "../../components/";

import "./assets/Tracker.css";

class Tracker extends React.Component {
    /** Default Properties **/
    static defaultProps = {
        cursorOffset: 4,
        selectedIndices: [],
        rowOffset: 0,
        rowLength: 16,
        quantizationTicks: null,
        destinationList: []
    };

    /** Property validation **/
    static propTypes = {
        composer: PropTypes.object.isRequired
        // destination: PropTypes.object.isRequired
        // tracker: PropTypes.any.isRequired,
    };

    constructor(props) {
        super(props);

        if(!props.composer)
            throw new Error("Invalid composer");
        // if(!props.destination)
        //     throw new Error("Invalid track destination");
        // this.state = this.props.composer.state;
        this.cb = {
            onKeyDown: (e) => this.onKeyDown(e),
            onWheel: e => this.onWheel(e)
        };
        this.container = React.createRef();
        this.destination = null;
        this.cursorInstruction = React.createRef();
    }

    componentDidMount() {
        this.container.current.addEventListener('wheel', this.cb.onWheel, { passive: false });
    }

    componentWillUnmount() {
        this.container.current.removeEventListener('wheel', this.cb.onWheel);
    }

    getTrackInfo() {
        return new TrackInfo(this.props.trackName, this.props.composer);
    }

    /** TODO: calculate correct destination **/
    getDestination()            {
        if(this.destination)
            return this.destination;
        console.warn('TODO: calculate correct destination');
        return this.destination = this.getComposer().getVolumeGain();
    }
    getDestinationList()        { return this.props.destinationList; }
    getComposer()               { return this.props.composer; }
    getSong()                   { return this.props.composer.song; }
    getTrackName()              { return this.props.trackName; }
    getSelectedIndices()        { return this.props.selectedIndices; }
    getCursorOffset()           { return this.props.cursorOffset; }

    getQuantizationInTicks() {
        return this.props.quantizationTicks || this.props.composer.song.data.timeDivision;
    }

    getSegmentInfo() {
        const rowLength = this.props.rowLength;
        const rowOffset = this.props.rowOffset;

        const currentSegmentID = Math.floor(rowOffset / rowLength);
        let segmentCount = 3;
        if(currentSegmentID >= segmentCount)
            segmentCount = currentSegmentID + 1;
        return {segmentCount, currentSegmentID};
    }

    // TODO: move to TrackerActions
    findRowCursorOffset() {
        return this.getTrackInfo().findRowCursorOffset();
    }

    findInstructionIndexFromCursorOffset(cursorOffset) {
        let indexFound = null;
        this.eachRow(() => {
            return indexFound === null;

        }, (instruction, cursorPosition) => {
            if(cursorPosition > cursorOffset)
                return false;
            if(cursorPosition === cursorOffset)
                indexFound = instruction.index; // @Depreciated
            return indexFound === null;
        });
        return indexFound;
    }

    /** Actions **/

    setCursorOffset(cursorOffset) {
        const selectedIndices = [this.findInstructionIndexFromCursorOffset(cursorOffset)];
        return this.selectIndices(selectedIndices, cursorOffset);
    }

    selectIndices(selectedIndices=null, cursorOffset=null, rowOffset=null) {
        return this.getTrackInfo().selectIndices(selectedIndices, cursorOffset, rowOffset);
    }

    /** Render **/

    render() {
        console.log('Tracker.render');
        let className = "asc-tracker";
        // if(this.props.className)
        //     className += ' ' + this.props.className;
        if(this.props.selected)
            className += ' selected';
        return (
            <Panel
                className={className}
                header={this.getTrackName()}
                title={`Track: ${this.getTrackName()}`}
                >
                <div
                    className="asct-segments"
                    children={this.renderRowSegments()}
                    />
                <div
                    className="asct-container"
                    ref={this.container}
                    tabIndex={0}
                    onKeyDown={this.cb.onKeyDown}
                    // onWheel={this.cb.onWheel}
                    >
                    {this.renderRowContent()}
                </div>
                <div
                    className="asct-options"
                    children={this.renderRowOptions()}
                />
            </Panel>
        );
    }

    renderRowSegments() {
        const composer = this.props.composer;
        const {segmentCount, currentSegmentID} = this.getSegmentInfo();
        const rowLength = this.props.rowLength;

        const buttons = [];

        for (let segmentID = 0; segmentID <= segmentCount; segmentID++)
            buttons.push(<Button
                key={segmentID}
                selected={segmentID === currentSegmentID}
                onAction={e => composer.trackerChangeRowOffset(this.props.trackName, segmentID * rowLength)}
            >{segmentID}</Button>);

        buttons.push(<ButtonDropDown
            className="row-length"
            title={`Segment Length (${this.props.rowLength} Rows)`}
            arrow="▼"
            key="row-length"
            onClick={e => this.getTrackInfo().setActive()}
            options={() => this.getComposer().renderMenuTrackerSetSegmentLength(this.getTrackName())}
        >{this.props.rowLength}</ButtonDropDown>);

        return buttons;
    }


    renderRowOptions() {
        const composer = this.props.composer;
        const rowDeltaDuration = composer.values.formatDuration(this.getQuantizationInTicks());

        const buttons = [];

        buttons.push(<ButtonDropDown
            className="row-quantization"
            title={`Quantization (Duration = ${rowDeltaDuration})`}
            arrow="▼"
            key="row-quantization"
            onClick={e => this.getTrackInfo().setActive()}
            options={() => this.getComposer().renderMenuTrackerSetQuantization(this.getTrackName())}
        >{rowDeltaDuration}</ButtonDropDown>);


        return buttons;
    }


    renderRowContent() {
        // console.time('tracker.renderRowContent()');
        const rowOffset = this.props.rowOffset;
        const rowLength = this.props.rowLength;
        const cursorOffset = this.props.cursorOffset || 0;

        const rowContent = [];


        this.eachRow((rowCount, currentRowPositionTicks, toPositionTicks, cursorPositionCount, instructionList) => {
            const rowInstructionElms = [];
            for(let i=0; i<instructionList.length; i++) {
                const props = instructionList[i];
                if(props.cursor) {
                    props.ref = this.cursorInstruction;
                }
                rowInstructionElms.push(<TrackerInstruction
                    key={props.index}
                    tracker={this}
                    {...props}
                />);
            }


            let rowDeltaDuration = toPositionTicks - currentRowPositionTicks;
            if (rowCount >= rowOffset
                && rowContent.length < rowLength
            ) {
                const newRowElm = <TrackerRow
                    key={rowCount}
                    cursor={cursorPositionCount === cursorOffset}
                    tracker={this}
                    positionTicks={currentRowPositionTicks}
                    deltaDuration={rowDeltaDuration}
                    cursorPosition={cursorPositionCount} // TODO: inefficient?
                >{rowInstructionElms}</TrackerRow>;
                rowContent.push(newRowElm);
            }

            // Continue rendering rows until we've reached rowLength
            return rowContent.length < rowLength;
        });


        // console.timeEnd('tracker.renderRowContent()');
        return rowContent;
    }

    /** Playback **/

    // playSelectedInstructions() {
    //     return this.getTrackInfo().playInstructions(this.getDestination(), this.getSelectedIndices());
    // }
    playInstructions(selectedInstructions) {
        return this.getTrackInfo().playInstructions(this.getDestination(), selectedInstructions);
    }

    /** Row Iterator **/

    eachRow(rowCallback, instructionCallback=null) {
        return this.getTrackInfo().eachRow(rowCallback, instructionCallback=null);
    }


    /** User Input **/

    onWheel(e) {
        e.preventDefault();
        let rowOffset = this.props.rowOffset;
        rowOffset += e.deltaY > 0 ? 1 : -1;
        if(rowOffset < 0)
            rowOffset = 0; // return console.log("Unable to scroll past beginning");
        this.getTrackInfo().changeRowOffset(this.getTrackName(), rowOffset);
    }

    onKeyDown(e) {
        if(e.isDefaultPrevented())
            return;
        switch(e.key) {
            // case 'Delete':
            //     break;
            //
            // case 'Escape':
            // case 'Backspace':
            //     break;
            //
            // case 'Enter':
            //     break;
            //
            // case 'Play':
            //     break;
            //
            case 'ArrowRight':
                e.preventDefault();
                this.setCursorOffset(this.getCursorOffset() + 1);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.setCursorOffset(this.getCursorOffset() - 1);
                break;


            case 'ArrowUp':
                e.preventDefault();
                const {previousRowOffset} = this.findRowCursorOffset();
                this.setCursorOffset(previousRowOffset);
                break;

            case 'ArrowDown':
                e.preventDefault();
                const {nextRowOffset} = this.findRowCursorOffset();
                this.setCursorOffset(nextRowOffset);
                break;
            //
            // case ' ':
            //     break;
            //
            // case 'PlayFrequency':
            //     break;

            case 'ContextMenu':
                e.preventDefault();
                this.cursorInstruction.current.toggleMenu();
                break;

            default:
                console.info("Unhandled key: ", e.key);
                break;
        }
    }


    // renderOptions() {
    //     return <>
    //         <Form className="tracker-row-length" title="Row &#120491;">
    //             <Button
    //                 arrow={'▼'}
    //                 // className="tracker-row-length"
    //                 onAction={e => this.openMenuTrackerSetQuantization(e)}
    //             >1B</Button>
    //         </Form>
    //
    //         <Form className="tracker-segment-length" title="Seg &#120491;">
    //             <Button
    //                 arrow={'▼'}
    //                 // className="tracker-segment-length"
    //                 onAction={e => this.openMenuTrackerSetSegmentLength(e)}
    //                 title="Select Tracker Segment Length"
    //             >16B</Button>
    //         </Form>
    //     </>;
    // }

}

export default Tracker;
