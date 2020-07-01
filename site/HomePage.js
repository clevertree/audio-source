import * as React from "react";
import {PageContainer, Markdown} from "./component";


export default class HomePage extends React.Component {
    render() {
        return (
            <PageContainer currentPath={this.props.location.pathname}>
                <Markdown source={`
                    # Introduction to Audio Source
                    The Audio Source Composer is an [Open-Source](#https://github.com/clevertree/audio-source-composer)
                    Digital Audio Workstation built on the
                    [WebAudioAPI](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
                    to work on all platforms from browsers to desktops to mobile devices.
                    
                    
                    The main goal of the AudioSource project is to provide an easy all-platform music composer pre-loaded with as many free sample libraries we can compile.
                    This allows aficionados of all music to not only listen, but explore the 'source' of the music they love, and hopefully be inspired to write music of their own.
                    Open-Source means the AudioSource project is free forever, and anyone can join in the development,
                    so we're always looking for testers, artists, and all kinds of musician to 
                    [contribute](https://github.com/clevertree/audio-source-composer/issues/4).
                    Additionally the AudioSource website will allow user submissions of composed songs, much like other music sites offer.
                    The main difference is that songs written in Audio Source Composer will allow users to not only render the song, but view it's source.
                    
                    Currently the composer is in
                    [active development](https://github.com/clevertree/audio-source-composer)
                    and has not yet been released.
                    Check back often for updates as we get closer to Beta!
                    
                    
                    
                    
                    
                    
                    # Web Browser Demo (Alpha)
                    Click the image below to try Audio Source Composer (Alpha) on your browser.

                    [![Browser Portrait](${require("../assets/screenshots/browser-portrait1.png")})](/composer "Composer")
                    
                    
                    
                    
                    
                    
                    # Android Demo (Alpha)
                    Click the image below for information on how to download Audio Source Composer Alpha Demo to your Android Device.

                    [![Android Portrait](${require("../assets/screenshots/android-portrait1.png")})](/downloads "Downloads")
                    
                    
                    
                    
                    
                    
                    # iOS Demo (Unreleased)
                    The iOS .ipa file can only be loaded into a pre-provisioned device, so no Alpha of iOS is available yet.
                    Contact me if you're interested in joining the Alpha/Beta testing loops.

                    [![iOS Portrait](${require("../assets/screenshots/ios-portrait1.png")})](/downloads "Downloads")
                    
                    
                    # Instruments
                    Coming Soon...

                `}/>
            </PageContainer>
        );
    }
}
