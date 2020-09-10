import React from "react";

import {ASUIPanel, ASUIForm, ASUIFormEntry, ASUIClickable, ASUIInputText, ASUIInputPassword, ASUIModal} from "../../components";

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
                <ASUIClickable
                    button wide
                    arrow={'▼'}
                    className="keyboard-octave"
                    onAction={this.cb.toggleLogin}
                    title="Log in"
                >Log in</ASUIClickable>
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
            <ASUIForm>
                <ASUIFormEntry className="username" header="Username">
                    <ASUIInputText
                        large
                        placeholder="user@place.com"
                        ref={this.ref.username}
                        />
                </ASUIFormEntry>
                <ASUIFormEntry className="password" header="Password">
                    <ASUIInputPassword
                        large
                        ref={this.ref.password}
                    />
                </ASUIFormEntry>
                <ASUIFormEntry className="submit" header="Submit">
                    <ASUIClickable
                        button large
                        onAction={this.cb.onSubmit}
                    >Submit</ASUIClickable>
                </ASUIFormEntry>
            </ASUIForm>
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



