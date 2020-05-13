import * as React from "react";

import "./Link.css"

export default class Link extends React.Component {
    render() {
        return <a className="aspage-link" href={this.props.href}>
            {this.props.children}
        </a>
    }
}

