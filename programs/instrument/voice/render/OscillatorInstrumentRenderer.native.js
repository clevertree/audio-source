import React from 'react';
import {View, Text} from 'react-native';
import OscillatorInstrumentRendererBase from "./OscillatorInstrumentRendererBase";
import {ASUIIcon, ASUIMenuDropDown} from "../../../../components";

import styles from "./OscillatorInstrumentRenderer.style"

class OscillatorInstrumentRenderer extends OscillatorInstrumentRendererBase {

    render() {
        const style = [styles.container];
        if(this.state.open)
            style.push(styles.open)
        let title = this.getTitle();


        return <View style={style}>
            <View
                style={styles.title}
                title={`Oscillator: ${title}`}
                onClick={this.cb.onClick}
            >
                <Text>{title}</Text>
            </View>
            {this.renderParameters()}
            <ASUIMenuDropDown
                arrow={false}
                className="config"
                options={() => this.renderMenuRoot()}
            >
                <ASUIIcon source="config"/>
            </ASUIMenuDropDown>
        </View>;
    }
}
export default OscillatorInstrumentRenderer;
