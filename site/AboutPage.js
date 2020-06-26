import * as React from "react";
import {HTML} from "./component";

import PageContainer from "./theme/PageContainer";

export default class AboutPage extends React.Component {
    render() {
        return (
            <PageContainer currentPath={this.props.location.pathname}>
                <HTML.Header>About Audio Source</HTML.Header>
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

                <HTML.Header>Features</HTML.Header>
                <HTML.P>
                    Audio Source Composer works on any modern browser on any phone, tablet or pc.
                    Instruments and Effects can be wrapped in each other to build complex presets.
                    Note tracks can be called recursively for a highly structured song.
                </HTML.P>



                <HTML.Header>What's currently working</HTML.Header>
                <HTML.P>
                    Add, edit, and delete notes and note tracks.
                    Recursively play back tracks by adding a 'Track Note'.
                    Edit note velocity and duration.
                </HTML.P>



                <HTML.Header>Under the Hood: WebAudio API</HTML.Header>
                <HTML.P>
                    Audio Source brings the WebAudio API to mobile by using a WebView as a proxy.
                    Songs, instruments, and samples written for Audio Source will work on any platform.
                    Instruments render using React VirtualDOM on the UI thread while rendering audio in the WebView proxy.
                </HTML.P>
            </PageContainer>
        );
    }
}


