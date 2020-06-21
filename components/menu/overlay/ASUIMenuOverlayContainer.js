import React from "react";
import ASUIMenuOverlayDropDown from "./ASUIMenuOverlayDropDown";
import ASUIMenuOverlayContainerBase from "./ASUIMenuOverlayContainerBase";

export default class ASUIMenuOverlayContainer extends ASUIMenuOverlayContainerBase {

    renderContent() {
        return [
            <ASUIMenuOverlayDropDown
                key="dropdown"
                ref={this.ref.dropdown}
                overlay={this}/>,
            <div
                key="content"
                className="content">
                {this.props.children}
            </div>
        ]
    }


}
