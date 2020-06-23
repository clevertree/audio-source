import React from "react";

import ASUIContextMenuDropDownBase from "./ASUIContextMenuDropDownBase";
import ASUIDropDownContainer from "../dropdown/ASUIDropDownContainer";
import "./style/ASUIContextMenuDropDown.css";

export default class ASUIContextMenuDropDown extends ASUIContextMenuDropDownBase {


    // renderContent() {
    //     // <div className="asui-contextmenu-container">
    //     return [
    //         this.props.children,
    //         this.state.openOverlay ? this.renderOverlay() : null,
    //         this.state.open ? this.renderDropDown() : null
    //     ];
    // }

    render() {
        return [<div
                key="dropdown"
                className={`asui-contextmenu-dropdown${this.state.open ? ' open' : ''}`}>
            {this.state.open ? <ASUIDropDownContainer
                floating={false}
                ref={this.ref.dropdown}
                onClose={this.cb.closeDropDown}
                skipOverlay={true}
                options={this.state.options}
                /> : null}
            </div>,
            this.state.openOverlay ? <div
                key="overlay"
                className="overlay"
                onClick={this.cb.closeAllMenus}
                // onContextMenu={this.cb.closeAllMenus}
                >
            </div> : null

        ]
    }

}
