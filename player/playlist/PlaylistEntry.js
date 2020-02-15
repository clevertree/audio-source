import React from "react";
import Div from "../../common/components/div/Div";
// import Icon from "../../common/components/asui-icon";
// import Menu from "../../common/components/asui-menu";

import "./assets/Playlist.css";

class PlaylistEntry extends React.Component {
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

    render() {
        let id = typeof this.props.id !== "undefined" ? this.props.id : '-';
        if(Number.isInteger(id) && id <= 9)
            if (id <= 9) id = '0' + id;

        const [length, fade] = (this.props.data.length || 0).toString().split(':');
        const formattedLength = (() => {
            try { return new Date(length * 1000).toISOString().substr(14, 5); }
            catch { return "N/A"; }
        })();


        return <Div className="asp-playlist-entry" onClick={e => this.onInput(e)}>
            <Div className="id">{id+":"}</Div>
            <Div className="name">{this.props.data.name}</Div>
            <Div className="length">{formattedLength}</Div>
        </Div>
    }

    onInput(e) {
        switch(e.type) {
            case 'click':
                console.log(e);
                this.props.onAction && this.props.onAction(e);
                break;
        }
    }

}



/** Export this script **/
export default PlaylistEntry;
