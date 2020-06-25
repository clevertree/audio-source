import React from "react";

import ASUIContextMenuDropDownBase from "./ASUIContextMenuDropDownBase";
import ASUIDropDownContainer from "../dropdown/ASUIDropDownContainer";
import "./style/ASUIContextMenuDropDown.css";

export default class ASUIContextMenuDropDown extends ASUIContextMenuDropDownBase {

    render() {
        return [
            <div
                key="overlay"
                className={`asui-contextmenu-overlay${this.state.openOverlay ? ' open' : ''}`}
                onClick={this.cb.closeAllMenus}
                // onContextMenu={this.cb.closeAllMenus}
            >
            </div>,
            <div
                key="dropdown"
                className={`asui-contextmenu-dropdown${this.state.open ? ' open' : ''}`}
                >
                {this.state.open ? <ASUIDropDownContainer
                    floating={false}
                    ref={this.ref.dropdown}
                    onClose={this.cb.closeDropDown}
                    skipOverlay={true}
                    options={this.state.options}
                    /> : null}
            </div>
        ]
    }

}
