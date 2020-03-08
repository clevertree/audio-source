import React from "react";
// import Div from "../../../components/div/Div";
import {Icon, SubMenuItem} from "../../components";

import "./assets/Header.css";

class Header extends React.Component {
    constructor(props) {
        super(props);
        this.menu = React.createRef();
        this.openMenuHandler = (e, options) => this.openMenu(e, options);
    }

    componentDidMount() {
        if(this.isPortrait()) {
            SubMenuItem.addGlobalSubMenuHandler(this.openMenuHandler)
        }
    }

    componentWillUnmount() {
        if(this.isPortrait()) {
            SubMenuItem.removeGlobalSubMenuHandler(this.openMenuHandler)
        }
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
        return (
            <div key="header" className="asp-title-container portrait">
                <SubMenuItem
                    className="asp-menu-button-toggle"
                    options={this.props.menuContent}
                    ref={this.menu}
                    arrow={false}
                    >
                    <Icon className="menu" />
                </SubMenuItem>
                <div className="asp-title-text">Audio Source Player</div>
            </div>
        )
    }

    openMenu(e, options) {
        switch(e.type) {
            case 'click':
                break;
            case 'mouseenter':
                // Prevent mouse-over opening the menu here
                return;
            default:
                throw new Error("Unknown menu event: " + e.type);
        }
        this.menu.current.openDropDownMenu(e, options);
    }

}
// if(isBrowser)
    // customElements.define('asp-header', Header);



/** Export this script **/
export default Header;
