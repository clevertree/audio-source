import * as React from "react";
import PageContainer from "./page/PageContainer";

import PageHeader from "./page/PageHeader";
import PageHeaderLinks from "./page/PageHeaderLinks";
import PageFooter from "./page/PageFooter";
import PageFooterLinks from "./page/PageFooterLinks";
import ASComposer from "../composer/ASComposer";
import PageContent from "./page/PageContent";

export default class AboutPage extends React.Component {
    render() {
        return <PageContainer>
            <PageHeader/>
            <PageHeaderLinks currentPath={this.props.location.pathname} />
            <PageContent>
                <ASComposer/>
            </PageContent>
            <PageFooterLinks />
            <PageFooter />
        </PageContainer>;
    }
}


