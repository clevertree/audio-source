import React from "react";
import ASUIDropDownContext from "./ASUIDropDownContext";

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
        return <ASUIDropDownContext.Provider
            value={{overlay:this, parentDropDown:null}}>
            {this.renderContent()}
        </ASUIDropDownContext.Provider>;
    }


    toggleOverlay(openOverlay=null) {
        this.ref.dropdown.current.toggleOverlay(openOverlay);
    }

    isHoverEnabled() {
        return !this.props.portrait; //  && (this.state.openOverlay || this.openMenus.length > 0);
    }

    getOpenMenuCount() { return this.openMenus.length; }

    /** Open/Close Menu **/

    addCloseMenuCallback(menuItem, closeMenuCallback) {
        if(typeof closeMenuCallback !== "function")
            throw new Error("Invalid menu close callback: " + typeof closeMenuCallback);
        const i = this.openMenus.findIndex(openMenu => openMenu[0] === menuItem);
        if(i === -1)
            this.openMenus.push([menuItem, closeMenuCallback]);
        // console.log('this.openMenus', this.openMenus);
    }

    removeCloseMenuCallback(menuItem) {
        const i = this.openMenus.findIndex(openMenu => openMenu[0] === menuItem);
        if(i !== -1)
            this.openMenus.splice(i, 1);
    }


    closeAllMenus() {
        // console.log('closeAllMenus', document.activeElement)
        const menuCount = this.getOpenMenuCount();
        this.openMenus.forEach(openMenu => {
            // eslint-disable-next-line no-unused-vars
            const [menuItem, closeMenuCallback] = openMenu;
            closeMenuCallback();
        });
        this.openMenus = [];
        if(menuCount > 0)
            this.restoreActiveElementFocus();
    }

    openMenu(options) {
        // if(!this.props.portrait)
        //     return false;


        // Delay menu open
        setTimeout(() =>
            this.ref.dropdown.current.openMenu(options)
            , 1);
        return true;
    }

    /** @deprecated **/
    restoreActiveElementFocus() {
        // this.props.composer.focusActiveTrack();
    }
}
