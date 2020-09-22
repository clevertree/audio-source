import React from "react";

import {ASUIPanel, ASUIForm, ASUIFormEntry, ASUIFormMessage, ASUIClickable, ASUIModal, ASUIAnchor} from "../../components";
import ClientUserAPI from "../../server/user/ClientUserAPI";

export default class ASComposerLogoutModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
            loading: false,
        }
        const composer = props.composer;
        this.cb = {
            closeModal: () => composer.toggleModal(null),
            showLoginModal: () => composer.toggleModal('login'),
            onSubmitForm: () => this.onSubmitForm(),
        }
        this.ref = {
            email: React.createRef(),
            // username: React.createRef(),
            password: React.createRef(),
            // password_confirm: React.createRef(),
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
                    header="Log in">
                    <ASUIForm>
                        {this.state.error ? <ASUIFormMessage error children={this.state.error}/> : null}
                        <ASUIFormMessage>Submitting this form will end this user session</ASUIFormMessage>
                        <ASUIFormEntry className="submit" header="Submit">
                            <ASUIClickable
                                button center
                                size="large"
                                onAction={this.cb.onSubmitForm}
                            >Log Out</ASUIClickable>
                        </ASUIFormEntry>
                        <ASUIAnchor
                            className="register"
                            onClick={this.cb.showLoginModal}
                        >Log in</ASUIAnchor>
                    </ASUIForm>
                </ASUIPanel>
            </ASUIModal>
        );
    }

    /** Actions **/

    async onSubmitForm() {
        try {
            this.setState({
                error: null,
                loading: true
            })
            const userAPI = new ClientUserAPI();
            const responseJSON = await userAPI.logout();

            this.setState({
                loading: false
            })

            const composer = this.getComposer();
            composer.showModal('message', responseJSON.message || "No message");

            await composer.sessionRefresh();

        } catch (e) {
            console.error(e);
            this.setState({
                error: e.message,
                loading: false
            })
        }
    }
}



