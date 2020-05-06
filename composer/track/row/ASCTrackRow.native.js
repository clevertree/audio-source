import * as React from "react";
import {Text, View} from "react-native";
import ASCTrackPosition from "../position/ASCTrackPosition";
import ASCTrackInstructionAdd from "./ASCTrackInstructionAdd";
import ASCTrackDelta from "../delta/ASCTrackDelta";
import ASUIDropDownContainer from "../../../components/menu/dropdown/ASUIDropDownContainer";
import PropTypes from "prop-types";

import styles from "./ASCTrackRow.style";

export default class ASCTrackRow extends React.Component {
    constructor(props) {
        super(props);
        this.dropdown = React.createRef();
        this.cb = {
            // onContextMenu: (e) => this.onContextMenu(e),
            // onKeyDown: (e) => this.onKeyDown(e),
            onPress: e => this.onMouseInput(e),
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
        const style = [styles.default];
        if(this.props.highlight) {
            if(!styles[this.props.highlight])
                throw new Error("Invalid highlight style: " + this.props.highlight);
            style.push(styles[this.props.highlight])
        }

        const composer = this.props.tracker.getComposer();
        const rowDeltaDuration = composer.values.formatSongDuration(this.props.deltaDuration);
        return (
            <View
                style={style}
                // onClick={this.cb.onMouseInput}
                onPress={this.cb.onPress}
            >
                <ASCTrackPosition positionTicks={this.props.positionTicks}/>
                {this.props.children}
                {this.props.cursor ? <ASCTrackInstructionAdd
                    cursorPosition={this.props.cursorPosition}
                /> : null}
                <ASCTrackDelta duration={rowDeltaDuration}/>
                <ASUIDropDownContainer
                    ref={this.dropdown}
                    options={this.props.options}
                    vertical={this.props.vertical}
                />
            </View>
        )
    }

    toggleMenu() {
        return this.dropdown.current.toggleMenu();
    }

    async selectRow(clearSelection = true) {
        // const selectedIndices = clearSelection ? [] : null;
        await this.getTracker().setCursorOffset(this.props.cursorPosition, clearSelection ? [] : null);
    }


    /** User Input **/

    onMouseInput(e) {
        if (e.defaultPrevented)
            return;
        e.preventDefault();
        // console.log(e.type, e.button);

        switch (e.type) {
            case 'mousedown':
            case 'click':
                if (e.button === 0)
                    this.selectRow(!e.ctrlKey);
                else if (e.button === 1)
                    throw new Error("Unimplemented middle button");
                else if (e.button === 2)
                    this.toggleMenu();
                else
                    throw new Error("Unknown mouse button");

                break;
            default:
                throw new Error("Unknown Mouse event: " + e.type);
        }
    }


}
