import React from "react";

import {ASUIPanel, ASUIForm, ASUIFormEntry, ASUIFormMessage, ASUIClickable, ASUIInputText, ASUIInputPassword, ASUIModal, ASUIAnchor} from "../../components";
import ClientUserAPI from "../../server/user/ClientUserAPI";

export default class ASComposerRegistrationModal extends React.Component {
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
            username: React.createRef(),
            password: React.createRef(),
            password_confirm: React.createRef(),
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
                    header="Register a new account">
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
                        <ASUIFormEntry className="username" header="Username">
                            <ASUIInputText
                                size="large"
                                placeholder="username"
                                pattern="([A-z0-9À-ž]){2,}"
                                ref={this.ref.username}
                            />
                        </ASUIFormEntry>
                        <ASUIFormEntry className="password" header="Password">
                            <ASUIInputPassword
                                size="large"
                                ref={this.ref.password}
                            />
                        </ASUIFormEntry>
                        <ASUIFormEntry className="password_confirm" header="Confirm">
                            <ASUIInputPassword
                                size="large"
                                ref={this.ref.password_confirm}
                            />
                        </ASUIFormEntry>
                        <ASUIFormEntry className="submit" header="Register">
                            <ASUIClickable
                                button center
                                size="large"
                                onAction={this.cb.onSubmitForm}
                            >Register</ASUIClickable>
                        </ASUIFormEntry>
                        <ASUIAnchor
                            className="login"
                            onClick={this.cb.showLoginForm}
                        >Already have an account?</ASUIAnchor>
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
            if(!email)
                throw new Error("Email is required");
            const username = this.ref.username.current.getValue();
            const password = this.ref.password.current.getValue() || null;
            if(password) {
                const password_confirm = this.ref.password_confirm.current.getValue();
                if (password !== password_confirm)
                    throw new Error("Confirmation password doesn't match");
            }
            const userAPI = new ClientUserAPI();
            await userAPI.register(email, password, username);

            this.setState({
                loading: false
            })

            const composer = this.getComposer();
            composer.toggleModal('registration-success');

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



