import React from 'react';
import PropTypes from "prop-types";

import {View, Image} from 'react-native';

import styles from './assets/ASUIIcon.style'
import {IconList} from "./assets/IconList";

/** Icon **/
class ASUIIcon extends React.Component {

    /** Property validation **/
    static propTypes = {
        source: PropTypes.any.isRequired,
    };


    constructor(props = {}) {
        super(props, {});
    }

    render() {
        let source = this.props.source;
        if(typeof source === "string")
            source = new IconList().getSource(source);
        return <View style={styles.container}>
            <Image style={styles.image} source={source}/>
        </View>;
    }
}

export default ASUIIcon;
