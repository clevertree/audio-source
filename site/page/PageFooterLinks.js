import * as React from "react";

import "./assets/PageContainer.css";

export default class PageFooterLinks extends React.Component {
    render() {
        const footerLinks = this.props.footerLinks || this.getFooterLinks();
        return (
            <div className="aspage-footer-links" >
                {footerLinks.map(linkInfo => <a href={linkInfo.href}>{linkInfo.title}</a> )}
            </div>
        );
    }

    getFooterLinks() {
        return [
            {title: 'Home', href: '/'},
            {title: 'Contact', href: '/contact'},
        ]
    }
}
