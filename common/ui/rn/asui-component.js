
import React from 'react';
import {
    SafeAreaView,
    StyleSheet,
    ScrollView,
    View,
    Text,
    StatusBar, ImageBackground,
} from 'react-native';
import {DebugInstructions, Header, LearnMoreLinks, ReloadInstructions} from "react-native/Libraries/NewAppScreen";
import Colors from "react-native/Libraries/NewAppScreen/components/Colors";


type Props = {};
class ASUIComponentBase extends React.Component<Props> {

    constructor(props={}) {
        super(props);
        this.attributes = [];
        this.state = {
        };
    }

    getChildren() {
        const each = (child) =>  {
            if(typeof child === "function")
                child = child(this);
            if(child === null || typeof child === "undefined") {
                child = null;
            } else if(Array.isArray(child)) {
                for(let i=0; i<child.length; i++) {
                    child[i] = each(child[i]);
                }
            } else if(typeof child === "string" || typeof child === "number") {
                child = <Text>{child}</Text>;
            }
            return child;
        };

        const children = this.props.children || null;
        return each(children);
    }

    render() {
        return this.renderReactNative();
    }

    renderReactNative() {
        return <View style={[this.props.style, {display: 'flex'}]}>{this.renderAll()}</View>;
    }

    renderAll() {
        throw new Error("Not Implemented")
    }

    static getStyles() {
        return [
            require('../../assets/audio-source-common.style.js').default
        ]
    }


    static addStyleList(props, key) {
        let styleList = props.style;
        if(!Array.isArray(styleList))
            styleList = styleList ? [styleList] : [];

        const styleObjectList = this.getStyles();
        for(let i=0; i<styleObjectList.length; i++) {
            const styleObject = styleObjectList[i][key];
            if(typeof styleObject === 'object') {
                // console.log("Adding style ", key, styleObject, styleObjectList);
                styleList.push(styleObject);
            }
        }
        if(styleList.length > 0)
            props.style = StyleSheet.flatten(styleList);
    }

    static processProps(props, additionalProps=[]) {
        if(typeof props === "string")
            props = {key: props};
        if(typeof props !== "object")
            throw new Error("Invalid props: " + typeof props);
        for(let i=0; i<additionalProps.length; i++)
            Object.assign(props, additionalProps[i]);
        this.addStyleList(props, this.name);
        if(props.key)
            this.addStyleList(props, props.key);
        return props;
    }

    static createElement(props, children=null, ...additionalProps) {
        props = this.processProps(props, additionalProps);
        // if(typeof props.class !== "undefined" && typeof props.key === "undefined")
        //     props.key = props.class; // TODO: Hack to suppress warning

        const React = require('react');
        const thisClass = this;
        // console.log('React.createElement', React.createElement, thisClass, children);
        const ret = React.createElement(thisClass, props, children);
        return ret;
    }

}

export default ASUIComponentBase;