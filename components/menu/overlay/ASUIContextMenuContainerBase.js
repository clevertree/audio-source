import React from "react";
import ASUIMenuContext from "../ASUIMenuContext";

export default class ASUIContextMenuContainerBase extends React.Component {
    constructor(props) {
        super(props);
        this.openMenus =  [];
        this.ref = {
            dropdown: React.createRef()
        }
    }

    renderContent() {
        throw new Error("Implement");
    }

    render() {
        return <ASUIMenuContext.Provider
            value={{overlay:this, parentDropDown:null}}>
            {this.renderContent()}
        </ASUIMenuContext.Provider>;
    }

    updateOverlay() {
        const openOverlay = this.openMenus.length > 0;
        // console.log('updateOverlay', openOverlay);
        this.ref.dropdown.current.toggleOverlay(openOverlay);
    }

    // getActiveMenuCount() {
    //     return this.openMenus.length;
    // }

    toggleOverlay(openOverlay=null) {
        this.ref.dropdown.current.toggleOverlay(openOverlay);
    }

    isHoverEnabled() {
        return false; // !this.props.isActive; //  && (this.state.openOverlay || this.openMenus.length > 0);
    }
    isOpen() {
        return this.state.open;
    }

    /** Open/Close Menu **/

    addCloseMenuCallback(menuItem, closeMenuCallback) {
        if(typeof closeMenuCallback !== "function")
            throw new Error("Invalid menu close callback: " + typeof closeMenuCallback);
        const i = this.openMenus.findIndex(openMenu => openMenu[0] === menuItem);
        if(i === -1)
            this.openMenus.push([menuItem, closeMenuCallback]);
        // console.log('this.openMenus', this.openMenus);
        // setTimeout(() => this.updateOverlay(), 10); // TODO: ugly?
    }

    removeCloseMenuCallback(menuItem) {
        const i = this.openMenus.findIndex(openMenu => openMenu[0] === menuItem);
        if(i !== -1)
            this.openMenus.splice(i, 1);
        // this.updateOverlay();
    }


    closeMenus(butThese=[], stayOpenOnStick=true) {
        // console.log('closeMenus', butThese, this.openMenus);
        // this.overlayContext.openMenuItems = [];
        this.openMenus.forEach(openMenu => {
            const [menuItem, closeMenuCallback] = openMenu;
            if(butThese.indexOf(menuItem) !== -1)
                return;
            closeMenuCallback(stayOpenOnStick);
        });
        // this.updateOverlay();
    }


    closeAllMenus() {
        // e && e.preventDefault();
        this.closeMenus([]);
        // this.setState({
        //     open: false,
        //     openOverlay: false,
        //     options: null
        // });
    }

    openMenu(options) {
        if(!this.props.isActive)
            return false;

        if(typeof options === "function")
            options = options(this);

        // Delay menu open
        setTimeout(() =>
            this.ref.dropdown.current.openMenu(options)
            , 1);
        return true;
    }

    //
    // closeOverlay() {
    //     this.setState({
    //         openOverlay: false,
    //     });
    //     return true;
    // }
}
