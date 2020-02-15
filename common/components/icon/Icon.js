import React from 'react';

import "./assets/Icon.css";

/** Icon **/
class Icon extends React.Component {
    constructor(props = {}) {
        super(props, {});
    }

    render() {
        let className = "asui-icon";
        if(this.props.className)
            className += ' ' + this.props.className;
        return <img className={className} />;
    }

}

export default Icon;
