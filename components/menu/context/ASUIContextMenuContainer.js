import React from "react";
import ASUIContextMenuContainerBase from "./ASUIContextMenuContainerBase";

import ASUIMenuOptionList from "../options/ASUIMenuOptionList";
import "./style/ASUIContextMenuContainer.css"

export default class ASUIContextMenuContainer extends ASUIContextMenuContainerBase {

    renderContent() {
        // this.ref.openMenus = [];
        // this.ref.slidingMenu = React.createRef()
        const openOverlay = this.state.slidingMenu || this.state.openMenus.length > 0;
        return (
            <div
                className="asui-contextmenu-container">
                <div
                    key="overlay"
                    className={`overlay${openOverlay ? ' open' : ''}`}
                    onClick={this.cb.closeAllOpenMenus}
                    // onContextMenu={this.cb.closeAllMenus}
                >
                </div>
                {this.props.portrait ? <div
                    className={`sliding-menu${this.state.slidingMenu ? ' open' : ''}`}>
                    {this.renderSlidingMenu()}
                </div> : null}
                <div
                    className={`open-menus${this.state.openMenus.length > 0 ? ' open' : ''}`}>
                    {this.state.openMenus.map((openMenu, i) => <ASUIMenuOptionList
                        key={i}
                        {...openMenu}
                    />)}
                </div>
                {this.props.children}
            </div>
        );
    }


}
