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

    // componentDidMount() {
    //     SubMenuItem.addGlobalSubMenuHandler(this.openMenuHandler)
    // }
    //
    // componentWillUnmount() {
    //     SubMenuItem.removeGlobalSubMenuHandler(this.openMenuHandler)
    // }

    getComposer() { return this.props.composer; }
    isPortrait() { return this.getComposer().state.portrait; }

    render() {
        return this.isPortrait() ? this.renderPortrait() : this.renderLandscape();
    }

    renderLandscape() {
        let menuContent = this.props.menuContent;
        if(typeof menuContent === "function")
            menuContent = menuContent(this);
        return [
            <div key="header" className="asc-title-container landscape">
                <div className="asc-title-text">Audio Source Player</div>
                <div className="asc-menu-container">{menuContent}</div>
            </div>
        ]
        // return [
        //     Div.cE({onclick: e => this.restart(), key: 'asc-title-text', ref:ref=>this.textTitle=ref}, 'Audio Source Player'),
        //     Div.cE('asc-menu-container', menuContent),
        // ]
    }

    renderPortrait() {
        return (
            <div key="header" className="asc-title-container portrait">
                <SubMenuItem
                    className="asc-menu-button-toggle"
                    options={this.props.menuContent}
                    ref={this.menu}
                    arrow={false}
                >
                    <Icon className="menu" />
                </SubMenuItem>
                <div className="asc-title-text">Audio Source Player</div>
            </div>
        )
    }

    openMenu(e, options) {
        if(!this.isPortrait())
            return false;

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
        return true;
    }

}
// if(isBrowser)
// customElements.define('asc-header', Header);



/** Export this script **/
export default Header;
