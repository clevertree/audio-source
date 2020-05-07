import * as React from "react";
import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';

import ASCTrackInstructionBase from "./ASCTrackInstructionBase";


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

    render() {
        const style = [styles.cell];

        if(this.props.cursor)
            style.push(styles.cursor)
        if(this.props.selected)
            style.push(styles.selected)
        if(this.props.playing)
            style.push(styles.playing)

        const parameters = this.renderParameters();
        return (
            <TouchableOpacity
                onPress={this.cb.onPress}
                >
                <View
                    style={style}
                >
                    {parameters}
                </View>
            </TouchableOpacity>
        );
    }

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
        paddingRight: 2,
    },

    selected: {
        backgroundColor: '#FFF',
    },
    playing: {
        backgroundColor: '#80d55c'
    }
});
