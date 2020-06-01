import * as React from "react";
import PropTypes from "prop-types";
import ASCTrackPosition from "../position/ASCTrackPosition";
import ASCTrackInstructionAdd from "../instruction/ASCTrackInstructionAdd";
import ASCTrackDelta from "../delta/ASCTrackDelta";
import ASUIDropDownContainer from "../../../components/menu/dropdown/ASUIDropDownContainer";
import "./ASCTrackRow.css";

class ASCTrackRow extends React.Component {
    constructor(props) {
        super(props);
        this.dropdown = React.createRef();
        this.cb = {
            onContextMenu: (e) => this.onContextMenu(e),
            onKeyDown: (e) => this.onKeyDown(e),
            onClick: e => this.onClick(e),
        };
        this.state = {
            menuOpen: false
        }
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
        let className = "asct-row";
        if (this.props.highlight)
            className += ` ${this.props.highlight}`; // ' highlight';
        const composer = this.props.tracker.getComposer();
        const rowDeltaDuration = composer.state.showTrackRowDurationInTicks ? this.props.deltaDuration : composer.values.formatDuration(this.props.deltaDuration);
        const rowPosition = composer.state.showTrackRowPositionInTicks ? this.props.positionTicks : composer.values.formatDurationAsDecimal(this.props.positionTicks);
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
                <ASCTrackPosition position={rowPosition}/>
                {this.props.children}
                {this.props.cursor ? <ASCTrackInstructionAdd // TODO: render on hover
                    cursorPosition={this.props.cursorPosition}
                /> : null}
                <ASCTrackDelta duration={rowDeltaDuration}/>
                {this.state.menuOpen ? <ASUIDropDownContainer
                    clientPosition={this.state.clientPosition}
                    // ref={this.dropdown}
                    options={() => this.renderRowMenu()}
                    onClose={() => this.closeDropDown()}
                    vertical={true}
                /> : null}
            </div>
        )
    }

    /** Drop Down Menu **/

    openDropDown() {
        this.setState({menuOpen: true});
    }

    // stickDropDown() {
    //     this.setState({menuOpen: true});
    // }

    closeDropDown() {
        this.setState({menuOpen: false});
    }


    toggleMenu(e) {
        const state = {menuOpen: !this.state.menuOpen};
        if(e)
            state.clientPosition = [e.clientX, e.clientY];
        this.setState(state);
    }

    /** Actions **/

    selectRow(clearSelection = true) {
        // const selectedIndices = clearSelection ? [] : null;
        const tracker = this.getTracker();
        tracker.setCursorPositionOffset(this.props.cursorPosition, this.props.positionTicks);
        tracker.selectIndices([], clearSelection);
        const {positionSeconds} = this.getTracker().getPositionInfo(this.props.positionTicks);
        this.getComposer().setSongPosition(this.getTracker().getStartPosition() + positionSeconds)
    }


    instructionInsert(command) {
        const insertIndex = this.getComposer().instructionInsertAtPosition(
            this.getTracker().getTrackName(),
            this.props.positionTicks,
            command,
            true,
            true
        );
        this.getTracker().selectIndices(
            insertIndex
        );
    }


    /** Menus **/

    renderRowMenu() {
        return this.getComposer().renderMenuEdit(null);
        // return (<>
        //     {/*<ASUIMenuItem>Row</ASUIMenuItem>*/}
        //     {/*<ASUIMenuBreak/>*/}
        //     <ASUIMenuDropDown
        //         options={() => this.getComposer().renderMenuEditTrackSelectIndices()}
        //         children="Select"
        //     />
        //     <ASUIMenuBreak />
        //     <ASUIMenuDropDown
        //         options={() => this.renderRowInsertCommandMenu()}
        //         children="Insert"
        //     />
        // </>);
    }

    renderRowInsertCommandMenu() {
        return this.getComposer().renderMenuSelectCommand(selectedCommand => {
            this.instructionInsert(selectedCommand);
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
        this.toggleMenu(e);
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
