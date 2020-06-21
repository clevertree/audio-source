import React from "react";
import ASUIMenuBreak from "../item/ASUIMenuBreak";
import ASUIMenuAction from "../item/ASUIMenuAction";

import ASUIContextMenuDropDownBase from "./ASUIContextMenuDropDownBase";
import ASUIDropDownContainer from "../dropdown/ASUIDropDownContainer";

import "../style/ASUIContextMenu.css";

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
                className="asui-contextmenu-dropdown">
            {this.state.open ? <ASUIDropDownContainer
                position="unset"
                ref={this.ref.dropdown}
                onClose={this.cb.closeDropDown}
                options={<>
                        {this.state.options}
                        <ASUIMenuBreak/>
                        <ASUIMenuAction onAction={this.cb.closeAllMenus}>- Close Menu -</ASUIMenuAction>
                    </>}
                /> : null}
            </div>,
            this.state.openOverlay ? <div
                onClick={this.cb.closeAllMenus}
                onContextMenu={this.cb.closeAllMenus}
                className="overlay">
            </div> : null

        ]
    }

}
