import * as React from "react";
import PropTypes from "prop-types";
import ASCTrackPosition from "../position/ASCTrackPosition";
import ASCTrackInstructionAdd from "../instruction/ASCTrackInstructionAdd";
import ASCTrackDelta from "../delta/ASCTrackDelta";
import ASUIDropDownContainer from "../../../components/menu/dropdown/ASUIDropDownContainer";
import "./ASCTrackRow.css";
import {ASUIMenuBreak, ASUIMenuDropDown, ASUIMenuItem} from "../../../components/menu";

class ASCTrackRow extends React.Component {
    constructor(props) {
        super(props);
        this.dropdown = React.createRef();
        this.cb = {
            onContextMenu: (e) => this.onContextMenu(e),
            onKeyDown: (e) => this.onKeyDown(e),
            onClick: e => this.onClick(e),
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

    getTracker() {
        return this.props.tracker;
    }

    getComposer() {
        return this.getTracker().getComposer();
    }

    render() {
        let className = "asct-row";
        if (this.props.highlight)
            className += ` ${this.props.highlight}`; // ' highlight';
        const composer = this.props.tracker.getComposer();
        const rowDeltaDuration = composer.values.formatSongDuration(this.props.deltaDuration);
        return (
            <div
                ref={input => this.props.cursor && this.getTracker().props.selected && input && input.focus()}
                tabIndex={0}
                className={className}
                // onClick={this.cb.onMouseInput}
                onClick={this.cb.onClick}
                onContextMenu={this.cb.onContextMenu}
                onKeyDown={this.cb.onKeyDown}
            >
                <ASCTrackPosition positionTicks={this.props.positionTicks}/>
                {this.props.children}
                {this.props.cursor ? <ASCTrackInstructionAdd
                    cursorPosition={this.props.cursorPosition}
                /> : null}
                <ASCTrackDelta duration={rowDeltaDuration}/>
                <ASUIDropDownContainer
                    ref={this.dropdown}
                    options={() => this.renderRowMenu()}
                    vertical={this.props.vertical}
                />
            </div>
        )
    }

    toggleMenu() {
        return this.dropdown.current.toggleMenu();
    }

    selectRow(clearSelection = true) {
        // const selectedIndices = clearSelection ? [] : null;
        const tracker = this.getTracker();
        tracker.setCursorPosition(this.props.cursorPosition, clearSelection ? [] : null);
        tracker.selectIndices([], true);
    }


    instructionInsert(command) {
        this.getComposer().instructionInsertAtPosition(
            this.getTrackName(),
            this.props.positionTicks,
            command,
        )
    }

    /** Menus **/


    renderRowMenu() {
        return (<>
            <ASUIMenuItem>Row</ASUIMenuItem>
            <ASUIMenuBreak/>
            <ASUIMenuDropDown
                options={() => this.renderRowInsertCommandMenu()}
                children="Insert new command"
            />
            <ASUIMenuDropDown
                options={() => this.renderMenuSelectDuration()}
                children="Select Row"
                disabled
            />
            <ASUIMenuDropDown
                options={() => this.renderMenuSelectVelocity()}
                children="Set Cursor Position"
                disabled
            />
        </>);
    }

    renderRowInsertCommandMenu() {
        return this.getComposer().renderMenuSelectCommand(selectedCommand => {

        }, null, "Insert new command");
    }

    /** User Input **/


    onClick(e) {
        if (e.defaultPrevented)
            return;
        e.preventDefault();
        this.selectRow(!e.ctrlKey);
    }

    onContextMenu(e) {
        if (e.defaultPrevented || e.shiftKey)
            return;
        e.preventDefault();
        this.toggleMenu();
    }

    onKeyDown(e) {
        if (e.isDefaultPrevented())
            return;
        switch (e.key) {
            case 'ContextMenu':
                e.preventDefault();
                this.toggleMenu();
                break;

            default:
                break;
        }
    }

}

export default ASCTrackRow;
