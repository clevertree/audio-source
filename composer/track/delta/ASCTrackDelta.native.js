import * as React from "react";

import styles from "./ASCTrackDelta.style";
import {Text, View} from "react-native";
import style from "./ASCTrackDelta.style";

class ASCTrackDelta extends React.Component {
    render() {
        return <View
            style={style.default}
        >
            <Text>
                {this.props.duration}
            </Text>
        </View>;
    }
}

export default ASCTrackDelta;
