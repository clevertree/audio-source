import React from "react";

import {ASUIPanel, ASUIForm, ASUIButton, ASUIInputText, ASUIInputPassword, ASUIModal} from "../../components";

export default class ASComposerSessionPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showLogin: false
        }
        this.cb = {
            toggleLogin: () => this.toggleLogin(),
            onSubmit: () => this.onSubmit(),
        }
        this.ref = {
            username: React.createRef(),
            password: React.createRef(),
        }
    }

    render() {
        return (
            <ASUIPanel
                viewKey="session"
                header="session">
                <ASUIButton
                    arrow={'▼'}
                    className="keyboard-octave"
                    onAction={this.cb.toggleLogin}
                    title="Log in"
                >Log in</ASUIButton>
                {this.state.showLogin ? <ASUIModal
                    onClose={this.cb.toggleLogin}
                >
                    {this.renderLoginModal()}
                </ASUIModal> : null}
            </ASUIPanel>
        );
    }


    renderLoginModal() {
        return (<ASUIPanel
                large
                horizontal
                header="Log in">
            <ASUIForm className="username" header="Username">
                <ASUIInputText
                    large
                    placeholder="user@place.com"
                    ref={this.ref.username}
                    />
            </ASUIForm>
            <ASUIForm className="password" header="Password">
                <ASUIInputPassword
                    large
                    ref={this.ref.password}
                />
            </ASUIForm>
                <ASUIButton
                    large
                    onAction={this.cb.onSubmit}
                >Submit</ASUIButton>
        </ASUIPanel>);

    }

    /** Actions **/

    toggleLogin() {
        this.setState({
            showLogin: !this.state.showLogin
        })
    }

    onSubmit() {
        const request = {
            username: this.ref.username.current.getValue(),
            password: this.ref.password.current.getValue(),
        }
        console.log("Login: ", request)
    }
}



