import * as React from "react";

import "./assets/PageContainer.css";

export default class PageContainer extends React.Component {
    render() {
        const headerLinks = this.props.headerLinks || this.getHeaderLinks();
        const footerLinks = this.props.footerLinks || this.getFooterLinks();
        return <div className="aspage-container">
            <div className="aspage-header">
                <img src={require("./assets/img/header.png")} className="aspage-header-image"  alt="Audio Source Header Image"/>
            </div>
            <div className="aspage-header-links">
                {headerLinks.map(linkInfo => <a href={linkInfo.href}>{linkInfo.title}</a> )}
            </div>
            <div className="aspage-content">
                {this.props.children}
            </div>
            <div className="aspage-footer-links" >
                {footerLinks.map(linkInfo => <a href={linkInfo.href}>{linkInfo.title}</a> )}
            </div>
            <div className="aspage-footer" >
                <div className="aspage-footer-text">
                    Created by <a href="https://github.com/clevertree/">Ari Asulin</a>
                </div>
            </div>
        </div>
    }


    getHeaderLinks() {
        return [
            {title: 'Home', href: '/'},
            {title: 'Composer', href: '/composer'},
            {title: 'Player', href: '/player'},
            {title: 'About', href: '/about'},
        ]
    }

    getFooterLinks() {
        return [
            {title: 'Home', href: '/'},
            {title: 'Contact', href: '/contact'},
        ]
    }
}
