import React from "react";
import {ASUIMenuDropDown} from "../../components/menu";
import {ASUIIcon} from "../../components";
import PropTypes from 'prop-types';
import ASUIMenuOverlayContainer from "../../components/menu/overlay/ASUIMenuOverlayContainer";
import {Text, View, ScrollView, TouchableHighlight} from 'react-native';

import styles from "./ASComposerContainer.style";

export class ASComposerContainer extends React.Component {
    /** Property validation **/
    static propTypes = {
        // composer: PropTypes.required
    };

    constructor(props) {
        super(props);

        this.dropdown = React.createRef();
        this.cb = {
            onPress: e => this.onPress(e)
        }
    }

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
                <TouchableHighlight
                    onPress={this.cb.onPress}
                >
                    <View style={styles.container}>
                        <ASUIMenuDropDown
                            ref={this.dropdown}
                            style={styles.menuButton}
                            key="menu-button"
                            arrow={false}
                            options={() => this.props.composer.renderRootMenu()}
                        >
                            <ASUIIcon size="large" source="menu"/>
                        </ASUIMenuDropDown>
                        <Text style={styles.title}>{state.title}</Text>
                    </View>
                </TouchableHighlight>
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
            <View key="footer" style={styles.footer}>
                <Text style={styles.footerStatus}>{state.status}</Text>
                <Text style={styles.footerVersion} ref={this.props.composer.footerVersionText}
                >{state.version}</Text>
            </View>
        );
    }

    onPress(e) {
        this.dropdown.current.toggleMenu();
    }
}
