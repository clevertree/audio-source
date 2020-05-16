import * as React from "react";
import PropTypes from "prop-types";
import {PanResponder, StyleSheet, Text, TouchableWithoutFeedback, TouchableOpacity, View} from "react-native";
import ASCTrackPosition from "../position/ASCTrackPosition";
import ASCTrackInstructionAdd from "../instruction/ASCTrackInstructionAdd";
import ASCTrackDelta from "../delta/ASCTrackDelta";
import ASUIDropDownContainer from "../../../components/menu/dropdown/ASUIDropDownContainer";

export default class ASCTrackRow extends React.Component {
    constructor(props) {
        super(props);
        this.dropdown = React.createRef();
        this.cb = {
            // onContextMenu: (e) => this.onContextMenu(e),
            // onKeyDown: (e) => this.onKeyDown(e),
            onPress: e => this.onPress(e, 'press'),
            // onPressIn: e => this.onPress(e, 'in'),
            // onPressOut: e => this.onPress(e, 'out'),
        };
        this.lastPressInTime = null;
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
            // <TouchableOpacity
            //     onPressIn={this.cb.onPressIn}
            //     onPressOut={this.cb.onPressOut}
            // >
                <View
                    style={style}
                    // onClick={this.cb.onMouseInput}
                >
                    <ASCTrackPosition
                        onPressIn={this.cb.onPress}
                        positionTicks={this.props.positionTicks}/>
                    {this.props.children}
                    {this.props.cursor ? <ASCTrackInstructionAdd
                        cursorPosition={this.props.cursorPosition}
                    /> : null}
                    <ASCTrackDelta
                        onPressIn={this.cb.onPress}
                        duration={rowDeltaDuration}/>
                    <ASUIDropDownContainer
                        ref={this.dropdown}
                        options={this.props.options}
                        vertical={this.props.vertical}
                    />
                </View>
            // </TouchableOpacity>
        )
    }

    toggleMenu() {
        return this.dropdown.current.toggleMenu();
    }

    async selectRow(clearSelection = true) {
        // const selectedIndices = clearSelection ? [] : null;
        await this.getTracker().setCursorPosition(this.props.cursorPosition, clearSelection ? [] : null);
    }


    /** User Input **/

    onPress(e, state) {
        this.selectRow(!e.ctrlKey);
        // switch(state) {
            // case 'in':
            //     this.lastPressInTime = new Date().getTime();
            //     console.log('lastPressInTime', this.lastPressInTime);
            //     break;
            // case 'out':
            //     const pressTime = new Date().getTime() - this.lastPressInTime;
            //     console.log('pressTime', pressTime);
            //     if(pressTime < 500)
            //         this.selectRow(!e.ctrlKey);
            //     break;

        // }
        // if (e.button === 0)
        // else if (e.button === 1)
        //     throw new Error("Unimplemented middle button");
        // else if (e.button === 2)
        //     this.toggleMenu();
        // else
        //     throw new Error("Unknown mouse button");
    }


}


const styles = StyleSheet.create({

    default: {
        // display: 'flex',
        flexDirection:'row',
        flexWrap:'wrap',

        backgroundColor: '#C0C0C0',
        borderWidth: 1,
        borderLeftColor: '#DDD',
        borderTopColor: '#DDD',
        borderRightColor: '#AAA',
        borderBottomColor: '#AAA',
        // padding: 2,
    },

    position: {
        backgroundColor: '#609060',
    },
    cursor: {
        backgroundColor: '#ffeedd',
    },
    selected: {
        backgroundColor: '#ffeedd',
    },

    'measure-start': {
        borderTopWidth: 1,
        borderTopColor: '#666',
    }
});


// /** ASCTrack Row **/
//
// div.asct-row {
//     display: flex;
//     cursor: pointer;
//     background-color: #C0C0C0;
//     height: 1.45em;
//     position: relative;
//     border: 1px outset #DDD;
//     padding: 0px;
// }
//
//
// div.asct-row:nth-child(odd) {
//     background-color: #D0D0D0;
// }
//
// /** Track Colors **/
//
// div.asct-row.measure-start {
//     border-top: 1px solid #666;
//     background: linear-gradient(to bottom, #AAA 0%, #CCC 50%);
// }
//
// div.asct-row.playing {
//     background-color: #4ebf4e;
// }
//
// div.asct-row.position {
//     background-color: #609060;
// }
//
//
// /** Selected **/
//
// div.asct-row.cursor,
// div.asct-row.selected {
//     background-color: #ffeedd;
//     position: relative;
//     box-shadow: #ffeedd 0px 0px 9px;
//     z-index: 2;
// }
//
// /** Hover **/
//
// div.asct-row:hover {
//     background: #EFE;
//     border: 1px outset #4EE;
// }
//
// div.asct-row.position:hover {
//     background: #9C9;
//     border: 1px outset #4EE;
// }
