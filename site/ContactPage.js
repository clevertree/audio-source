import * as React from "react";
import PageContainer from "./theme/PageContainer";
import Paragraph from "./component/paragraph/Paragraph";
import Header from "./component/header/Header";

import PageHeader from "./theme/PageHeader";
import PageHeaderLinks from "./theme/PageHeaderLinks";
import PageFooter from "./theme/PageFooter";
import PageFooterLinks from "./theme/PageFooterLinks";
import PageContent from "./theme/PageContent";

export default class ContactPage extends React.Component {
    render() {
        console.log('this.props', this.props)
        return <PageContainer>
            <PageHeader/>
            <PageHeaderLinks currentPath={this.props.location.pathname} />
            <PageContent>
                <Header>Contact</Header>
                <Paragraph>
                    Coming Soon...
                </Paragraph>
            </PageContent>
            <PageFooterLinks />
            <PageFooter />
        </PageContainer>;
    }
}


