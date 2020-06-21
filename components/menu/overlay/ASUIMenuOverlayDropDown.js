import React from "react";
import ASUIMenuBreak from "../item/ASUIMenuBreak";
import ASUIMenuAction from "../item/ASUIMenuAction";

import "../style/ASUIMenuOverlayContainer.css";
import ASUIMenuOverlayDropDownBase from "./ASUIMenuOverlayDropDownBase";
import ASUIDropDownContainer from "../dropdown/ASUIDropDownContainer";

export default class ASUIMenuOverlayDropDown extends ASUIMenuOverlayDropDownBase {


    // renderContent() {
    //     // <div className="asui-menu-overlay-container">
    //     return [
    //         this.props.children,
    //         this.state.openOverlay ? this.renderOverlay() : null,
    //         this.state.open ? this.renderDropDown() : null
    //     ];
    // }

    render() {
        return [
            this.state.open ? <ASUIDropDownContainer
                ref={this.ref.dropdown}
                options={<>
                        {this.state.options}
                        <ASUIMenuBreak/>
                        <ASUIMenuAction onAction={this.cb.closeAllMenus}>- Close Menu -</ASUIMenuAction>
                    </>}
                /> : null,

            this.state.openOverlay ? <div
                onClick={this.cb.closeAllMenus}
                onContextMenu={this.cb.closeAllMenus}
                className="overlay">
            </div> : null
        ]
    }

}
