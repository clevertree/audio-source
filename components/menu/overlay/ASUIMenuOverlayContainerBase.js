import React from "react";
import ASUIMenuContext from "../ASUIMenuContext";

export default class ASUIMenuOverlayContainerBase extends React.Component {
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

    renderContent() {
        throw new Error("Not implemented");
    }


    render() {
        return <ASUIMenuContext.Provider
            value={{overlay:this, parentDropDown:null}}>
            {this.renderContent()}
        </ASUIMenuContext.Provider>;
    }


    // getActiveMenuCount() {
    //     return this.openMenus.length;
    // }

    updateOverlay() {
        const openOverlay = this.state.open || this.openMenus.length > 0;
            // console.log('updateOverlay', openOverlay);
        if(this.state.openOverlay !== openOverlay)
            this.setState({openOverlay})
    }

    isHoverEnabled() {
        return !this.props.isActive && (this.state.openOverlay || this.openMenus.length > 0);
    }
    isOpen() {
        return this.state.open;
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
        console.log('closeMenus', butThese, this.openMenus);
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

    openOverlay() {
        if(this.state.openOverlay !== true)
            this.setState({openOverlay: true});
    }
    //
    // closeOverlay() {
    //     this.setState({
    //         openOverlay: false,
    //     });
    //     return true;
    // }
}
