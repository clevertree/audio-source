import * as React from "react";
import PageContainer from "./theme/PageContainer";
import {HTML, ImageLink} from "./component/";


export default class HomePage extends React.Component {
    render() {
        return (
            <PageContainer currentPath={this.props.location.pathname}>
                <HTML.Header>Introduction to Audio Source</HTML.Header>

                <HTML.P>
                    The Audio Source Composer is an{'\n'}
                    <HTML.A href="https://github.com/clevertree/audio-source-composer">Open-Source</HTML.A>{'\n'}
                    Digital Audio Workstation built on the{'\n'}
                    <HTML.A href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API">WebAudioAPI</HTML.A>{'\n'}
                    to work on all platforms from browsers to desktops to mobile devices.{'\n'}
                </HTML.P>
                <HTML.P>
                    The main goal of the AudioSource project is to provide an easy all-platform music composer pre-loaded with as many free sample libraries we can compile.{'\n'}
                    This allows aficionados of all music to not only listen, but explore the 'source' of the music they love, and hopefully be inspired to write music of their own.{'\n'}

                    Open-Source means the AudioSource project is free forever, and anyone can join in the development,{'\n'}
                    so we're always looking for testers, artists, and all kinds of musician to {'\n'}
                    <HTML.A href="https://github.com/clevertree/audio-source-composer/issues/4">contribute</HTML.A>.

                    Additionally the AudioSource website will allow user submissions of composed songs, much like other music sites offer.{'\n'}
                    The main difference is that songs written in Audio Source Composer will allow users to not only render the song, but view it's source.{'\n'}
                </HTML.P>
                <HTML.P>
                    Currently the composer is in{'\n'}
                    <HTML.A href="https://github.com/clevertree/audio-source-composer">active development</HTML.A>{'\n'}
                    and has not yet been released.{'\n'}
                    Check back often for updates as we get closer to Beta!{'\n'}
                </HTML.P>



                <HTML.Header>Web Browser Demo (Alpha)</HTML.Header>
                <HTML.P>
                    Click the image below to try Audio Source Composer (Alpha) on your browser.
                </HTML.P>
                <ImageLink
                    href="/composer"
                    src={require("../assets/screenshots/browser-portrait1.png")}
                    />

                <HTML.Header>Android Demo (Alpha)</HTML.Header>
                <HTML.P>
                    Click the image below for information on how to download Audio Source Composer Alpha Demo to your Android Device.
                </HTML.P>
                <ImageLink
                    href="/downloads"
                    src={require("../assets/screenshots/android-portrait1.png")}
                    />

                <HTML.Header>iOS Demo (Unreleased)</HTML.Header>
                <HTML.P>
                    The iOS .ipa file can only be loaded into a pre-provisioned device, so no Alpha of iOS is available yet.
                    Contact me if you're interested in joining the Alpha/Beta testing loops.
                </HTML.P>
                <ImageLink
                    href="/downloads"
                    src={require("../assets/screenshots/ios-portrait1.png")}
                    />

                <HTML.Header>Instruments</HTML.Header>
            </PageContainer>
        );
    }
}
