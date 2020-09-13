import * as React from "react";

import ASUIPageHeader from "./ASUIPageHeader";
import ASUIPageContent from "./ASUIPageContent";
import ASUIPageFooter from "./ASUIPageFooter";
import PropTypes from "prop-types";

import "./assets/ASUIPage.css";
import "./assets/PageStyles.css";

export default class ASUIPageContainer extends React.Component {

    /** Property validation **/
    static propTypes = {
        location: PropTypes.object.isRequired,
        pageList: PropTypes.array,
    };

    render() {
        const pageList = this.props.pageList;
        const headerLinks = [], footerLinks = [];
        if(pageList) {
            pageList.forEach(([page, path, title, headerLink, footerLink], i) => {
                if (headerLink)
                    headerLinks.push([path, title]);
                if (footerLink)
                    footerLinks.push([path, title]);
            });
        }

        const currentPath = this.props.location.pathname;

        return (
            <div className={`asui-page-container asui-page${currentPath.replace('/','-')}`}>
                <ASUIPageHeader currentPath={currentPath} links={headerLinks}/>
                <ASUIPageContent>
                    {this.props.children}
                </ASUIPageContent>
                <ASUIPageFooter currentPath={currentPath} links={footerLinks}/>
            </div>
        );
    }
}
