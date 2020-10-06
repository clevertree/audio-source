import * as React from "react";
import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';

class ASCTrackPosition extends React.Component {
    render() {
        return (
            <View
                style={styles.default}
                >
                <TouchableOpacity
                    onPressIn={this.props.onPressIn}
                    >
                    <Text numberOfLines={1}>
                        {this.props.position}
                    </Text>
                </TouchableOpacity>
            </View>
        );
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
