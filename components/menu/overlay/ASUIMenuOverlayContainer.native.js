import React from "react";
import {StyleSheet, View, TouchableHighlight, TouchableOpacity, Animated, Easing, Dimensions} from "react-native";
import ASUIMenuBreak from "../item/ASUIMenuBreak";
import ASUIMenuAction from "../item/ASUIMenuAction";
import ASUIMenuOverlayContainerBase from "./ASUIMenuOverlayContainerBase";
import ASUIMenuDropDown from "../item/ASUIMenuDropDown";

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
                    underlayColor="#FFFC"
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

        const options = recursiveMap(
            this.state.options,
         child => {
            // console.log('child', child, child.type)
                if(
                    [ASUIMenuDropDown, ASUIMenuAction].indexOf(child.type) !== -1
                ) {
                    child = React.cloneElement(child, { ...child.props, style: styles.menuItemContainer});
                    // return <View
                    //     style={styles.menuItemContainer}
                    // >{child}</View>
                }
            return child;
        })

        return (
            <Animated.View  key="dropdown" style={[transformStyle, styles.dropdown, {width}]}>
                <TouchableOpacity
                    style={{flex: 1}}
                    onPress={this.cb.closeAllMenus}
                    >
                    <View>
                        {options}
                        <ASUIMenuBreak/>
                        <ASUIMenuAction
                            onAction={this.cb.closeAllMenus}
                            style={styles.menuItemContainer}
                            >- Close Menu -</ASUIMenuAction>
                            </View>
                </TouchableOpacity>
            </Animated.View>
        )
    }
}

function recursiveMap(children, fn) {
    let newChildren = React.Children.map(children, child => {
        if (!React.isValidElement(child)) {
            return child;
        }

        if (child.props.children) {
            child = React.cloneElement(child, {
                children: recursiveMap(child.props.children, fn)
            });
        }

        return fn(child);
    });
    if(Array.isArray(newChildren) && newChildren.length === 1)
        newChildren = newChildren[0]
    return newChildren;
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
    },

    menuItemContainer: {
        padding: 4,
        borderWidth: 1,
        borderLeftColor: '#CCC',
        borderTopColor: '#CCC',
        borderRightColor: '#AAA',
        borderBottomColor: '#AAA',
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
