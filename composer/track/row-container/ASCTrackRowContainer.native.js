import React from "react";
import {PanResponder, StyleSheet, Text, View} from 'react-native';

import ASCTrackRowContainerBase from "./ASCTrackRowContainerBase";

export default class ASCTrackRowContainer extends ASCTrackRowContainerBase {
    constructor(props) {
        super(props);
        this.last=null;
        this.currentCursorOffset = null;
        this.currentSelectedIndex = null;
        this.currentRowOffset = null;
        // this.longPressTimeout = null;
        // this.longPressEnabled = false;
        this.panResponderConfig = {

            onPanResponderGrant: (evt, gestureState) => {
                // console.log(gestureState);
                this.longPressEnabled = false;
                this.last=null;
                this.currentRowOffset = this.getRowOffset();
                this.currentCursorOffset = this.getCursorOffset();
                // this.longPressTimeout = setTimeout(() => {
                //     this.longPressEnabled = true;
                //     console.log('longPressEnabled', this.longPressEnabled);
                // }, 4000)
                // console.log('longPressEnabled', this.longPressEnabled);

                // console.log('onPanResponderGrant', gestureState);
                // The gesture has started. Show visual feedback so the user knows
                // what is happening!
                // gestureState.d{x,y} will be set to zero now
            },

            // Ask to be the responder:
            onMoveShouldSetPanResponder: (evt, gestureState) =>  true,
            onMoveShouldSetPanResponderCapture: (evt, gestureState) =>  true,
            //     true,
            onPanResponderMove: (evt, gestureState) => {
                const {dx, dy, numberActiveTouches} = gestureState;
                let diffX=0, diffY=0;
                if(this.last) {
                    diffX = dx - this.last.dx;
                    diffY = dy - this.last.dy;
                }
                this.last = {dx, dy};


                if(Math.abs(dy) < 0.5 && Math.abs(dx) < 0.5)
                    return;
                // clearTimeout(this.longPressTimeout);


                if(Math.abs(diffY) > Math.abs(diffX))
                    this.onVerticalPan(diffY, numberActiveTouches > 1);
                else
                    this.onHorizontalPan(diffX, numberActiveTouches > 1);

                // TODO: horizontal panning changes selection

                // The most recent move distance is gestureState.move{X,Y}
                // The accumulated gesture distance since becoming responder is
                // gestureState.d{x,y}
            },
            // onPanResponderTerminationRequest: (evt, gestureState) =>
            //     true,
            onPanResponderRelease: (evt, gestureState) => {
                console.log('onPanResponderRelease', gestureState);
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
        let newRowOffset = this.currentRowOffset;
        newRowOffset += offsetDY > 0 ? Math.ceil(offsetDY) : Math.floor(offsetDY);
        // newRowOffset += dy < 0 ? 1 : -1;
        if(newRowOffset < 0)
            newRowOffset = 0; // return console.log("Unable to scroll past beginning");
        this.currentRowOffset = newRowOffset;

        this.getComposer().trackerSetRowOffset(this.getTrackName(), Math.round(newRowOffset))
        // this.getComposer().trackerUpdateSegmentInfo(this.getTrackName());
        // this.getTrackInfo().changeRowOffset(this.getTrackName(), newRowOffset);
    }


    onHorizontalPan(dx, selectIndex=false) {
        dx = dx / 10;
        // if(Math.abs(dx) < 0.5)
        //     dx = (dx < 0 ? -0.5 : 0.5)
        // if(Math.abs(dx) < 0.5)
        //     return;
        let newCursorOffset = this.currentCursorOffset;
        newCursorOffset += dx; //  < 0 ? 1 : -1;
        if(newCursorOffset < 0)
            newCursorOffset = 0; // return console.log("Unable to scroll past beginning");
        // console.log('onHorizontalPan', dx, newCursorOffset);
        this.currentCursorOffset = newCursorOffset;

        const trackState = this.getTrack().getTrackState();
        newCursorOffset = Math.round(newCursorOffset);
        if(selectIndex) {
            const cursorInfo = trackState.getCursorInfo(newCursorOffset);
            if(cursorInfo.cursorIndex !== null && this.currentSelectedIndex !== cursorInfo.cursorIndex) {
                this.currentSelectedIndex = cursorInfo.cursorIndex;
                this.getComposer().trackSelectIndices(this.getTrackName(), [cursorInfo.cursorIndex], newCursorOffset);
                this.getComposer().trackerPlaySelected(false);
            }
        }
        this.getComposer().trackerSetCursorOffset(this.getTrackName(), newCursorOffset);
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
                {this.renderContent()}
            </View>
        );
    }

    renderContent() {
        return <PanResponderContainer
            key="panResponder"
            style={styles.containerRows}
            panResponderConfig={this.panResponderConfig}
            >
            {super.render()}
        </PanResponderContainer>;
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
    },

    containerSelectTrack: {
        display: 'flex',
    }
});


