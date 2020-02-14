import React from "react";

class ASCUIHeader extends React.Component {

    render() {
        return this.props.portrait ? this.renderPortrait() : this.renderLandscape();
    }

    renderLandscape() {
        let menuContent = this.props.menuContent;
        if(typeof menuContent === "function")
            menuContent = menuContent(this);
        return [
            ASUIDiv.cE({onclick: e => this.restart(), key: 'asc-title-text', ref: ref=>this.textTitle=ref}, 'Audio Source Player'),
            ASUIDiv.cE('asc-menu-container', menuContent),
        ]
    }

    renderPortrait() {
        return [
            /** Menu Button **/
            ASUIMenu.cSME('asc-menu-button',
                ASUIIcon.createIcon('menu'),
                this.props.menuContent
            ),

            /** Title Text **/
            ASUIDiv.cE({onclick: e => this.restart(), key: 'asc-title-text', ref: ref=>this.textTitle=ref}, 'Audio Source Player'),
        ]
    }


}
// if(isBrowser)
    // customElements.define('asc-header', ASCUIHeader);



/** Export this script **/
export default ASCUIHeader;
