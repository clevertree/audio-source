import * as React from "react";
import {PageContainer, Markdown} from "./component";

import ASComposer from "../composer/ASComposer";

export default class AboutPage extends React.Component {
    render() {
        return (
            <PageContainer currentPath={this.props.location.pathname}>
                <Markdown source={`
                    # Audio Source Composer Demo
                    
                    Tips #1: Menu->View->Enable Fullscreen to render in landscape mode.
               
                    More instructions coming soon...
                `}/>

                <ASComposer/>
            </PageContainer>
        );
    }
}


