import React from "react";
import Div from "../div/Div";

import "./assets/MenuOverlayContainer.css";
import MenuOverlayContext from "./MenuOverlayContext";


class MenuOverlayContainer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            openOverlay: false
        };
        this.overlayContext = {
            openMenu: (options) => this.openMenu(options),
            closeAllMenus: (butThese=[]) => this.closeAllMenus(butThese),
            openOverlay: () => this.openOverlay(),
            closeOverlay: () => this.closeOverlay(),
            removeOpenMenu: (openMenuItem) => this.removeOpenMenu(openMenuItem),
            addOpenMenu: (openMenuItem) => this.addOpenMenu(openMenuItem),
            openMenuItems: []
        };
    }
    // componentDidMount() {
    //     SubMenuItem.addGlobalSubMenuHandler(this.openMenuHandler)
    // }
    //
    // componentWillUnmount() {
    //     SubMenuItem.removeGlobalSubMenuHandler(this.openMenuHandler)
    // }

    render() {
        return <MenuOverlayContext.Provider
            value={this.overlayContext}>
            <>
                {this.state.openOverlay ? <Div className="asui-menu-overlay-container"
                    onClick={this.overlayContext.closeAllMenus}
                    /> : null}

                {this.state.open ? <Div className="asui-menu-overlay-dropdown">
                    {typeof this.state.options === "function" ? this.state.options(this) : this.state.options}
                </Div> : null}
                {this.props.children}
            </>
        </MenuOverlayContext.Provider>;
    }

    addOpenMenu(openMenuItem) {
        const i = this.overlayContext.openMenuItems.indexOf(openMenuItem);
        if(i === -1)
            this.overlayContext.openMenuItems.push(openMenuItem);
        console.log('this.overlayContext.openMenuItems', this.overlayContext.openMenuItems);
    }

    removeOpenMenu(openMenuItem) {
        const i = this.overlayContext.openMenuItems.indexOf(openMenuItem);
        if(i !== -1)
            this.overlayContext.openMenuItems.splice(i, 1);
    }

    closeAllMenus(butThese=[]) {
        this.setState({
            open: false,
            openOverlay: false,
            options: null
        });

        this.overlayContext.openMenuItems.forEach(openMenuItem => {
            if(butThese.indexOf(openMenuItem) !== -1)
                return;
            openMenuItem.closeDropDownMenu()
        });
        console.log("closeAllMenus", this.overlayContext.openMenuItems, butThese);
    }

    openMenu(options) {
        if(!this.props.isActive)
            return false;

        this.setState({
            open: true,
            openOverlay: true,
            options
        });
        return true;
    }

    openOverlay() {
        this.setState({
            openOverlay: true,
        });
        return true;
    }

    closeOverlay() {
        this.setState({
            openOverlay: false,
        });
        return true;
    }
}

export default MenuOverlayContainer;
