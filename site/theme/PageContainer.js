import * as React from "react";

import "./assets/PageContainer.css";

export default class PageContainer extends React.Component {
    render() {
        return <div className="aspage-container">
            {this.props.children}
        </div>
    }
}
