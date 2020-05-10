import * as React from "react";
import {StyleSheet, Text, View} from 'react-native';
import {ASUIPanel} from "../../components/";

import ASCTrackBase from "./ASCTrackBase";

export default class ASCTrack extends ASCTrackBase {
    constructor(props) {
        super(props);
        // this.container = React.createRef();
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
                <View
                    key="rows"
                    style={styles.containerRows}
                    onKeyDown={this.cb.onKeyDown}
                    onWheel={this.cb.onWheel}
                    >
                    {this.renderRowContent()}
                </View>
            </View>
        );
    }
}

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


