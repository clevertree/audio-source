import * as React from "react";
import PropTypes from "prop-types";

export default class ASCTrackRowBase extends React.Component {
    constructor(props) {
        super(props);
        this.dropdown = React.createRef();
        this.cb = {
            // onClick: e => this.onClick(e),
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

    getTrack() { return this.props.track; }

    getComposer() { return this.getTrack().getComposer(); }

    // eslint-disable-next-line react/require-render-return
    render() {
        throw new Error("Implement");
    }

    /** Actions **/

    selectRow(clearSelection = true) {
        // const selectedIndices = clearSelection ? [] : null;
        const track = this.getTrack();
        track.setCursorOffset(this.props.cursorPosition);
        track.selectIndices([], clearSelection); // TODO: Why clear selection?

        // const trackState = track.getTrackState();
        const {positionSeconds} = track.getPositionInfo(this.props.positionTicks);
        this.getComposer().setSongPosition(track.getStartPosition() + positionSeconds)
        // TODO: double composer state update
    }


    instructionInsert(command) {
        const insertIndex = this.getComposer().instructionInsertAtPosition(
            this.getTrack().getTrackName(),
            this.props.positionTicks,
            command,
        );
        this.getTrack().selectIndices(
            insertIndex
        );
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

