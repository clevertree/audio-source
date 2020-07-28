import React from 'react';

/** Div **/
export default class ASUIDiv extends React.Component {

    render() {
        let children = this.props.children;
        if(typeof children === "function")
            children = children(this);
        return <div {...this.props}>{children}</div>;
    }
}

