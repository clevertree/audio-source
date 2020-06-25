import * as React from "react";
import {HTML} from "./component";

import PageContainer from "./theme/PageContainer";
import PageHeader from "./theme/PageHeader";
import PageHeaderLinks from "./theme/PageHeaderLinks";
import PageFooter from "./theme/PageFooter";
import PageFooterLinks from "./theme/PageFooterLinks";
import PageContent from "./theme/PageContent";

export default class DownloadsPage extends React.Component {
    render() {
        console.log('this.props', this.props)
        return <PageContainer>
            <PageHeader/>
            <PageHeaderLinks currentPath={this.props.location.pathname} />
            <PageContent>
                <HTML.Header>Android Downloads</HTML.Header>
                <HTML.P>
                    The Audio Source Composer Alpha Demo is available for download on Android Devices:
                </HTML.P>
                <HTML.P>
                    <HTML.A href={`https://files.audiosource.io/releases/android/Audio Source Composer(v0.5.4).apk`}>Audio Source Composer(v0.5.4).apk</HTML.A>
                </HTML.P>
                <HTML.P>
                    <HTML.A href={`https://files.audiosource.io/releases/android/Audio Source Composer(v0.5.3).apk`}>Audio Source Composer(v0.5.3).apk</HTML.A>
                </HTML.P>
                <HTML.P>
                    <HTML.A href={`https://files.audiosource.io/releases/android/Audio Source Composer(v0.5.1).apk`}>Audio Source Composer(v0.5.1).apk</HTML.A>
                </HTML.P>
                <HTML.P>
                    Check back often for updates as we get closer to Beta!{'\n'}
                </HTML.P>
            </PageContent>
            <PageFooterLinks />
            <PageFooter />
        </PageContainer>;
    }
}


