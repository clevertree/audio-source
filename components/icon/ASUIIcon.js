import React from 'react';
import PropTypes from "prop-types";

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
        if(this.props.source) {
            className += ' ' + this.props.source;
        }
        return <div className={className}/>;
    }

}

export default ASUIIcon;
