import * as React from "react";

import {Text, View} from "react-native";

import styles from "./ASCTrackDelta.style";

class ASCTrackDelta extends React.Component {
    render() {
        return <View
            style={styles.default}
        >
            <Text>
                {this.props.duration}
            </Text>
        </View>;
    }
}

export default ASCTrackDelta;
