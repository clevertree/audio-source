import * as React from "react";
import {PageContainer, Markdown} from "./component";

import ASComposer from "../composer/ASComposer";

export default class DemoPage extends React.Component {
    render() {
        return (
            <PageContainer currentPath={this.props.location.pathname}>
                <Markdown source={`
                    # Audio Source Composer Demo
                `}/>

                <ASComposer/>
                <Markdown source={`
                    Menu->View->Enable Fullscreen to render in landscape mode.
                    
                    [or load the Composer by itself](/composer)
               
                    More instructions coming soon...
                `}/>
            </PageContainer>
        );
    }
}


