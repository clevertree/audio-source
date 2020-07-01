import * as React from "react";

import "./assets/PageContainer.css";
import PropTypes from "prop-types";

import {headerLinks} from "../../index";

export default class PageHeaderLinks extends React.Component {

    /** Property validation **/
    static propTypes = {
        currentPath: PropTypes.string.isRequired,
        headerLinks: PropTypes.object,
    };


    render() {
        const links = this.props.headerLinks || headerLinks;
        return (
            <div className="aspage-header-links">
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
