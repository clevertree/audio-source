import * as React from "react";
import PageContainer from "./theme/PageContainer";

import ASComposer from "../composer/ASComposer";

export default class AboutPage extends React.Component {
    render() {
        return (
            <PageContainer currentPath={this.props.location.pathname}>
                <ASComposer/>
            </PageContainer>
        );
    }
}


