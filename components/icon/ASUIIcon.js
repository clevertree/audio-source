import React from 'react';
import PropTypes from "prop-types";

import "./assets/ASUIIcon.css";
import IconList from "./assets/IconList";

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
        let className = "asui-icon";
        let source = this.props.source;
        let alt = 'Icon';
        if(typeof source === "string") {
            alt = source;
            source = new IconList().getSource(source);
        }
        return <img className={className} alt={alt} src={source}/>;
    }

}

export default ASUIIcon;
