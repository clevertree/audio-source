import React from "react";
// import ASUIContextMenuDropDown from "./ASUIContextMenuDropDown";
import ASUIContextMenuContainerBase from "./ASUIContextMenuContainerBase";

import "./style/ASUIContextMenuContainer.css"
import ASUIMenuOptionList from "../options/ASUIMenuOptionList";

export default class ASUIContextMenuContainer extends ASUIContextMenuContainerBase {

    renderContent() {
        const openOverlay = this.state.slidingMenu || this.state.openMenus.length > 0;
        return <div
            className="asui-contextmenu-container">
            <div
                key="overlay"
                className={`asui-contextmenu-overlay${openOverlay ? ' open' : ''}`}
                onClick={this.cb.closeAllMenus}
                // onContextMenu={this.cb.closeAllMenus}
            >
            </div>
            <div
                className={`sliding-menu${this.state.slidingMenu ? ' open' : ''}`}>
                {this.state.slidingMenu ? <ASUIMenuOptionList
                    {...this.state.slidingMenu}
                /> : null}
            </div>
            <div
                className={`open-menu-container${this.state.openMenus.length > 0 ? ' open' : ''}`}>
                {this.state.openMenus.map(openMenu => <ASUIMenuOptionList
                    {...openMenu}
                />)}
            </div>
            <div
                className="content">
                {this.props.children}
            </div>
        </div>
    }


}
