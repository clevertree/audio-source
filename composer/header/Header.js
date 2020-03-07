import React from "react";
// import Div from "../../../components/div/Div";
import {Icon, MenuItem} from "../../components";

import "./assets/Header.css";

class Header extends React.Component {

    render() {
        return this.props.portrait ? this.renderPortrait() : this.renderLandscape();
    }

    renderLandscape() {
        let menuContent = this.props.menuContent;
        if(typeof menuContent === "function")
            menuContent = menuContent(this);
        return (
            <div key="header" className="asc-title-container">
                <div className="asc-title-text">Audio Source Composer</div>
                <div className="asc-menu-container">{menuContent}</div>
            </div>
        )
        // return [
        //     Div.cE({onclick: e => this.restart(), key: 'asc-title-text', ref:ref=>this.textTitle=ref}, 'Audio Source Player'),
        //     Div.cE('asc-menu-container', menuContent),
        // ]
    }

    renderPortrait() {
        let menuContent = this.props.menuContent;
        if(typeof menuContent === "function")
            menuContent = menuContent(this);
        /** Menu Button **/
        return (
            <MenuItem
                class="asc-menu-button"
                children={menuContent}
                >
                <Icon className="menu" />
            </MenuItem>
        );

            /** Title Text **/
            // Div.cE({onclick: e => this.restart(), key: 'asc-title-text', ref:ref=>this.textTitle=ref}, 'Audio Source Player'),
    }


}
// if(isBrowser)
    // customElements.define('asc-header', Header);



/** Export this script **/
export default Header;
