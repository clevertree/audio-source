import * as React from "react";

import "./Link.css"

export default class ImageLink extends React.Component {
    render() {
        return <a className="aspage-link-image" href={this.props.href} >
            <img src={this.props.src}  alt={this.props.alt || 'Page Image Link'}/>
        </a>;
    }
}
