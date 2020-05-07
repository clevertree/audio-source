import React from "react";
import {Text, View, ScrollView, TouchableHighlight, StyleSheet} from 'react-native';
import PropTypes from 'prop-types';
import {ASUIIcon, ASUIMenuDropDown} from "../../components";
import ASUIMenuOverlayContainer from "../../components/menu/overlay/ASUIMenuOverlayContainer";


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
                    <View style={styles.header}>
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

const styles = StyleSheet.create({

    header: {
        borderBottomWidth: 1,
        borderBottomColor: '#555'
        // display: 'flex',
        // justifyContent: 'space-between',
        // flexDirection:'row',
        // flexWrap:'wrap',
    },

    menuButton: {
        position: 'absolute'
    },

    title: {
        fontWeight: 'bold',
        textAlign: 'center',
        paddingTop: 6,
        paddingBottom: 6,
    },

    default: {
        display: 'flex',
    },

    footer: {
        paddingLeft: 2,
        paddingRight: 2,
        borderTopWidth: 1,
        borderTopColor: '#555',
        // display: 'flex',
        flexDirection:'row',
        justifyContent: 'space-between',
    }

});
