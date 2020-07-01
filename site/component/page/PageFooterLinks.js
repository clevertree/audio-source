import * as React from "react";

import "./assets/PageContainer.css";
import PropTypes from "prop-types";

export default class PageFooterLinks extends React.Component {
    /** Property validation **/
    static propTypes = {
        currentPath: PropTypes.string.isRequired,
        footerLinks: PropTypes.object,
    };

    render() {
        const footerLinks = this.props.footerLinks || this.getFooterLinks();
        return (
            <div className="aspage-footer-links">
                {footerLinks.map((linkInfo, i) => {
                    const props = {
                        href: linkInfo.href
                    };
                    if(this.props.currentPath === linkInfo.href)
                        props.className = 'selected';
                    return <a key={i} {...props}>{linkInfo.title}</a>
                } )}
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
