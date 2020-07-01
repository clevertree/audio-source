import * as React from "react";

import "./assets/PageContainer.css";
import PropTypes from "prop-types";

export default class PageHeaderLinks extends React.Component {

    /** Property validation **/
    static propTypes = {
        currentPath: PropTypes.string.isRequired,
        headerLinks: PropTypes.object,
    };


    render() {
        const headerLinks = this.props.headerLinks || this.getHeaderLinks();
        return (
            <div className="aspage-header-links">
                {headerLinks.map((linkInfo, i) => {
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


    getHeaderLinks() {
        return [
            {title: 'Home', href: '/'},
            {title: 'About', href: '/about'},
            {title: 'Demo', href: '/composer'},
            // {title: 'Try Player', href: '/player'},
            {title: 'Downloads', href: '/downloads'},
        ]
    }

}
