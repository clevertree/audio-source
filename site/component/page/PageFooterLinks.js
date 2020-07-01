import * as React from "react";

import "./assets/PageContainer.css";
import PropTypes from "prop-types";


import {footerLinks} from "../../index";


export default class PageFooterLinks extends React.Component {
    /** Property validation **/
    static propTypes = {
        currentPath: PropTypes.string.isRequired,
        footerLinks: PropTypes.object,
    };

    render() {
        const links = this.props.footerLinks || footerLinks;
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
