
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



class ASUIComponentBase extends React.Component {

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
        return this.getChildren();
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