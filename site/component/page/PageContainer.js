import * as React from "react";

import PageHeader from "./PageHeader";
import PageHeaderLinks from "./PageHeaderLinks";
import PageContent from "./PageContent";
import PageFooterLinks from "./PageFooterLinks";
import PageFooter from "./PageFooter";
import PropTypes from "prop-types";

import "./assets/PageContainer.css";

export default class PageContainer extends React.Component {

    /** Property validation **/
    static propTypes = {
        currentPath: PropTypes.string.isRequired,
    };

    render() {
        return (
            <div className="aspage-container">
                <PageHeader/>
                <PageHeaderLinks currentPath={this.props.currentPath}/>
                <PageContent>
                    {this.props.children}
                </PageContent>
                <PageFooterLinks currentPath={this.props.currentPath}/>
                <PageFooter />
            </div>
        );
    }
}
