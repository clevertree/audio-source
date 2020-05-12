import React from "react";
import {StyleSheet, Text, View} from 'react-native';

import {
    ASUIIcon,
    ASUIButtonDropDown,
    ASUIButton,
} from "../../components";
import ASCProgramRendererBase from "./ASCProgramRendererBase";

export default class ASCProgramRenderer extends ASCProgramRendererBase {

    render() {
        const song = this.getSong();
        const programID = this.props.programID;
        const programConfig = song.programGetData(programID);
        const programIDHTML = (programID < 10 ? "0" : "") + (programID);


        // let contentClass = 'error';
        let titleHTML = '';
        if (song.hasProgram(programID)) {
            titleHTML = programConfig.title || "No Title"

        } else {
            titleHTML = `Empty`;
        }
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <ASUIButton
                        selected={this.state.open}
                        onAction={e => this.toggleContainer()}
                        children={`${programIDHTML}: ${titleHTML}`}
                        />
                    <ASUIButtonDropDown
                        style={styles.config}
                        arrow={false}
                        options={() => this.renderMenuRoot()}
                    >
                        <ASUIIcon source="config"/>
                    </ASUIButtonDropDown>
                </View>
                {this.state.open ? <View style={styles.content}>
                    {this.renderProgramContent()}
                </View> : null}
            </View>
        );

        // return content;
    }
}

const styles = StyleSheet.create({

    header: {
        flexDirection:'row',
        flexWrap:'wrap',
        // justifyContent: 'space-between'
    },

    config: {
    },

    content: {
        borderTopWidth: 1,
        borderTopColor: '#AAA',
        padding: 4,
        backgroundColor: '#DDD',
        // borderWidth: 1
    },

    container: {
        // backgroundColor: '#EEE',

        borderWidth: 1,
        borderLeftColor: '#DDD',
        borderTopColor: '#DDD',
        borderRightColor: '#AAA',
        borderBottomColor: '#AAA',
        // display: 'flex',
    },

});
