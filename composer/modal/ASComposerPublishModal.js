import React from "react";
import compareVersions from 'compare-versions';

import {ASUIPanel, ASUIForm, ASUIFormEntry, ASUIFormMessage, ASUIClickable, ASUIInputText, ASUIInputTextArea, ASUIModal, ASUIAnchor} from "../../components";
import ClientUserAPI from "../../server/client/ClientUserAPI";

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
            title: React.createRef(),
            version: React.createRef(),
            comment: React.createRef(),
            // password_confirm: React.createRef(),
        }
        const song = this.getComposer().getSong();

        this.state = {
            title: song.data.title,
            version: song.data.version,
            comment: song.data.comment,
        }
    }

    getComposer() { return this.props.composer; }

    render() {
        const song = this.getComposer().getSong();
        return (
            <ASUIModal
                onClose={this.cb.closeModal}
            >
                <ASUIPanel
                    large
                    horizontal
                    header="Publish Song">
                    <ASUIForm>
                        {this.state.error ? <ASUIFormMessage error children={this.state.error}/> : null}
                        <ASUIFormEntry className="title" header="Title">
                            <ASUIInputText
                                size="large"
                                required
                                placeholder="Song Title"
                                defaultValue={this.state.title}
                                ref={this.ref.title}
                            />
                        </ASUIFormEntry>
                        <ASUIFormEntry className="version" header="Version">
                            <ASUIInputText
                                size="large"
                                required
                                defaultValue={this.state.version}
                                ref={this.ref.version}
                            />
                        </ASUIFormEntry>
                        <ASUIFormEntry className="comment" header="Comment">
                            <ASUIInputTextArea
                                defaultValue={this.state.comment}
                                ref={this.ref.comment}
                                rows={8}
                            />
                        </ASUIFormEntry>
                        <ASUIFormEntry className="submit" header="Submit">
                            <ASUIClickable
                                button center
                                size="large"
                                onAction={this.cb.onSubmitForm}
                            >Publish</ASUIClickable>
                        </ASUIFormEntry>
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
            const song = this.getComposer().getSong();
            const proxiedData = song.getProxiedData()

            proxiedData.title = this.ref.title.current.getValue();
            proxiedData.version = this.ref.version.current.getValue();
            proxiedData.comment = this.ref.comment.current.getValue();
            const userAPI = new ClientUserAPI();
            await userAPI.publish(song.data);

            proxiedData.version = bumpVersion(proxiedData.version)

            this.setState({
                loading: false
            })

            const composer = this.getComposer();
            composer.toggleModal('publish-success');

        } catch (e) {
            console.error(e);
            this.setState({
                error: e.message,
                loading: false
            })
        }
    }
}



function bumpVersion(version) {
    const split = version.split('.');
    let last = parseInt(split.pop());
    if(Number.isNaN(last))
        return version;
    return split.join('.') + '.' + (last+1);

}
