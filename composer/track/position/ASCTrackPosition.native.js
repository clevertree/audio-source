import * as React from "react";
import {StyleSheet, Text, View} from 'react-native';

class ASCTrackPosition extends React.Component {
    render() {
        return <View
            style={styles.default}
            >
            <Text numberOfLines={1}>
                {this.props.positionTicks}
            </Text>
        </View>;
    }
}

export default ASCTrackPosition;

const styles = StyleSheet.create({

    default: {
        display: 'flex',
        width: 42,
        paddingLeft: 2,
    },

});
