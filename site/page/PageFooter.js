import * as React from "react";

import "./assets/PageContainer.css";

export default class PageFooter extends React.Component {
    render() {
        return (
            <div className="aspage-footer" >
                <div className="aspage-footer-text">
                    Created by <a href="https://github.com/clevertree/" target="_blank">Ari Asulin</a>
                </div>
            </div>
        );
    }
}
