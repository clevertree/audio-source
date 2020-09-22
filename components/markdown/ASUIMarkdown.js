import * as React from "react";

import ReactMarkdown from 'react-markdown';
import "./ASUIMarkdown.css";

export default class ASUIMarkdown extends React.Component {
    render() {
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
