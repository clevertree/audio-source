import * as React from "react";
import ASCTracksContainerBase from "./ASCTracksContainerBase";

import "./assets/ASCTracksContainer.css"

export default class ASCTracksContainer extends ASCTracksContainerBase {
    render() {
        return <div className={`asc-tracks-container`}>
            {super.render()}
        </div>
    }
}

