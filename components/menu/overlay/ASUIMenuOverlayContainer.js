import React from "react";
import ASUIMenuBreak from "../ASUIMenuBreak";
import ASUIMenuAction from "../ASUIMenuAction";
import ASUIMenuOverlayContainerBase from "./ASUIMenuOverlayContainerBase";

import "../assets/ASUIMenuOverlayContainer.css";

export default class ASUIMenuOverlayContainer extends ASUIMenuOverlayContainerBase {


    renderContent() {
        return (
            <div className="asui-menu-overlay-container">
                {this.props.children}
                {this.state.openOverlay ? this.renderOverlay() : null}
                {this.state.open ? this.renderDropDown() : null}
            </div>
        );
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
            <div className="asui-menu-overlay-dropdown">
                {this.state.options}
                <ASUIMenuBreak/>
                <ASUIMenuAction onAction={this.cb.closeAllMenus}>- Close Menu -</ASUIMenuAction>
            </div>
        )
    }
}
