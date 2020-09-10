import React from "react";

import {ASUIPanel, ASUIForm, ASUIButton} from "../../components";
import ASUIModal from "../../components/modal/ASUIModal";

export default class ASComposerSessionPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showLogin: false
        }
        this.cb = {
            toggleLogin: () => this.toggleLogin()
        }
    }

    render() {
        const composer = this.props.composer;
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
                    Modal
                </ASUIModal> : null}
            </ASUIPanel>
        );
    }

    /** Actions **/

    toggleLogin() {
        this.setState({
            showLogin: !this.state.showLogin
        })
    }
}



