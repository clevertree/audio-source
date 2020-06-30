import * as React from "react";
import {HTML} from "./component";

import PageContainer from "./theme/PageContainer";

export default class ContactPage extends React.Component {
    render() {
        return (
            <PageContainer currentPath={this.props.location.pathname}>
                <HTML.Header>Contact</HTML.Header>
                <HTML.P>
                    Open-Source means the AudioSource project is free forever, and anyone can join in the development,{'\n'}
                    so we're always looking for testers, artists, and all kinds of musician to {'\n'}
                    <HTML.A href="https://github.com/clevertree/audio-source-composer/issues/4">contribute</HTML.A>.
                </HTML.P>

                <HTML.P>
                    Currently the composer is in{'\n'}
                    <HTML.A href="https://github.com/clevertree/audio-source-composer">active development</HTML.A>{'\n'}
                    and has not yet been released.{'\n'}
                    Check back often for updates as we get closer to Beta!{'\n'}
                    If you want to join up, please contact us on the {'\n'}
                    <HTML.A href="https://github.com/clevertree">GitHub page</HTML.A>.
                </HTML.P>

                <HTML.P>
                    More to come...
                </HTML.P>

            </PageContainer>
        );
    }
}


