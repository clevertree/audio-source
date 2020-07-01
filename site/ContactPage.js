import * as React from "react";
import {PageContainer, Markdown} from "./component";

export default class ContactPage extends React.Component {
    render() {
        return (
            <PageContainer currentPath={this.props.location.pathname}>
                <Markdown source={`
                    # Contact
                    
                    Open-Source means the AudioSource project is free forever, and anyone can join in the development,
                    so we're always looking for testers, artists, and all kinds of musician to 
                    [contribute](https://github.com/clevertree/audio-source-composer/issues/4).

                    Currently the composer is in
                    [active development](https://github.com/clevertree/audio-source-composer)
                    and has not yet been released.
                    Check back often for updates as we get closer to Beta!{
                    If you want to join up, please contact us on the 
                    [GitHub page](https://github.com/clevertree).
               
                    Check back often for updates as we get closer to Beta!
                `}/>
            </PageContainer>
        );
    }
}


