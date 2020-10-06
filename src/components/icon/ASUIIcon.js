import React from 'react';
import PropTypes from "prop-types";

import IconList from "./assets/IconList";
import "./assets/ASUIIcon.css";

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
        if(this.props.size)
            className += ' ' + this.props.size;
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
