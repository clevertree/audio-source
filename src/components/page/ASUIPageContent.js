import * as React from "react";

import "./assets/ASUIPage.css";

export default class ASUIPageContent extends React.Component {
    render() {
        return (
            <div className="asui-page-content">
                {this.props.children}
            </div>
        );
    }
}
