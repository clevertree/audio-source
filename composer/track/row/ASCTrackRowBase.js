import * as React from "react";
import PropTypes from "prop-types";

export default class ASCTrackRowBase extends React.Component {
    constructor(props) {
        super(props);
        this.dropdown = React.createRef();
        this.cb = {
            // onContextMenu: (e) => this.onContextMenu(e),
            onKeyDown: (e) => this.onKeyDown(e),
            onClick: e => this.onClick(e),
        };
        this.state = {
            // menuOpen: false
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
        track: PropTypes.any.isRequired,
        // cursor: PropTypes.bool.isRequired,
        cursorPosition: PropTypes.number.isRequired // TODO: inefficient?
    };

    getTracker() { return this.props.track; }

    getComposer() { return this.getTracker().getComposer(); }

    // eslint-disable-next-line react/require-render-return
    render() {
        throw new Error("Implement");
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

    // renderRowMenu() {
    //     return this.getComposer().renderMenuEdit(null);
    //     // return (<>
    //     //     {/*<ASUIMenuItem>Row</ASUIMenuItem>*/}
    //     //     {/*<ASUIMenuBreak/>*/}
    //     //     <ASUIMenuDropDown
    //     //         options={() => this.getComposer().renderMenuEditTrackSelectIndices()}
    //     //         children="Select"
    //     //     />
    //     //     <ASUIMenuBreak />
    //     //     <ASUIMenuDropDown
    //     //         options={() => this.renderRowInsertCommandMenu()}
    //     //         children="Insert"
    //     //     />
    //     // </>);
    // }
    //
    // renderRowInsertCommandMenu() {
    //     return this.getComposer().renderMenuSelectCommand(selectedCommand => {
    //         this.instructionInsert(selectedCommand);
    //     }, null, "Insert new command");
    // }

}

