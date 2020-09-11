import React from 'react';

import "./ASUIAnchor.css"

/** Div **/
export default class ASUIAnchor extends React.Component {

    render() {
        let className = 'asui-anchor';
        if(this.props.className)
            className += ' ' + this.props.className;
        return <a {...this.props} className={className} />;
    }
}

