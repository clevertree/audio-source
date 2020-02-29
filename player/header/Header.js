import React from "react";
// import Div from "../../../components/div/Div";
import {Icon, Button} from "../../components";

import "./assets/Header.css";

class Header extends React.Component {
    constructor(props) {
        super(props);
        this.menu = React.createRef();
    }


    getPlayer() { return this.props.player; }
    isPortrait() { return this.getPlayer().state.portrait; }

    render() {
        return this.isPortrait() ? this.renderPortrait() : this.renderLandscape();
    }

    renderLandscape() {
        let menuContent = this.props.menuContent;
        if(typeof menuContent === "function")
            menuContent = menuContent(this);
        return [
            <div key="header" className="asp-title-container landscape">
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
        let menuContent = this.props.menuContent;
        if(typeof menuContent === "function")
            menuContent = menuContent(this);
        return [
            <div key="header" className="asp-title-container portrait">
                <div className="asp-title-text">Audio Source Player</div>
                <Button
                    className="asp-menu-button-toggle"
                    onAction={e => this.openMenu(e, menuContent)}
                    ref={this.menu}
                    >
                    <Icon className="menu" />
                </Button>
            </div>
        ]
    }

    openMenu(e, options) {
        this.menu.current.openDropDownMenu(e, options);
    }

}
// if(isBrowser)
    // customElements.define('asp-header', Header);



/** Export this script **/
export default Header;
