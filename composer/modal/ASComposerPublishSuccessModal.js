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
        }
        this.ref = {
            // email: React.createRef(),
        }

    }

    getComposer() { return this.props.composer; }

    render() {
        const {
            message,
            songURL
        } = this.props.modalArgs || {}
        return (
            <ASUIModal
                onClose={this.cb.closeModal}
            >
                <ASUIPanel
                    large
                    horizontal
                    header="Publish Successful">
                    <ASUIFormMessage children={message || "Publish Successful"}/>
                    <ASUIAnchor href={songURL} target="_blank">{songURL}</ASUIAnchor>
                    <ASUIClickable
                        button center
                        size="large"
                        onAction={this.cb.closeModal}
                    >Close</ASUIClickable>
                </ASUIPanel>
            </ASUIModal>
        );
    }

}



