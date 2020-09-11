import React from "react";

import {ASUIPanel, ASUIForm, ASUIFormEntry, ASUIFormMessage, ASUIClickable, ASUIInputText, ASUIInputPassword, ASUIModal, ASUIAnchor} from "../../components";
import ClientUserSession from "../../server/client/ClientUserSession";

export default class ASComposerSessionPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showLogin: false,
            error: null
        }
        this.cb = {
            toggleModal: () => this.toggleModal(),
            showLoginForm: () => this.showLoginForm(),
            showRegistrationForm: () => this.showRegistrationForm(),
            onSubmitLoginForm: () => this.onSubmitLoginForm(),
            onSubmitRegistrationForm: () => this.onSubmitRegistrationForm(),
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
            <ASUIPanel
                viewKey="session"
                header="session">
                <ASUIClickable
                    button wide
                    arrow={'▼'}
                    className="keyboard-octave"
                    onAction={this.cb.toggleModal}
                    title="Log in"
                >Log in</ASUIClickable>
                {this.state.showModal ? <ASUIModal
                    onClose={this.cb.toggleModal}
                >
                    {this.renderModalContent()}
                </ASUIModal> : null}
            </ASUIPanel>
        );
    }

    renderModalContent() {
        switch(this.state.form) {
            default:
            case 'login':
                return (<ASUIPanel
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
                                button
                                size="large"
                                onAction={this.cb.onSubmitLoginForm}
                            >Log In</ASUIClickable>
                        </ASUIFormEntry>
                        <ASUIAnchor
                            className="register"
                            onClick={this.cb.showRegistrationForm}
                        >Need to register?</ASUIAnchor>
                    </ASUIForm>
                </ASUIPanel>);
            case 'registration':
                return (<ASUIPanel
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
                                button
                                size="large"
                                onAction={this.cb.onSubmitRegistrationForm}
                            >Register</ASUIClickable>
                        </ASUIFormEntry>
                        <ASUIAnchor
                            className="login"
                            onClick={this.cb.showLoginForm}
                        >Already have an account?</ASUIAnchor>
                    </ASUIForm>
                </ASUIPanel>);

            case 'registration-success':
                return (<ASUIPanel
                    large
                    horizontal
                    header="Registration Successful">
                    <ASUIFormMessage children="Registration Successful"/>
                    <ASUIClickable
                        button
                        size="large"
                        onAction={this.cb.toggleModal}
                    >Close</ASUIClickable>
                </ASUIPanel>);

            case 'login-success':
                return (<ASUIPanel
                    large
                    horizontal
                    header="Login Successful">
                    <ASUIFormMessage children="Login Successful"/>
                    <ASUIClickable
                        button
                        size="large"
                        onAction={this.cb.toggleModal}
                    >Close</ASUIClickable>
                </ASUIPanel>);
        }
    }

    /** Actions **/

    toggleModal() {
        this.setState({
            showModal: !this.state.showModal,
            form: 'null'
        })
    }

    showRegistrationForm() {
        this.setState({
            showModal: true,
            form: 'registration'
        })
    }

    showLoginForm() {
        this.setState({
            showModal: true,
            form: 'login'
        })
    }

    async onSubmitRegistrationForm() {
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
            await ClientUserSession.register(email, password, username);

            this.setState({
                showModal: true,
                form: 'registration-success'
            })
        } catch (e) {
            console.error(e);
            this.setState({
                error: e.message,
                loading: false
            })
        }
    }

    async onSubmitLoginForm() {
        try {
            this.setState({
                error: null,
                loading: true
            })
            const email = this.ref.email.current.getValue();
            const password = this.ref.password.current.getValue();
            await ClientUserSession.login(email, password);
            await ClientUserSession.session();

            this.setState({
                showModal: true,
                form: 'login-success'
            })
        } catch (e) {
            console.error(e);
            this.setState({
                error: e.message,
                loading: false
            })
        }
    }
}



