import React from 'react';
import PropTypes from "prop-types";

import {Image} from 'react-native';

import Style from './assets/ASUIIcon.style'
import {IconList} from "./assets/IconList";

Style.container;
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
        return <Image {...this.props} source={source}/>;
    }
}

export default ASUIIcon;
