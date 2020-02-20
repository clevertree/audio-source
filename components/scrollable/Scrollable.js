import React from 'react';

import "./assets/Scrollable.css";

/** Div **/
class Scrollable extends React.Component {

    render() {
        return <div className="asui-scrollable" {...this.props}/>;
    }
}

export default Scrollable;
