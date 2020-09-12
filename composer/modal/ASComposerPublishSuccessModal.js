import React from "react";

import {ASUIPanel, ASUIFormMessage, ASUIClickable, ASUIModal} from "../../components";

export default class ASComposerPublishSuccessModal extends React.Component {
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
        return (
            <ASUIModal
                onClose={this.cb.closeModal}
            >
                <ASUIPanel
                    large
                    horizontal
                    header="Publish Successful">
                    <ASUIFormMessage children="Publish Successful"/>
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



