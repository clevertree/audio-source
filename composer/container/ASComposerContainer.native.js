import React from "react";
import {ASUIMenuDropDown} from "../../components/menu";
import {ASUIIcon} from "../../components";
import PropTypes from 'prop-types';
import ASUIMenuOverlayContainer from "../../components/menu/ASUIMenuOverlayContainer.native";
import {Text, View, ScrollView} from 'react-native';

import styles from "./ASComposerContainer.style";

export class ASComposerContainer extends React.Component {
    /** Property validation **/
    static propTypes = {
        // composer: PropTypes.required
    };


    render() {
        const state = this.props.composer.state;
        return (
                <ASUIMenuOverlayContainer
                    isActive={state.portrait}
                    >
                    {this.renderHeader()}
                    <ScrollView>
                        {this.props.children}
                    </ScrollView>
                    {this.renderFooter()}
                </ASUIMenuOverlayContainer>
        );
    }

    renderHeader() {
        const state = this.props.composer.state;
        if (state.portrait)
            return (
                <View style={styles.container}>
                    <ASUIMenuDropDown
                        style={styles.menuButton}
                        key="menu-button"
                        arrow={false}
                        options={() => this.props.composer.renderRootMenu()}
                    >
                        <ASUIIcon source="menu"/>
                    </ASUIMenuDropDown>
                    <Text style={styles.title}>{state.title}</Text>
                </View>
            );

        let menuContent = this.props.composer.renderRootMenu();
        // if(typeof menuContent === "function")
        //     menuContent = menuContent();

        return (
            <View style={styles.container}>
                <Text key="title">{state.title}</Text>,
                <View key="menu">
                    {menuContent}
                </View>
            </View>
        );
    }

    renderFooter() {
        const state = this.props.composer.state;
        return (
            <View key="footer">
                <Text>{state.status}</Text>
                <Text ref={this.props.composer.footerVersionText}
                >{state.version}</Text>
            </View>
        );
    }
}
