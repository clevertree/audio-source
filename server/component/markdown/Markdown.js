import * as React from "react";

import ReactMarkdown from 'react-markdown';
import "./Markdown.css";

export default class Markdown extends React.Component {
    render() {
        let source = this.props.children || this.props.source;
        if(this.props.trim !== false)
            source = source.trim().split("\n").map(line => line.trim()).join("\n");
        return (
            // <div className="aspage-markdown">
                <ReactMarkdown
                    escapeHtml={false}
                    source={source}
                    />
            // </div>
        );
    }
}
