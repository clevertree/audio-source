import React from "react";

import {ASUIPanel, ASUIFormMessage, ASUIClickable, ASUIModal, ASUIAnchor} from "../../components";
import PropTypes from "prop-types";

export default class ASComposerPublishSuccessModal extends React.Component {

    /** Property validation **/
    static propTypes = {
        modalArgs: PropTypes.any,
    };

    constructor(props) {
        super(props);
        this.state = {};
        const composer = props.composer;
        this.cb = {
            closeModal: () => composer.toggleModal(null),
            copyToClipboard: () => this.copyToClipboard()
        }
        this.ref = {
            // email: React.createRef(),
        }

    }

    getComposer() { return this.props.composer; }

    render() {
        let {
            songURL,
            message
        } = this.props.modalArgs || {};

        songURL = new URL(songURL, document.location.origin).toString();
        return (
            <ASUIModal
                onClose={this.cb.closeModal}
            >
                <ASUIPanel
                    large
                    horizontal
                    header="Publish Successful">
                    <ASUIFormMessage>
                        <ASUIAnchor href={songURL} target="_blank">{message}</ASUIAnchor>
                    </ASUIFormMessage>
                    {/*<ASUIFormMessage>*/}
                    {/*    <ASUIAnchor href={composerURL} target="_blank">Player URL</ASUIAnchor>*/}
                    {/*</ASUIFormMessage>*/}
                    {/*<ASUIFormMessage>*/}
                    {/*    <ASUIAnchor href={songURL} target="_blank">Source File: {songURL.split('/').pop()}</ASUIAnchor>*/}
                    {/*</ASUIFormMessage>*/}
                    <ASUIClickable
                        button center
                        size="large"
                        onAction={() => this.copyToClipboard(songURL)}
                    >Copy URL to clipboard</ASUIClickable>
                    <ASUIClickable
                        button center
                        size="large"
                        onAction={this.cb.closeModal}
                    >Close</ASUIClickable>
                </ASUIPanel>
            </ASUIModal>
        );
    }

    copyToClipboard(textContent) {
        var textarea = document.createElement("textarea");
        textarea.textContent = textContent;
        textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in Microsoft Edge.
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand("copy");  // Security exception may be thrown by some browsers.
            this.getComposer().setStatus(`Copy to clipboard successful:\n\t${textContent}`);
        }
        catch (ex) {
            this.getComposer().setError("Copy to clipboard failed.");
        }
        finally {
            document.body.removeChild(textarea);
        }
    }

}



