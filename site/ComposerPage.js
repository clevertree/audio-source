import * as React from "react";
import PageContainer from "./theme/PageContainer";

import ASComposer from "../composer/ASComposer";
import {HTML} from "./component";

export default class AboutPage extends React.Component {
    render() {
        return (
            <PageContainer currentPath={this.props.location.pathname}>
                <ASComposer/>

                <HTML.Header>Audio Source Composer Demo</HTML.Header>
                <HTML.P>
                    Tips #1: Menu->View->Fullscreen to render in full screen.
                </HTML.P>

                <HTML.P>
                    More instructions coming soon...
                </HTML.P>
            </PageContainer>
        );
    }
}


