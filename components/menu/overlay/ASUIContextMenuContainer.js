import React from "react";
import ASUIContextMenuDropDown from "./ASUIContextMenuDropDown";
import ASUIContextMenuContainerBase from "./ASUIContextMenuContainerBase";

import "../style/ASUIContextMenu.css";

export default class ASUIContextMenuContainer extends ASUIContextMenuContainerBase {

    renderContent() {
        return <div
            className="asui-contextmenu-container">
            <ASUIContextMenuDropDown
                ref={this.ref.dropdown}
                overlay={this}/>
            <div
                className="content">
                {this.props.children}
            </div>
        </div>
    }


}
