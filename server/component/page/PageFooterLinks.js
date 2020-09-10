import * as React from "react";

import "./assets/PageContainer.css";
import PropTypes from "prop-types";


import {pageList} from "../../pages/";


export default class PageFooterLinks extends React.Component {
    /** Property validation **/
    static propTypes = {
        currentPath: PropTypes.string.isRequired,
        footerLinks: PropTypes.object,
    };

    getFooterLinks() {
        const links = [];
        pageList.forEach(([page, path, title, headerLink, footerLink], i) => {
            if(footerLink)
                links.push([path, title]);
        });
        return links;
    }

    render() {
        const links = this.props.footerLinks || this.getFooterLinks();
        return (
            <div className="aspage-footer-links">
                {links.map(([href, title], i) => {
                    const props = {
                        href
                    };
                    if(this.props.currentPath === href)
                        props.className = 'selected';
                    return <a key={i} {...props}>{title}</a>
                } )}
            </div>
        );
    }

}
