import * as React from "react";
import PageContainer from "./page/PageContainer";
import Paragraph from "./component/paragraph/Paragraph";
import Header from "./component/header/Header";

import PageHeader from "./page/PageHeader";
import PageHeaderLinks from "./page/PageHeaderLinks";
import PageFooter from "./page/PageFooter";
import PageFooterLinks from "./page/PageFooterLinks";
import PageContent from "./page/PageContent";

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


