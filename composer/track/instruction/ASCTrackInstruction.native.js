import * as React from "react";
import {Text, View} from 'react-native';

import ASCTrackInstructionBase from "./ASCTrackInstructionBase";

import styles from "./ASCTrackInstruction.style";

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
        const style = [styles.default];

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
