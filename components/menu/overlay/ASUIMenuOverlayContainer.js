import React from "react";
// import Div from "../div/Div";

import "../assets/ASUIMenuOverlayContainer.css";
import ASUIMenuBreak from "../ASUIMenuBreak";
import ASUIMenuAction from "../ASUIMenuAction";
import ASUIMenuOverlayContainerBase from "./ASUIMenuOverlayContainerBase";

export default class ASUIMenuOverlayContainer extends ASUIMenuOverlayContainerBase {

    render() {
        if(!this.state.openOverlay && !this.state.open)
            return this.props.children;

        return (<>
                {this.state.openOverlay ? <div className="asui-menu-overlay-container"
                    onClick={this.cb.closeAllMenus}
                    /> : null}

                {this.state.open ? <div className="asui-menu-overlay-dropdown">
                    {this.state.options}
                    <ASUIMenuBreak/>
                    <ASUIMenuAction onAction={this.cb.closeAllMenus}>- Close Menu -</ASUIMenuAction>
                </div> : null}
                {this.props.children}
            </>);
    }
}

