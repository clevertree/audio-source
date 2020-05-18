import React from "react";
import ASUIMenuBreak from "../item/ASUIMenuBreak";
import ASUIMenuAction from "../item/ASUIMenuAction";
import ASUIMenuOverlayContainerBase from "./ASUIMenuOverlayContainerBase";

import "../style/ASUIMenuOverlayContainer.css";

export default class ASUIMenuOverlayContainer extends ASUIMenuOverlayContainerBase {


    // renderContent() {
    //     // <div className="asui-menu-overlay-container">
    //     return [
    //         this.props.children,
    //         this.state.openOverlay ? this.renderOverlay() : null,
    //         this.state.open ? this.renderDropDown() : null
    //     ];
    // }

    renderContent() {
        return (
            <div className="asui-menu-overlay-container"
                >
                {this.state.open ? <div
                    className="dropdown">
                    {this.state.options}
                    <ASUIMenuBreak/>
                    <ASUIMenuAction onAction={this.cb.closeAllMenus}>- Close Menu -</ASUIMenuAction>
                </div> : null}
                {this.state.openOverlay ? <div
                    onClick={this.cb.closeAllMenus}
                    className="overlay">
                </div> : null}
                <div
                    className="content">
                    {this.props.children}
                </div>
            </div>
        )
    }

}
