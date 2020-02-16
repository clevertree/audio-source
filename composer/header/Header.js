import React from "react";
// import Div from "../../../components/div/Div";
import Icon from "../../components/icon/Icon";
import Menu from "../../components/menu/Menu";

import "./assets/Header.css";

class Header extends React.Component {

    render() {
        return this.props.portrait ? this.renderPortrait() : this.renderLandscape();
    }

    renderLandscape() {
        let menuContent = this.props.menuContent;
        if(typeof menuContent === "function")
            menuContent = menuContent(this);
        return [
            <div key="header" className="asp-title-container">
                <div className="asp-title-text">Audio Source Player</div>
                <div className="asp-menu-container">{menuContent}</div>
            </div>
        ]
        // return [
        //     Div.cE({onclick: e => this.restart(), key: 'asp-title-text', ref:ref=>this.textTitle=ref}, 'Audio Source Player'),
        //     Div.cE('asp-menu-container', menuContent),
        // ]
    }

    renderPortrait() {
        return [
            /** Menu Button **/
            Menu.cSME('asp-menu-button',
                Icon.createIcon('menu'),
                this.props.menuContent
            ),

            /** Title Text **/
            // Div.cE({onclick: e => this.restart(), key: 'asp-title-text', ref:ref=>this.textTitle=ref}, 'Audio Source Player'),
        ]
    }


}
// if(isBrowser)
    // customElements.define('asp-header', Header);



/** Export this script **/
export default Header;
