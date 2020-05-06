import React from "react";
import {StyleSheet, View, TouchableHighlight, Animated, Easing, Dimensions} from "react-native";
// import Div from "../div/Div";


import ASUIMenuBreak from "../ASUIMenuBreak";
import ASUIMenuAction from "../ASUIMenuAction";
import ASUIMenuOverlayContainerBase from "./ASUIMenuOverlayContainerBase";

export default class ASUIMenuOverlayContainer extends ASUIMenuOverlayContainerBase {

    renderContent() {
        return (
                <View style={styles.container}>
                    {this.props.children}

                    {this.state.openOverlay ? this.renderOverlay() : null}
                    {this.state.open ? this.renderDropDown() : null}
                </View>
        );
    }

    renderOverlay() {
        return (
            <View key="overlay" style={styles.overlay}>
                <TouchableHighlight
                    underlayColor="#DDD"
                    style={{flex: 1}}
                    onPress={this.cb.closeAllMenus}
                    >
                    <View
                    />
                </TouchableHighlight>
            </View>
        )
    }

    renderDropDown() {
        let widthPercent = this.props.widthPercent || 0.5;
        let width = this.props.width || Dimensions.get('window').width * widthPercent;
        let duration = this.props.duration || 150;
        let scaleValue = new Animated.Value(-width); // declare an animated value
        const cardScale = scaleValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1]
        });
        let transformStyle = {
            transform: [{ translateX: cardScale }]
        };

        Animated.timing(scaleValue, {
            toValue: 0,
            duration,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true
        }).start();

        return (
            <Animated.View  key="dropdown" style={[transformStyle, styles.dropdown, {width}]}>
                {this.state.options}
                <ASUIMenuBreak/>
                <ASUIMenuAction onAction={this.cb.closeAllMenus}>- Close Menu -</ASUIMenuAction>
            </Animated.View>
        )
    }
}


const styles = StyleSheet.create({

    container: {
        flex: 1,
    },

    overlay: {
        position: 'absolute',
        flex: 1,
        backgroundColor: '#CCC8',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },

    dropdown: {
        position: 'absolute',
        backgroundColor: '#CCC',
        top: 0,
        bottom: 0,
        left: 0,
        width: Dimensions.get('window').width / 2
    }

});
