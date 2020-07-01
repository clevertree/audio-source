import * as React from "react";

import ReactMarkdown from 'react-markdown';
import "./MarkDown.css";

export default class Markdown extends React.Component {
    render() {
        return (
            // <div className="aspage-markdown">
                <ReactMarkdown
                    escapeHtml={false}
                    children={this.props.children}
                    />
            // </div>
        );
    }
}
