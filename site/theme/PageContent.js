import * as React from "react";

import "./assets/PageContainer.css";

export default class PageContent extends React.Component {
    render() {
        return (
            <div className="aspage-content">
                {this.props.children}
            </div>
        );
    }
}
