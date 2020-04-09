import React from "react";
import Div from "../div/Div";

import "./assets/MenuOverlayContainer.css";
import MenuContext from "./MenuContext";
import MenuBreak from "./MenuBreak";
import MenuAction from "./MenuAction";

class MenuOverlayContainer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            openOverlay: false
        };
        this.cb = {
            closeAllMenus: () => this.closeAllMenus(),
        };
        this.openMenus =  [];
        this.updateOverlayTimeout = null;
    }
    // componentDidMount() {
    //     MenuDropDown.addGlobalSubMenuHandler(this.openMenuHandler)
    // }
    //
    // componentWillUnmount() {
    //     MenuDropDown.removeGlobalSubMenuHandler(this.openMenuHandler)
    // }

    render() {
        return <MenuContext.Provider
            value={{overlay:this, parentDropDown:null}}>
            <>
                {this.state.openOverlay ? <Div className="asui-menu-overlay-container"
                    onClick={this.cb.closeAllMenus}
                    /> : null}

                {this.state.open ? <Div className="asui-menu-overlay-dropdown">
                    {this.state.options}
                    <MenuBreak/>
                    <MenuAction onAction={this.cb.closeAllMenus}>- Close Menu -</MenuAction>
                </Div> : null}
                {this.props.children}
            </>
        </MenuContext.Provider>;
    }

    // getActiveMenuCount() {
    //     return this.openMenus.length;
    // }

    updateOverlay() {
        const openOverlay = this.state.open || this.openMenus.length > 0;
//             console.log('updateOverlay', openOverlay);
        if(this.state.openOverlay !== openOverlay)
            this.setState({openOverlay})
    }

    isHoverEnabled() {
        return !this.props.isActive && (this.state.openOverlay || this.openMenus.length > 0);
    }

    addCloseMenuCallback(menuItem, closeMenuCallback) {
        const i = this.openMenus.findIndex(openMenu => openMenu[0] === menuItem);
        if(i === -1)
            this.openMenus.push([menuItem, closeMenuCallback]);
        // console.log('this.openMenus', this.openMenus);
        this.updateOverlay();
    }

    removeCloseMenuCallback(menuItem) {
        const i = this.openMenus.findIndex(openMenu => openMenu[0] === menuItem);
        if(i !== -1)
            this.openMenus.splice(i, 1);
        // this.updateOverlay();
    }


    closeMenus(butThese=[], stayOpenOnStick=true) {
        // console.log('closeMenus', butThese, stayOpenOnStick);
        // this.overlayContext.openMenuItems = [];
        this.openMenus.forEach(openMenu => {
            const [menuItem, closeMenuCallback] = openMenu;
            if(butThese.indexOf(menuItem) !== -1)
                return;
            closeMenuCallback(stayOpenOnStick);
        });
        // this.updateOverlay();
    }


    closeAllMenus(e) {
        this.closeMenus(e, []);
        this.setState({
            open: false,
            openOverlay: false,
            options: null
        });
    }

    openMenu(options) {
        if(!this.props.isActive)
            return false;

        if(typeof options === "function")
            options = options(this);

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
