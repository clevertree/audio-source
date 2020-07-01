import * as React from "react";
import {PageContainer, Markdown} from "./component";

export default class DownloadsPage extends React.Component {
    render() {
        return (
            <PageContainer currentPath={this.props.location.pathname}>
                <Markdown source={`
                    # Android Downloads
                    
                    The Audio Source Composer Alpha Demo is available for download on Android Devices:

                    [Audio Source Composer(v0.5.4).apk](https://files.audiosource.io/releases/android/Audio%20Source%20Composer(v0.5.4).apk)
                    
                    [Audio Source Composer(v0.5.3).apk](https://files.audiosource.io/releases/android/Audio%20Source%20Composer(v0.5.3).apk)
                    
                    [Audio Source Composer(v0.5.1).apk](https://files.audiosource.io/releases/android/Audio%20Source%20Composer(v0.5.1).apk)
               
                    Check back often for updates as we get closer to Beta!
                `}/>
            </PageContainer>
        );
    }
}


