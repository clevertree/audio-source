import * as React from "react";

import "./PageLink.css"

export default class PageLink extends React.Component {
    render() {
        return <a className="aspage-link" href={this.props.href}>
            {this.props.children}
        </a>
    }
}

