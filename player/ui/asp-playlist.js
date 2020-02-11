(function(thisRequire, thisModule, thisScriptPath, isBrowser) {
    /** Required Modules **/
    if(isBrowser) // Hack for browsers
        window.require = thisRequire;

    const {
        ASUIDiv,
        ASUIComponent,
        ASUIIcon
    } = require('../../common/ui/asui-component.js');
    // const {ASUIInputButton} = require('../../common/ui/asui-input-button.js');
    // const {ASUIMenu} = require('../../common/ui/asui-menu.js');

    const {ASPPlaylistEntry} = require('./asp-playlist-entry.js');

    class ASPPlaylist extends ASUIComponent {
        constructor(props = {}) {
            super(props, {});
            if(!this.player)
                throw new Error("Invalid player");

            this.state = this.player.state.playlist;
            this.state.position = this.state.position || 0;
            this.state.entries = this.state.entries || [];
            this.state.selectedPositions = this.state.selectedPositions || [];
        }

        get player() { return this.props.player; }
        // get position() { return this.state.position; }
        // get entries() { return this.state.entries; }


        render() {
            // TODO: move to entry - this.addEventHandler('click', e => this.onClick(e));
            // await this.updateEntries();
            return [
                ASUIDiv.createElement('header', [
                    ASUIDiv.createElement('id', 'ID'),
                    ASUIDiv.createElement('name', 'Name'),
                    // ASUIDiv.createElement('url', 'URL'),
                    ASUIDiv.createElement('length', 'Length'),
                ], {key: 'asp-playlist-header'}),
                ASUIDiv.createElement('asp-playlist-container', [
                    this.state.entries.length > 0
                    ? this.player.eachEntry((entryData, position, depth) => {
                        const props = {
                            key: position,
                            data:entryData,
                            playlist: this,
                            depth,
                            onPress: (e) => this.player.toggleEntryAtPosition(position)
                        };
                        const classes = [];
                        if(this.state.position === position)
                            classes.push('position');
                            if(this.state.selectedPositions.indexOf(position) !== -1)
                                classes.push('selected');
                            if(entryData.loading)
                                classes.push('loading');
                        if(classes.length > 0)
                            props.class = classes.join(' ');
                        return ASPPlaylistEntry.createElement(props)
                    })
                    : ASUIDiv.createElement('empty-playlist', "Empty Playlist")
                ], {'style': `max-height:${Math.round(window.innerHeight / 2)}px;`}),
            ];
        }

        async onClick(e) {
            const entryElm = e.target.closest('aspp-entry,aspp-playlist-entry');
            if(entryElm) {
                // entryElm.toggleSelect();
                if(entryElm.isPlaylist) {
                    await entryElm.togglePlaylist();
                } else {
                    await this.playerElm.playlistMoveToEntry(entryElm);
                    await this.playerElm.playlistPlay();
                }
                //     await songPlay();
            } else {
                console.error(e, this);
            }
        }

        clear() {
            this.setState({entries: []})
        }


    }
    if(isBrowser)
        customElements.define('asp-playlist', ASPPlaylist);


    /** Export this script **/
    thisModule.exports = {
        ASPPlaylist,
        // ASPPlaylistContainer
    };


}).apply(null, (function() {
    const thisScriptPath = 'player/ui/asp-playlist.js';
    const isBrowser = typeof document === 'object';
    const thisModule = !isBrowser ? module : customElements.get('audio-source-loader').findScript(thisScriptPath);
    const thisRequire = !isBrowser ? require : customElements.get('audio-source-loader').getRequire(thisModule);
    return [thisRequire, thisModule, thisScriptPath, isBrowser]
})());
