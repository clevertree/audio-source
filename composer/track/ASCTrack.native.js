import React, {useRef} from "react";
import {PanResponder, StyleSheet, Text, View, ScrollView} from 'react-native';

import ASCTrackBase from "./ASCTrackBase";

export default class ASCTrack extends ASCTrackBase {
    constructor(props) {
        super(props);
        let last=null;
        this.panResponderConfig = {
            // Ask to be the responder:
            onMoveShouldSetPanResponder: (evt, gestureState) => true,
            // onMoveShouldSetPanResponderCapture: (evt, gestureState) =>
            //     true,

            onPanResponderGrant: (evt, gestureState) => {
                last=null;
                // console.log('onPanResponderGrant', gestureState);
                // The gesture has started. Show visual feedback so the user knows
                // what is happening!
                // gestureState.d{x,y} will be set to zero now
            },
            onPanResponderMove: (evt, gestureState) => {
                const {dx, dy, numberActiveTouches} = gestureState;
                let diffX=0, diffY=0;
                if(last) {
                    diffX = dx - last.dx;
                    diffY = dy - last.dy;
                }
                last = {dx, dy};
                if(Math.abs(diffY) > Math.abs(diffX))
                    this.onVerticalPan(diffY);
                // The most recent move distance is gestureState.move{X,Y}
                // The accumulated gesture distance since becoming responder is
                // gestureState.d{x,y}
            },
            // onPanResponderTerminationRequest: (evt, gestureState) =>
            //     true,
            onPanResponderRelease: (evt, gestureState) => {
                last=null;
                // console.log('onPanResponderRelease', gestureState);
                // The user has released all touches while this view is the
                // responder. This typically means a gesture has succeeded
            },
            // onPanResponderTerminate: (evt, gestureState) => {
            //     console.log('onPanResponderTerminate', evt, gestureState);
            // Another component has become the responder, so this gesture
            // should be cancelled
            // },
            // onShouldBlockNativeResponder: (evt, gestureState) => {
            //     console.log('onShouldBlockNativeResponder', evt, gestureState);
            // Returns whether this component should block native components from becoming the JS
            // responder. Returns true by default. Is currently only supported on android.
            // return true;
            // }
        };
        this.cb.onScroll = (e) => this.onScroll(e);
    }


    /** User Input **/

    onScroll(e) {
        // console.log(e);
    }

    onVerticalPan(dy) {
        if(Math.abs(dy) < 0.5)
            return;
        const offsetDY = (Math.abs(dy) / 10) * (Math.abs(-dy) / -dy);
        // console.log('onVerticalPan', dy, offsetDY);
        let newRowOffset = this.getTrackState().rowOffset;
        newRowOffset += offsetDY > 0 ? Math.ceil(offsetDY) : Math.floor(offsetDY);
        // newRowOffset += dy < 0 ? 1 : -1;
        if(newRowOffset < 0)
            newRowOffset = 0; // return console.log("Unable to scroll past beginning");
        this.getComposer().trackerSetRowOffset(this.getTrackName(), newRowOffset)
        // this.getComposer().trackerUpdateSegmentInfo(this.getTrackName());
        // this.getTrackInfo().changeRowOffset(this.getTrackName(), newRowOffset);
    }

    /** Render **/

    render() {
        return (
            <View
                style={styles.containerPanel}
                >
                <View style={styles.header}>
                    <Text style={styles.headerText}>
                        {this.getTrackName()}
                    </Text>
                </View>
                <View style={styles.subHeader}>
                    <View
                        style={styles.containerSegments}
                        children={this.renderRowSegments()}
                    />
                    <View
                        style={styles.containerButtons}
                        >
                        {this.renderRowOptions()}
                        {this.renderQuantizationButton()}
                    </View>
                </View>
                {this.props.collapsed ? null : <PanResponderContainer
                    style={styles.containerRows}
                    panResponderConfig={this.panResponderConfig}
                    >
                    {/*{this.renderRowContent(this.panResponderConfig)}*/}
                    {this.renderRowContent()}
                </PanResponderContainer>}
            </View>
        );
    }

}

const PanResponderContainer = (props) => {
    if(!props.panResponderConfig)
        return <View style={[props.style,{flex:1}]}  children={props.children} />;

    const panResponder = React.useRef(
        PanResponder.create(props.panResponderConfig)
    ).current;

    return <View style={[props.style,{flex:1}]} {...panResponder.panHandlers} children={props.children} />;
};


const styles = StyleSheet.create({

    default: {
        // display: 'flex',
        // padding: 2,
        // flexDirection:'column',
        // flexWrap:'nowrap',
    },

    headerText: {
        textAlign: 'center',
        color: '#FFF',
    },

    header: {
        backgroundColor: '#333',
        borderTopRightRadius: 8,
        borderTopLeftRadius: 8,
    },

    subHeader: {
        display: 'flex',
        flexDirection:'row',
        justifyContent: 'space-between',
        backgroundColor: '#888',
    },

    containerRows: {
        // flexDirection:'column',
        // flexWrap:'nowrap',
    },

    containerPanel: {
        position: 'relative',
    },

    containerPanHandler: {
        position: 'absolute',
        backgroundColor: '#CCC3',
        left: 0, right: 0, top: 0, bottom: 0
    },

    containerSegments: {
        display: 'flex',
        flexDirection:'row',
    },

    containerButtons: {
        display: 'flex',
        flexDirection:'row',
    }
});


