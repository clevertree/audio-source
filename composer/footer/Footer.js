import React from "react";

import "./assets/Footer.css";

class Footer extends React.Component {
    render() {
        return (
            <div key="footer" className="asp-footer-container">
                <div className="asp-status-text">{this.props.player.status}</div>
                <div className="asp-version-text">{this.props.player.version}</div>
            </div>
        );

    }
}


/** Export this script **/
export default Footer;

