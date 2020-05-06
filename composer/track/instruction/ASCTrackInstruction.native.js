import * as React from "react";
import {StyleSheet, Text, View} from 'react-native';

import ASCTrackInstructionBase from "./ASCTrackInstructionBase";


export default class ASCTrackInstruction extends ASCTrackInstructionBase {
    constructor(props) {
        super(props);

        this.cb = {
            // onContextMenu: (e) => this.onContextMenu(e),
            // onKeyDown: (e) => this.onKeyDown(e),
            onMouseInput: e => this.onMouseInput(e),
        };
        this.commandParam = React.createRef();
    }

    render() {
        const style = [styles.cell];

        if(this.props.cursor)
            style.push(styles.cursor)
        if(this.props.selected)
            style.push(styles.selected)
        if(this.props.playing)
            style.push(styles.playing)

        const parameters = this.renderParameters();
        return <View
            style={style}
            onMouseDown={this.cb.onMouseInput}
        >
            {parameters}
        </View>;
    }
}


const styles = StyleSheet.create({

    cell: {
        display: 'flex',

        color: '#666',

        backgroundColor: '#CCC',
        borderRadius: 4,
        borderWidth: 1,
        borderLeftColor: '#AAA',
        borderTopColor: '#AAA',
        borderRightColor: '#666',
        borderBottomColor: '#666',

        paddingLeft: 2,
        paddingRight: 2,
    },

});
