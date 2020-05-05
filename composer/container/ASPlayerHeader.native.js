import React from "react";
import {StyleSheet, Text, View} from 'react-native';
import {ASUIMenuDropDown} from "../../components/menu";
import {ASUIIcon} from "../../components";

export class ASPlayerHeader extends React.Component {
    render() {
        if(!this.props.portrait)
            console.error("ASPlayerHeader.render does not support portrait !== true");
        return <View
                    style={styles.header}
                    >
                    <ASUIMenuDropDown
                        style={styles.menuButton}
                        arrow={false}
                        className="asp-menu-button-toggle"
                        options={this.props.menuContent}
                        >
                    <ASUIIcon source="menu"/>
                </ASUIMenuDropDown>
                <Text
                    style={styles.headerText}
                    className="asp-title-text">{this.props.title}</Text>
        </View>;
    }
}


const styles = StyleSheet.create({
    header: {
        height: 32,
    },

    menuButton: {
        position: 'absolute'
    },

    headerText: {
        paddingTop: 4,
        fontSize: 16,
        textAlign: 'center',
    },
    default: {
        display: 'flex',
    },

});
