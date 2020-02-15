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
            Div.cE({onclick: e => this.restart(), key: 'asc-title-text', ref: ref=>this.textTitle=ref}, 'Audio Source Player'),
            Div.cE('asc-menu-container', menuContent),
        ]
    }

    renderPortrait() {
        return [
            /** Menu Button **/
            Menu.cSME('asc-menu-button',
                Icon.createIcon('menu'),
                this.props.menuContent
            ),

            /** Title Text **/
            Div.cE({onclick: e => this.restart(), key: 'asc-title-text', ref: ref=>this.textTitle=ref}, 'Audio Source Player'),
        ]
    }


}
// if(isBrowser)
    // customElements.define('asc-header', ASCUIHeader);



/** Export this script **/
export default ASCUIHeader;
