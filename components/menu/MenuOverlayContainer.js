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
            closeMenus: (butThese=[]) => this.closeMenus(butThese),
            closeAllMenus: () => this.closeAllMenus(),
            isHoverEnabled: () => this.isHoverEnabled(),
            // openOverlay: () => this.openOverlay(),
            // closeOverlay: () => this.closeOverlay(),
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

    updateOverlay() {
        const openOverlay = this.state.open || this.overlayContext.openMenuItems.length > 0;
        if(this.state.openOverlay !== openOverlay)
            this.setState({openOverlay})
    }

    isHoverEnabled() {
        return this.overlayContext.openMenuItems.length > 0;
    }

    addOpenMenu(openMenuItem) {
        const i = this.overlayContext.openMenuItems.indexOf(openMenuItem);
        if(i === -1)
            this.overlayContext.openMenuItems.push(openMenuItem);
        console.log('this.overlayContext.openMenuItems', this.overlayContext.openMenuItems);
        this.updateOverlay();
    }

    removeOpenMenu(openMenuItem) {
        const i = this.overlayContext.openMenuItems.indexOf(openMenuItem);
        if(i !== -1)
            this.overlayContext.openMenuItems.splice(i, 1);
        this.updateOverlay();
    }

    closeMenus(butThese=[], stayOpenOnStick=true) {
        const openMenuItems = this.overlayContext.openMenuItems.slice();
        // this.overlayContext.openMenuItems = [];
        openMenuItems.forEach(openMenuItem => {
            if(butThese.indexOf(openMenuItem) !== -1)
                return;
            openMenuItem.closeDropDownMenu(stayOpenOnStick);
        });
        console.log("closeMenus", openMenuItems, butThese);
    }


    closeAllMenus() {
        this.closeMenus([], false);
        this.setState({
            open: false,
            openOverlay: false,
            options: null
        });
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

    // openOverlay() {
    //     this.setState({
    //         openOverlay: true,
    //     });
    //     return true;
    // }
    //
    // closeOverlay() {
    //     this.setState({
    //         openOverlay: false,
    //     });
    //     return true;
    // }
}

export default MenuOverlayContainer;
