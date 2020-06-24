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


    toggleOverlay(openOverlay=null) {
        this.ref.dropdown.current.toggleOverlay(openOverlay);
    }

    isHoverEnabled() {
        return !this.props.isActive; //  && (this.state.openOverlay || this.openMenus.length > 0);
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
        // setTimeout(() => this.updateOverlay(), 10); // TODO: ugly?
    }

    removeCloseMenuCallback(menuItem) {
        const i = this.openMenus.findIndex(openMenu => openMenu[0] === menuItem);
        if(i !== -1)
            this.openMenus.splice(i, 1);
        // this.updateOverlay();
    }


    closeAllMenus() {
        // console.log('closeAllMenus', document.activeElement)
        // e && e.preventDefault();
        const menuCount = this.getOpenMenuCount();
        this.openMenus.forEach(openMenu => {
            const [menuItem, closeMenuCallback] = openMenu;
            closeMenuCallback();
        });
        this.openMenus = [];
        if(menuCount > 0)
            this.restoreActiveElementFocus();
        // this.setState({
        //     open: false,
        //     openOverlay: false,
        //     options: null
        // });
    }

    openMenu(options) {
        if(!this.props.isActive)
            return false;

        // if(typeof options === "function")
        //     options = options(this);

        // Delay menu open
        setTimeout(() =>
            this.ref.dropdown.current.openMenu(options)
            , 1);
        return true;
    }

    restoreActiveElementFocus() {
        this.props.composer.focusActiveTrack();
    }

    //
    // closeOverlay() {
    //     this.setState({
    //         openOverlay: false,
    //     });
    //     return true;
    // }
}
