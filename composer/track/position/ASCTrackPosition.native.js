import * as React from "react";
import {Text, View} from 'react-native';

import style from "./ASCTrackPosition.style";

class ASCTrackPosition extends React.Component {
    render() {
        return <View
            style={style.default}
            >
            <Text>
                {this.props.positionTicks}
            </Text>
        </View>;
    }
}

export default ASCTrackPosition;
