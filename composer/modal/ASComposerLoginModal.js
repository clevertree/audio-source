import React from "react";

import {ASUIPanel, ASUIForm, ASUIFormEntry, ASUIFormMessage, ASUIClickable, ASUIInputText, ASUIInputPassword, ASUIModal, ASUIAnchor} from "../../components";
import ClientUserAPI from "../../server/user/ClientUserAPI";

export default class ASComposerLoginModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
            loading: false,
        }
        const composer = props.composer;
        this.cb = {
            closeModal: () => composer.toggleModal(null),
            showRegistrationModal: () => composer.toggleModal('registration'),
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
                        <ASUIFormEntry className="email" header="Email">
                            <ASUIInputText
                                size="large"
                                type="email"
                                required
                                placeholder="user@place.com"
                                ref={this.ref.email}
                            />
                        </ASUIFormEntry>
                        <ASUIFormEntry className="password" header="Password">
                            <ASUIInputPassword
                                size="large"
                                ref={this.ref.password}
                            />
                        </ASUIFormEntry>
                        <ASUIFormEntry className="submit" header="Submit">
                            <ASUIClickable
                                button center
                                size="large"
                                onAction={this.cb.onSubmitForm}
                            >Log In</ASUIClickable>
                        </ASUIFormEntry>
                        <ASUIAnchor
                            className="register"
                            onClick={this.cb.showRegistrationModal}
                        >Need to register?</ASUIAnchor>
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
            const email = this.ref.email.current.getValue();
            const password = this.ref.password.current.getValue();
            const userAPI = new ClientUserAPI();
            const responseJSON = await userAPI.login(email, password);

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



