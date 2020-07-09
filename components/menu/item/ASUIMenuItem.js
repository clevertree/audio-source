import React from "react";

import './ASUIMenuItem.css';

export default class ASUIMenuItem extends React.Component {
    render() {
        let className = 'asui-menu-item disabled';

        return (
            <div
                title={this.props.title}
                className={className}
            >
                {this.props.children}
            </div>
        );
    }

}
