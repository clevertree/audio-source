import React from "react";
import ASUIDiv from "../../common/ui/ASUIDiv";
import ASUIIcon from "../../common/ui/ASUIIcon";
import ASUIMenu from "../../common/ui/ASUIMenu";

class ASPUIHeader extends React.Component {

    render() {
        return this.props.portrait ? this.renderPortrait() : this.renderLandscape();
    }

    renderLandscape() {
        let menuContent = this.props.menuContent;
        if(typeof menuContent === "function")
            menuContent = menuContent(this);
        return [
            ASUIDiv.cE({onclick: e => this.restart(), key: 'asp-title-text', ref:ref=>this.textTitle=ref}, 'Audio Source Player'),
            ASUIDiv.cE('asp-menu-container', menuContent),
        ]
    }

    renderPortrait() {
        return [
            /** Menu Button **/
            ASUIMenu.cSME('asp-menu-button',
                ASUIIcon.createIcon('menu'),
                this.props.menuContent
            ),

            /** Title Text **/
            ASUIDiv.cE({onclick: e => this.restart(), key: 'asp-title-text', ref:ref=>this.textTitle=ref}, 'Audio Source Player'),
        ]
    }


}
// if(isBrowser)
    // customElements.define('asp-header', ASPUIHeader);



/** Export this script **/
export default ASPUIHeader;
