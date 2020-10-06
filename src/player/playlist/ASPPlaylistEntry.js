import React from "react";
// import {ASUIDiv as Div} from "../../components/";

// import Icon from "../../components/asui-icon";
// import Menu from "../../components/asui-menu";

import "./assets/ASPPlaylist.css";

class ASPPlaylistEntry extends React.Component {
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


        return <div className="asp-playlist-entry" onClick={e => this.onInput(e)}>
            <div className="id">{id+":"}</div>
            <div className="name">{this.props.data.name}</div>
            <div className="length">{formattedLength}{fade ? `[${fade}]` : ''}</div>
        </div>
    }

    onInput(e) {
        switch(e.type) {
            case 'click':
                console.log(e);
                this.props.onAction && this.props.onAction(e);
                break;

            default:
                console.log("Unknown input: ", e.type);
                break;
        }
    }

}



/** Export this script **/
export default ASPPlaylistEntry;
