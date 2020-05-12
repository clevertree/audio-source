import React from "react";
import ASUIMenuBreak from "../item/ASUIMenuBreak";
import ASUIMenuAction from "../item/ASUIMenuAction";
import ASUIMenuOverlayContainerBase from "./ASUIMenuOverlayContainerBase";

import "../style/ASUIMenuOverlayContainer.css";

export default class ASUIMenuOverlayContainer extends ASUIMenuOverlayContainerBase {


    renderContent() {
        // <div className="asui-menu-overlay-container">
        return [
            this.props.children,
            this.state.openOverlay ? this.renderOverlay() : null,
            this.state.open ? this.renderDropDown() : null
        ];
    }

    renderOverlay() {
        return (
            <div key="overlay" className="asui-menu-overlay"
                 onClick={this.cb.closeAllMenus}
                />
        )
    }

    renderDropDown() {
        return (
            <div
                key="dropdown"
                className="asui-menu-overlay-dropdown">
                {this.state.options}
                <ASUIMenuBreak/>
                <ASUIMenuAction onAction={this.cb.closeAllMenus}>- Close Menu -</ASUIMenuAction>
            </div>
        )
    }
}
