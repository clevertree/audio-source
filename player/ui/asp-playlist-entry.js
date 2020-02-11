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
    const {ASUIMenu} = require('../../common/ui/asui-menu.js');


    class ASPPlaylistEntry extends ASUIComponent {
        constructor(props = {}) {
            super(props, {});
            if(!this.props.data)
                throw new Error("Invalid Entry data");
            if(!this.props.playlist)
                throw new Error("Invalid Entry playlist");
            // if(!this.state.name)
            //     this.state.name = state.url.split('/').pop();
            // this.props.position = null;
            // this.props.selected = null;
            // props.isPlaylist = entryData.url.toString().toLowerCase().endsWith('.pl.json');
        }

        // get id()            { return this.props.key; }
        // get data()          { return this.props.data; }
        // get file()          { return this.data.file; }
        // get url()           { return this.data.url; }
        // get name()          { return this.data.name; }
        // get length()        { return this.data.length; }
        // get isPlaylist()    { return false; }
        // get position() { return this.playlistElm.playlist.indexOf(this); }

        // toggleSelect(playlistElm) {
        //     this.playlistElm.toggleSelect(this.getPosition(playlistElm));
        // }

        select() {
            const playlistPosition = this.props.playlist.findEntryPosition(this);
            this.props.playlist.selectEntries(playlistPosition)
        }

        // removePosition() {
        //     if(this.props.position !== false)
        //         this.setProps({position: false});
        // }

        render() {
            let key = '-';
            if(Number.isInteger(this.props.key)) {
                key = this.props.key;
                if (key <= 9) key = '0' + key;
            }
            const [length, fade] = (this.props.data.length || 0).toString().split(':');
            const formattedLength = (() => {
                try { return new Date(length * 1000).toISOString().substr(14, 5); }
                catch { return "N/A"; }
            })();
            // rowElm.addEventListener('click', async e => {
            //     await this.loadSongFromPlaylistEntry(i);
            //     await songPlay();
            // })

            return [
                ASUIDiv.createElement('id', key+':'),
                ASUIDiv.createElement('name', this.props.data.name),
                // ASUIDiv.createElement('url', this.state.url),
                ASUIDiv.createElement('length', formattedLength),
                ASUIDiv.createElement('id', this.props.depth), // TODO: depth
            ];
        }

        // scrollIntoView(playlistElm) {
        //
        //     // TODO: find height within scrolling container
        //     const container = this.parentNode;
        //     // const container = this.tracker; // cursorCell.closest('.composer-tracker-container');
        //     if (container.scrollTop < this.offsetTop - container.offsetHeight)
        //         container.scrollTop = this.offsetTop;
        //     //
        //     if (container.scrollTop > this.offsetTop)
        //         container.scrollTop = this.offsetTop - container.offsetHeight;
        // }

        // static parseFromData(entryData, id, props={}) {
        //     if(typeof entryData === "string") {
        //         const split = entryData.split(';');
        //         entryData = {url: split[0]};
        //         if(split[1]) entryData.name = split[1];
        //         if(split[2]) entryData.length = split[2];
        //     }
        //     if(!entryData.url)
        //         throw new Error("Invalid Playlist Entry URL");
        //
        //     entryData.key = id;
        //     const isPlaylist = entryData.url.toString().toLowerCase().endsWith('.pl.json');
        //     if(isPlaylist)
        //         return new ASPPlaylistPlaylistEntry(props, entryData);
        //     return new ASPPlaylistEntry(props, entryData);
        // }

    }
    if(isBrowser)
        customElements.define('aspp-entry', ASPPlaylistEntry);



    // class ASPPlaylistPlaylistEntry extends ASPPlaylistEntry {
    //     get isPlaylist() { return true; }
    //
    //     constructor(props={}) {
    //         super(props, state);
    //         this.props.status = null;
    //         this.props.open = null;
    //         this.state.entries = this.props.entries || null;
    //         // props.isPlaylist = entryData.url.toString().toLowerCase().endsWith('.pl.json');
    //     }
    //
    //     get entries() { return this.state.entries; }
    //
    //     async togglePlaylist(toggleValue = null) {
    //         toggleValue = toggleValue === null ? this.props.open ? null : true : toggleValue;
    //         this.setProps({open: toggleValue});
    //         if(!this.entries)
    //             return await this.loadPlaylist();
    //         await this.forceUpdate();
    //     }
    //
    //     async loadPlaylist() {
    //         const playlistURL = new URL(this.state.url, document.location);
    //
    //         await this.setState({
    //             name: "Loading playlist " + this.state.url.split('/').pop(),
    //         });
    //         await this.setProps({status: 'loading'});
    //
    //         const playlistData = await new Promise((resolve, reject) => {
    //             const xhr = new XMLHttpRequest();
    //             xhr.open('GET', playlistURL.toString(), true);
    //             xhr.responseType = 'json';
    //             xhr.onload = () => resolve(xhr.response);
    //             xhr.onerror = reject;
    //             xhr.send();
    //         });
    //
    //         if(!playlistData.playlist)
    //             throw new Error("No playlist data: " + playlistURL);
    //         if(!Array.isArray(playlistData.playlist))
    //             throw new Error("Invalid playlist data: " + playlistURL);
    //         let playlist = playlistData.playlist;
    //         if(!Array.isArray(playlist))
    //             throw new Error("Invalid playlist");
    //
    //         let urlPrefix = playlistData.urlPrefix;
    //         if(!urlPrefix || urlPrefix[0] !== '/')
    //             urlPrefix = playlistURL.pathname.split("/").slice(0,-1).join("/") + '/' + (urlPrefix||'');
    //         let newPlaylist = [];
    //         for(let id=0; id<playlist.length; id++) {
    //             let entry = playlist[id];
    //             if(typeof entry === "object")   entry.url = urlPrefix + entry.url;
    //             else                            entry = urlPrefix + entry;
    //             entry = ASPPlaylistEntry.parseFromData(entry, id);
    //             newPlaylist.push(entry);
    //
    //             // await entry.updateID(id); d
    //         }
    //         await this.setProps({status: 'loaded', open:true});
    //         await this.setState({
    //             name: playlistData.name,
    //             playlist: newPlaylist
    //         });
    //     }
    //
    //     // async updateID(id) {
    //     //     await super.updateID(id);
    //     //     // await this.updateEntries();
    //     // }
    //
    //     // async updateEntries() {
    //     //     if(this.state.playlist) {
    //     //         for (let id = 0; id < this.state.playlist.length; id++) {
    //     //             const entry = this.state.playlist[id];
    //     //             await entry.updateID(id);
    //     //         }
    //     //     }
    //     // }
    //
    //     render() {
    //         const content = super.render();
    //         if(this.entries && this.props.open) {
    //             // await this.updateEntries();
    //             content.push(ASUIDiv.createElement('container', this.entries));
    //         }
    //         return content;
    //     }
    // }
    // if(isBrowser)
    //     customElements.define('aspp-playlist-entry', ASPPlaylistPlaylistEntry);


    /** Export this script **/
    thisModule.exports = {
        ASPPlaylistEntry,
        // ASPHeaderContainer
    };


}).apply(null, (function() {
    const thisScriptPath = 'player/ui/asp-playlist-entry.js';
    const isBrowser = typeof document === 'object';
    const thisModule = !isBrowser ? module : customElements.get('audio-source-loader').findScript(thisScriptPath);
    const thisRequire = !isBrowser ? require : customElements.get('audio-source-loader').getRequire(thisModule);
    return [thisRequire, thisModule, thisScriptPath, isBrowser]
})());
