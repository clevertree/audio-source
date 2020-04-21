import * as React from "react";
import PropTypes from "prop-types";
import TrackerDelta from "./TrackerDelta";
import TrackerInstructionAdd from "./TrackerInstructionAdd";

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
        cursorPosition: PropTypes.number.isRequired // TODO: inefficient?
    };

    getTracker() { return this.props.tracker; }
    getComposer() { return this.getTracker().getComposer(); }

    render() {
        const composer = this.props.tracker.getComposer();
        const rowDeltaDuration = composer.values.formatSongDuration(this.props.deltaDuration);
        return (
            <div
                ref={input => this.props.cursor && this.getTracker().props.selected && input && input.focus()}
                tabIndex={0}
                className="asct-row"
                // onClick={this.cb.onMouseInput}
                onMouseDown={this.cb.onMouseInput}
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
            </div>
        )
    }

    toggleMenu()    { return this.dropdown.current.toggleMenu(); }

    async selectRow(clearSelection=true) {
        // const selectedIndices = clearSelection ? [] : null;
        await this.getTracker().setCursorOffset(this.props.cursorPosition, clearSelection ? [] : null);
    }


    /** User Input **/

    onMouseInput(e) {
        if(e.defaultPrevented)
            return;
        e.preventDefault();
        // console.log(e.type, e.button);

        switch(e.type) {
            case 'mousedown':
            case 'click':
                if(e.button === 0)
                    this.selectRow(!e.ctrlKey);
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
        if(e.isDefaultPrevented())
            return;
        switch(e.key) {
            case 'ContextMenu':
                e.preventDefault();
                this.toggleMenu();
                break;

            default:
                break;
        }
    }

    onMouseEnter(e) {
        this.toggleMenu();
    }

}

export default TrackerRow;
