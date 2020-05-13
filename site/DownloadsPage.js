import * as React from "react";
import PageContainer from "./page/PageContainer";
import Paragraph from "./component/paragraph/Paragraph";
import Link from "./component/link/Link";
import Header from "./component/header/Header";

import PageHeader from "./page/PageHeader";
import PageHeaderLinks from "./page/PageHeaderLinks";
import PageFooter from "./page/PageFooter";
import PageFooterLinks from "./page/PageFooterLinks";
import PageContent from "./page/PageContent";

export default class DownloadsPage extends React.Component {
    render() {
        console.log('this.props', this.props)
        return <PageContainer>
            <PageHeader/>
            <PageHeaderLinks currentPath={this.props.location.pathname} />
            <PageContent>
                <Header>Android Downloads</Header>
                <Paragraph>
                    The Audio Source Composer Alpha Demo is available for download on Android Devices:
                </Paragraph>
                <Paragraph>
                    <Link href={`https://files.audiosource.io/releases/android/Audio Source Composer(v0.5.3).apk`}>Audio Source Composer(v0.5.3).apk</Link>
                </Paragraph>
                <Paragraph>
                    <Link href={`https://files.audiosource.io/releases/android/Audio Source Composer(v0.5.1).apk`}>Audio Source Composer(v0.5.1).apk</Link>
                </Paragraph>
            </PageContent>
            <PageFooterLinks />
            <PageFooter />
        </PageContainer>;
    }
}


