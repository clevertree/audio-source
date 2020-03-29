import React from "react";
import Div from "../div/Div";

import "./assets/MenuOverlayContainer.css";
import MenuOverlayContext from "./MenuOverlayContext";
import MenuBreak from "./MenuBreak";
import MenuAction from "./MenuAction";

class MenuOverlayContainer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false, // TODO: use MenUDropDown
            openOverlay: false
        };
        this.overlayContext = {
            openMenu: (options) => this.openMenu(options),
            closeMenus: (butThese=[]) => this.closeMenus(butThese),
            closeAllMenus: () => this.closeAllMenus(),
            isHoverEnabled: () => this.isHoverEnabled(),
            // openOverlay: () => this.openOverlay(),
            // closeOverlay: () => this.closeOverlay(),
            removeDropDownMenu: (openMenuItem) => this.removeDropDownMenu(openMenuItem),
            addDropDownMenu: (openMenuItem) => this.addDropDownMenu(openMenuItem),
            dropDownMenus: []
        };
    }
    // componentDidMount() {
    //     MenuDropDown.addGlobalSubMenuHandler(this.openMenuHandler)
    // }
    //
    // componentWillUnmount() {
    //     MenuDropDown.removeGlobalSubMenuHandler(this.openMenuHandler)
    // }

    render() {
        return <MenuOverlayContext.Provider
            value={this.overlayContext}>
            <>
                {this.state.openOverlay && false ? <Div className="asui-menu-overlay-container" // TODO: fix overlay z-index
                    onClick={this.overlayContext.closeAllMenus}
                    /> : null}

                {this.state.open ? <Div className="asui-menu-overlay-dropdown">
                    {typeof this.state.options === "function" ? this.state.options(this) : this.state.options}
                    <MenuBreak/>
                    <MenuAction onAction={() => this.closeAllMenus()}>- Close Menu -</MenuAction>
                </Div> : null}
                {this.props.children}
            </>
        </MenuOverlayContext.Provider>;
    }

    updateOverlay() {
        const openOverlay = this.state.open || this.overlayContext.dropDownMenus.length > 0;
        if(this.state.openOverlay !== openOverlay)
            this.setState({openOverlay})
    }

    isHoverEnabled() {
        return this.overlayContext.dropDownMenus.length > 0;
    }

    addDropDownMenu(openMenuItem) {
        const i = this.overlayContext.dropDownMenus.indexOf(openMenuItem);
        if(i === -1)
            this.overlayContext.dropDownMenus.push(openMenuItem);
        console.log('this.overlayContext.openMenuItems', this.overlayContext.dropDownMenus);
        this.updateOverlay();
    }

    removeDropDownMenu(openMenuItem) {
        const i = this.overlayContext.dropDownMenus.indexOf(openMenuItem);
        if(i !== -1)
            this.overlayContext.dropDownMenus.splice(i, 1);
        this.updateOverlay();
    }

    closeMenus(butThese=[], stayOpenOnStick=true) {
        const openMenuItems = this.overlayContext.dropDownMenus.slice();
        // this.overlayContext.openMenuItems = [];
        openMenuItems.forEach(openMenuItem => {
            if(butThese.indexOf(openMenuItem) !== -1)
                return;
            openMenuItem.closeMenu(stayOpenOnStick);
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
