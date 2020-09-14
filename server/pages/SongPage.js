import * as React from "react";
import {ASUIPageContainer, ASUIMarkdown} from "../../components";

import ASComposer from "../../composer/ASComposer";

export default class SongPage extends React.Component {
    render() {
        return (
            <ASUIPageContainer {...this.props}>
                <ASUIMarkdown source={`
                    # Song Page
                `}/>

                <ASComposer location={this.props.location}/>
            </ASUIPageContainer>
        );
    }
}


