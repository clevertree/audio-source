import * as React from "react";
import PropTypes from "prop-types";
import TrackerDelta from "./TrackerDelta";
import TrackerInstructionAdd from "./TrackerInstructionAdd";

import Div from "../../components/div/Div";
import TrackerPosition from "./TrackerPosition";

import "./assets/TrackerRow.css";
import DropDownContainer from "../../components/menu/DropDownContainer";

class TrackerRow extends React.Component {
    constructor(props) {
        super(props);
        this.dropdown = React.createRef();
        this.cb = {
            onContextMenu: (e) => this.onContextMenu(e),
            onKeyDown: (e) => this.onKeyDown(e),
            onMouseInput: e => this.onMouseInput(e),
        };
    }

    /** Default Properties **/
    static defaultProps = {
        // cursor: true
    };

    /** Property validation **/
    static propTypes = {
        positionTicks: PropTypes.number.isRequired,
        deltaDuration: PropTypes.number.isRequired,
        tracker: PropTypes.any.isRequired,
        cursor: PropTypes.bool.isRequired,
        cursorPosition: PropTypes.number.isRequired // TODO: inefficient
    };

    getTracker() { return this.props.tracker; }
    getComposer() { return this.getTracker().getComposer(); }

    render() {
        const composer = this.props.tracker.getComposer();
        const rowDeltaDuration = composer.values.formatDuration(this.props.deltaDuration);
        return (
            <Div
                className="asct-row"
                onClick={this.cb.onMouseInput}
                // onMouseDown={this.cb.onMouseInput}
                onKeyDown={this.cb.onKeyDown}
                >
                <TrackerPosition positionTicks={this.props.positionTicks} />
                {this.props.children}
                {this.props.cursor ? <TrackerInstructionAdd
                    cursorPosition={this.props.cursorPosition}
                    /> : null}
                <TrackerDelta duration={rowDeltaDuration} />
                <DropDownContainer
                    ref={this.dropdown}
                    options={this.props.options}
                    vertical={this.props.vertical}
                />
            </Div>
        )
    }

    toggleMenu()    { return this.dropdown.current.toggleMenu(); }

    selectRow(clearSelection=true) {
        const selectedIndices = clearSelection ? [] : null;
        this.getTracker().selectIndices(selectedIndices, this.props.cursorPosition);
    }


    /** User Input **/

    onMouseInput(e) {
        if(e.defaultPrevented)
            return;
        e.preventDefault();

        switch(e.type) {
            case 'mousedown':
                console.log(e.type);
                break;
            case 'click':
                if(e.button === 0)
                    this.selectRow(e.shiftKey);
                else if(e.button === 1)
                    throw new Error("Unimplemented middle button");
                else if(e.button === 2)
                    this.toggleMenu();
                else
                    throw new Error("Unknown mouse button");

                break;
            default:
                throw new Error("Unknown Mouse event: " + e.type);
        }
    }

    onContextMenu(e) {
        if(e.defaultPrevented || e.shiftKey)
            return;
        e.preventDefault();
        this.toggleMenu();
    }

    onKeyDown(e) {
        console.log("TODO", e.key);
        switch(e.key) {
            // case 'Delete':
            //     break;
            //
            // case 'Escape':
            // case 'Backspace':
            //     throw new Error("TODO: navigate pop");
            //
            // case 'Enter':
            //     break;
            //
            // case 'Play':
            //     break;
            //
            case 'ArrowRight':
                this.getTracker().selectIndices(null, this.getTracker().getCursorOffset() + 1);
                break;
            case 'ArrowLeft':
                this.getTracker().selectIndices(null, this.getTracker().getCursorOffset() - 1);
                break;
            //
            // case 'ArrowDown':
            //     break;
            //
            // case 'ArrowUp':
            //     break;
            //
            // case ' ':
            //     break;
            //
            // case 'PlayFrequency':
            //     break;

            case 'ContextMenu':
                this.toggleMenu();
                break;

            default:
                console.info("Unhandled key: ", e.key);
        }
    }

    onMouseEnter(e) {
        this.toggleMenu();
    }

}

export default TrackerRow;
