import * as React from "react";
import {Text, View} from 'react-native';
import {ASUIPanel} from "../../components/";

import styles from "./ASCTrack.style";
import ASCTrackBase from "./ASCTrackBase";

export default class ASCTrack extends ASCTrackBase {
    constructor(props) {
        super(props);
        // this.container = React.createRef();
    }

    /** Render **/

    render() {
        return (
            <ASUIPanel
                style={styles.containerPanel}
                header={this.getTrackName()}
                title={`Track: ${this.getTrackName()}`}
                >
                <View style={styles.default}>
                    <View
                        key="segments"
                        style={styles.containerSegments}
                        children={this.renderRowSegments()}
                        />
                    <View
                        key="rows"
                        style={styles.containerRows}
                        onKeyDown={this.cb.onKeyDown}
                        onWheel={this.cb.onWheel}
                        >
                        {this.renderRowContent()}
                    </View>
                    <View
                        key="options"
                        style={styles.containerOptions}
                        children={this.renderRowOptions()}
                    />
                </View>
            </ASUIPanel>
        );
    }
}

