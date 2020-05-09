import * as React from "react";
import ASCTracksContainerBase from "./ASCTracksContainerBase";

import "./assets/ASCTracksContainer.css"

export default class ASCTracksContainer extends ASCTracksContainerBase {
    render() {
        return <div className={`asc-tracks-container${this.props.composer.state.portrait ? ' portrait' : ''}`}>
            {super.render()}
        </div>
    }
}

