import * as React from "react";
import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';

import ASCTrackInstructionBase from "./ASCTrackInstructionBase";
import {ASUIDropDownContainer} from "../../../components/menu";


export default class ASCTrackInstruction extends ASCTrackInstructionBase {
    constructor(props) {
        super(props);

        this.cb = {
            // onContextMenu: (e) => this.onContextMenu(e),
            // onKeyDown: (e) => this.onKeyDown(e),
            onPress: e => this.onPress(e),
        };
        this.commandParam = React.createRef();
    }

    isOpen() { return this.props.cursor || this.props.selected; }

    render() {
        const style = [styles.cell];

        if(this.props.cursor)
            style.push(styles.cursor)
        if(this.props.selected)
            style.push(styles.selected)
        if(this.props.playing)
            style.push(styles.playing)

        const instruction = this.props.instruction;
        const open = this.isOpen();
        return (
            <TouchableOpacity
                onPressIn={this.cb.onPress}
                // onPress={this.cb.onPress}
                >
                <View
                    style={style}
                >

                    {open ? <View
                        style={styles.commandView}
                        >
                        <Text>{instruction.command}</Text>
                    </View> : this.renderParameters() }

                    {this.state.menuOpen ? <ASUIDropDownContainer
                        key="dropdown"
                        ref={this.dropdown}
                        options={this.cb.options}
                        vertical={true}
                    /> : null}
                </View>
            </TouchableOpacity>
        );
    }

    /** User Input **/

    onPress(e) {
        this.selectInstructionWithAction(!e.ctrlKey);
    }

}


const styles = StyleSheet.create({

    cell: {
        display: 'flex',
        // flexWrap:'wrap',
        flexDirection:'row',

        color: '#666',

        backgroundColor: '#CCC',
        borderRadius: 4,
        borderWidth: 1,
        borderLeftColor: '#AAA',
        borderTopColor: '#AAA',
        borderRightColor: '#666',
        borderBottomColor: '#666',

        paddingLeft: 2,
    },

    commandView: {
        paddingRight: 2,
    },

    selected: {
        backgroundColor: '#FFF',
    },

    cursor: {
        backgroundColor: '#DDD',
        borderLeftColor: '#F00',
        borderTopColor: '#F00',
        borderRightColor: '#A00',
        borderBottomColor: '#A00',
    },
    playing: {
        backgroundColor: '#80d55c'
    }
});
