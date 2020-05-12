import * as React from "react";
import PageContainer from "./theme/PageContainer";
import PageParagraph from "./component/paragraph/PageParagraph";
import PageLink from "./component/link/PageLink";
import PageImageLink from "./component/link/PageImageLink";

export default class HomePage extends React.Component {
    render() {
        return <PageContainer>
            <PageParagraph>
                The Audio Source Composer and Player is an
                {' '}<PageLink href="https://github.com/clevertree/audio-source-composer">Open-Source</PageLink>{' '}
                Digital Audio Workstation built on the
                {' '}<PageLink href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API">WebAudioAPI</PageLink>{' '}
                to work on all platforms from browsers to mobile devices.
            </PageParagraph>
            <PageImageLink
                href="/composer"
                src={require("../assets/screenshots/browser-mobile1.png")}
                >

            </PageImageLink>
            <PageParagraph>
                Click the image above to try Audio Source Composer (Alpha) on your browser.
            </PageParagraph>
        </PageContainer>;
    }
}


