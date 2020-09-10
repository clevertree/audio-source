import * as React from "react";

import "./assets/PageContainer.css";

export default class PageHeader extends React.Component {
    render() {
        return (
            <div className="aspage-header">
                <a href="/">
                    <img src={require("./assets/img/header.png")} className="aspage-header-image" alt="Header"/>
                </a>
            </div>
        );
    }
}
