import * as React from "react";
import PageContainer from "./theme/PageContainer";

import PageHeader from "./theme/PageHeader";
import PageHeaderLinks from "./theme/PageHeaderLinks";
import PageFooter from "./theme/PageFooter";
import PageFooterLinks from "./theme/PageFooterLinks";
import ASComposer from "../composer/ASComposer";
import PageContent from "./theme/PageContent";

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


