import React from "react";

import {ASUIPanel, ASUIFormMessage, ASUIClickable, ASUIModal} from "../../components";
import PropTypes from "prop-types";

export default class ASComposerMessageModal extends React.Component {
    /** Property validation **/
    static propTypes = {
        modalArgs: PropTypes.any.isRequired,
    };

    constructor(props) {
        super(props);
        this.state = {};
        const composer = props.composer;
        this.cb = {
            closeModal: () => composer.toggleModal(null),
        }
    }

    getComposer() { return this.props.composer; }

    render() {
        let modalArgs = this.props.modalArgs;
        if(typeof modalArgs !== "object")
            modalArgs = {
                children: modalArgs
            }
        const {
            header,
            children
        } = modalArgs;
        return (
            <ASUIModal
                onClose={this.cb.closeModal}
            >
                <ASUIPanel
                    large
                    horizontal
                    header={header || "Message"}>
                    <ASUIFormMessage children={children}/>
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



