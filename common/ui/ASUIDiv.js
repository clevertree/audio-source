import React from 'react';

/** Div **/
class ASUIDiv extends React.Component {

    render() {
        return <div className={this.props.className}>{this.props.children}</div>;
    }
}

export default ASUIDiv;
