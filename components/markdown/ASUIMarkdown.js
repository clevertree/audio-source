import * as React from "react";

import ReactMarkdown from 'react-markdown';
import "./ASUIMarkdown.css";

export default class ASUIMarkdown extends React.Component {
    render() {
        if(this.props.updateLinkTargets)
            setTimeout(updateLinkTargets, 1000); // TODO: just on markdown content?
        let source = this.props.children || this.props.source;
        if(this.props.trim !== false)
            source = source.trim().split("\n").map(line => line.trim()).join("\n");
        return (
            // <div className="asui-page-markdown">
                <ReactMarkdown
                    escapeHtml={false}
                    source={source}
                    />
            // </div>
        );
    }
}

ASUIMarkdown.updateLinkTargets = updateLinkTargets;

function updateLinkTargets() {
    var all_links = document.querySelectorAll('.asui-page-content a');
    for (var i = 0; i < all_links.length; i++){
        var a = all_links[i];
        if(a.hostname != document.location.hostname) {
            a.rel = 'noopener';
            a.target = '_blank';
            console.log("Link is external: ", a);
        }
    }
}
