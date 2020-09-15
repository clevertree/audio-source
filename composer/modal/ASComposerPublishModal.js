import React from "react";

import {ASUIPanel,  ASUIFormEntry, ASUIFormMessage, ASUIClickable, ASUIInputText, ASUIInputTextArea, ASUIModal} from "../../components";
import ClientSongAPI from "../../server/song/ClientSongAPI";

export default class ASComposerPublishModal extends React.Component {
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
            filename: React.createRef(),
            version: React.createRef(),
            comment: React.createRef(),
            // password_confirm: React.createRef(),
        }
        const song = this.getComposer().getSong();

        this.state = {
            title: song.data.title,
            filename: getSongFileNameFromTitle(song.data.title),
            version: song.data.version || '0.0.1',
            comment: song.data.comment,
            isPublished: false
        }

    }

    componentDidMount() {
        this.updateIsPublished()
    }

    getComposer() { return this.props.composer; }

    render() {
        // const song = this.getComposer().getSong();
        return (
            <ASUIModal
                onClose={this.cb.closeModal}
            >
                <ASUIPanel
                    large
                    horizontal
                    header="Publish Song">
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
                    <ASUIFormEntry className="filename" header="File Name">
                        <ASUIInputText
                            size="large"
                            required
                            placeholder="my_song.json"
                            disabled={this.state.isPublished}
                            defaultValue={this.state.filename}
                            ref={this.ref.filename}
                        />
                    </ASUIFormEntry>
                    <ASUIFormEntry className="version" header="Version">
                        <ASUIInputText
                            size="large"
                            required
                            placeholder="0.0.1"
                            defaultValue={this.state.version}
                            ref={this.ref.version}
                        />
                    </ASUIFormEntry>
                    <ASUIFormEntry className="comment" header="Comment">
                        <ASUIInputTextArea
                            defaultValue={this.state.comment}
                            ref={this.ref.comment}
                            placeholder={`## Your Song Description\n\n(Markdown __is__ *supported*)`}
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

            const filename = this.ref.filename.current.getValue();
            proxiedData.title = this.ref.title.current.getValue();
            proxiedData.version = this.ref.version.current.getValue();
            proxiedData.comment = this.ref.comment.current.getValue();
            const songAPI = new ClientSongAPI();
            const publishResponse = await songAPI.publish(song.data, filename);

            // proxiedData.version = (proxiedData.version)

            this.setState({
                loading: false
            })

            const composer = this.getComposer();
            composer.showModal('publish-success', publishResponse);

        } catch (e) {
            console.error(e);
            this.setState({
                error: e.message,
                loading: false
            })
        }
    }

    async updateIsPublished() {
        const song = this.getComposer().getSong();

        const songAPI = new ClientSongAPI();
        const publishResponse = await songAPI.isPublished(song.data.uuid);
        let version = this.state.version;
        if(publishResponse.isPublished) {
            version = bumpVersion(version);
            this.ref.version.current.setValue(version); // Ugly
        }
        this.setState({
            isPublished: publishResponse.isPublished,
            version
        })
    }
}

function getSongFileNameFromTitle(title) {
    return title.replace(/\W+/g, '_') + '.json';
}


function bumpVersion(version) {
    const split = version.split('.');
    let last = parseInt(split.pop());
    if(Number.isNaN(last))
        return version;
    return split.join('.') + '.' + (last+1);

}
