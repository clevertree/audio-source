import * as React from "react";

import {Text, TouchableOpacity, View} from "react-native";

import styles from "./ASCTrackDelta.style";

class ASCTrackDelta extends React.Component {
    render() {
        return <View
            style={styles.default}
            >
            <TouchableOpacity
            onPressIn={this.props.onPressIn}
            >
                <Text>
                    {this.props.duration}
                </Text>
            </TouchableOpacity>
        </View>;
    }
}

export default ASCTrackDelta;
