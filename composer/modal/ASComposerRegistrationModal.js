import React from "react";

import {ASUIPanel, ASUIForm, ASUIFormEntry, ASUIFormMessage, ASUIFormSubmit, ASUIInputText, ASUIInputPassword, ASUIModal, ASUIAnchor} from "../../components";
import ClientUserAPI from "../../server/user/ClientUserAPI";

export default class ASComposerRegistrationModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
            loading: false,
            autoUpdateUsername: true
        }
        const composer = props.composer;
        this.cb = {
            closeModal: e => composer.toggleModal(null),
            showLoginModal: e => composer.toggleModal('login'),
            onSubmitForm: e => this.onSubmitForm(e),
            onChange: {}
        }
        this.ref = {
            form: {}
        }

    }
    getFormRef(fieldName) {
        if(!this.ref.form[fieldName])
            this.ref.form[fieldName] = React.createRef();
        return this.ref.form[fieldName];
    }
    getFormValues() {
        const values = {};
        const formRefs = this.ref.form;
        for(const fieldName in formRefs) {
            if(formRefs.hasOwnProperty(fieldName)) {
                values[fieldName] = formRefs[fieldName].current.getValue();
            }
        }
        return values;
    }

    getComposer() { return this.props.composer; }

    render() {
        const userFields = ClientUserAPI.userFields;
        return (
            <ASUIModal
                onClose={this.cb.closeModal}
            >
                <ASUIPanel
                    large
                    horizontal
                    header="Register a new account">
                    <ASUIForm
                        onSubmit={this.cb.onSubmitForm}
                        action="#"
                    >
                        {this.state.error ? <ASUIFormMessage error children={this.state.error}/> : null}
                        <ASUIFormEntry className="email" header="Email">
                            <ASUIInputText
                                size="large"
                                type="email"
                                required
                                placeholder="user@place.com"
                                ref={this.getFormRef('email')}
                            />
                        </ASUIFormEntry>
                        <ASUIFormEntry className="password" header="Password">
                            <ASUIInputPassword
                                size="large"
                                ref={this.getFormRef('password')}
                            />
                        </ASUIFormEntry>
                        <ASUIFormEntry className="password_confirm" header="Confirm">
                            <ASUIInputPassword
                                size="large"
                                ref={this.getFormRef('password_confirm')}
                            />
                        </ASUIFormEntry>
                        {Object.keys(userFields).map((fieldName, i) => {
                            if(!this.cb.onChange[fieldName])
                                this.cb.onChange[fieldName] = (value) => this.onChange(fieldName, value)
                            const fieldInfo = userFields[fieldName];
                            return <ASUIFormEntry
                                key={i}
                                className={fieldName}
                                header={fieldInfo.label}>
                                <ASUIInputText
                                    size="large"
                                    {...fieldInfo}
                                    onChange={this.cb.onChange[fieldName]}
                                    ref={this.getFormRef(fieldName)}
                                />
                            </ASUIFormEntry>
                        })}
                        <ASUIFormEntry className="submit" header="Register">
                            <ASUIFormSubmit
                                button center
                                size="large"
                            >Register</ASUIFormSubmit>
                        </ASUIFormEntry>
                        <ASUIAnchor
                            className="login"
                            onClick={this.cb.showLoginModal}
                        >Already have an account?</ASUIAnchor>
                    </ASUIForm>
                </ASUIPanel>
            </ASUIModal>
        );
    }

    /** Actions **/

    onChange(fieldName, value) {
        switch(fieldName) {
            case 'artistTitle':
                const usernameRef = this.getFormRef('username');
                const artistTitleRef = this.getFormRef('artistTitle');
                const artistTitle = value.replace(/[^A-z0-9À-ž _-]+/g, ' ');
                if(this.state.autoUpdateUsername && usernameRef.current) {
                    const username = value.replace(/[^A-z0-9À-ž_-]+/g, '_').toLowerCase();
                    usernameRef.current.setValue(username)
                }
                if(artistTitle !== value)
                    artistTitleRef.current.setValue(artistTitle);
                break;
            case 'username':
                this.setState({
                    autoUpdateUsername: false
                })
                break;
            default:
        }

    }

    async onSubmitForm(e) {
        e.preventDefault();
        try {
            this.setState({
                error: null,
                loading: true
            })
            const {
                email,
                password,
                password_confirm,
                username,
                artistTitle
            } = this.getFormValues();
            if (password && password !== password_confirm)
                throw new Error("Confirmation password doesn't match");
            const userAPI = new ClientUserAPI();
            await userAPI.register(email, password, username, artistTitle);

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



