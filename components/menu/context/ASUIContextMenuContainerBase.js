import React from "react";
import ASUIContextMenuContext from "./ASUIContextMenuContext";
import ASUIMenuOptionList from "../options/ASUIMenuOptionList";

export default class ASUIContextMenuContainerBase extends React.Component {
    constructor(props) {
        super(props);
        this.openMenus =  [];
        this.state = {
            openMenus: [],
            slidingMenu: null
        }
        this.cb = {
            closeAllMenus: () => this.closeAllMenus(),
        }
        // this.ref = {
        //     openMenus: [],
        //     slidingMenu: null
        // }
    }

    renderContent() {
        throw new Error("Implement");
    }

    render() {
        return <ASUIContextMenuContext.Provider
            value={{overlay: this, parentMenu: null}}
            >
            {this.renderContent()}
        </ASUIContextMenuContext.Provider>;
    }


    toggleOverlay(openOverlay=null) {
        this.ref.dropdown.current.toggleOverlay(openOverlay);
    }

    isHoverEnabled() {
        return !this.props.portrait && this.state.openMenus.length > 0; //  && (this.state.openOverlay || this.openMenus.length > 0);
    }

    getOpenMenuCount() { return this.openMenus.length; }

    /** Open/Close Menu **/

    /** @deprecated **/
    addCloseMenuCallback(menuItem, closeMenuCallback) {
        if(typeof closeMenuCallback !== "function")
            throw new Error("Invalid menu close callback: " + typeof closeMenuCallback);
        const i = this.openMenus.findIndex(openMenu => openMenu[0] === menuItem);
        if(i === -1)
            this.openMenus.push([menuItem, closeMenuCallback]);
        // console.log('this.openMenus', this.openMenus);
    }

    closeAllMenuButtons() {
        const slidingMenu = this.state.slidingMenu;
        slidingMenu && slidingMenu.onClose && slidingMenu.onClose();
        this.state.openMenus.forEach(openMenu => {
            openMenu.onClose && openMenu.onClose();
            delete openMenu.onClose;
        });
    }

    closeAllMenus() {
        this.closeAllMenuButtons();
        this.setState({
            openMenus: [],
            slidingMenu: null
        })
    }

    openContextMenu(props) {
        // console.log('ASUIContextMenuContainer.openContextMenu', props)
        // Delay menu open
        setTimeout(() => {
            if (this.props.portrait) {
                this.openSlidingMenu(props);
            } else {
                this.addDropDownMenu(props)
            }
        } , 1);


        //     this.ref.dropdown.current.openMenu(options)
        // return true;
    }

    openSlidingMenu(props) {
        this.closeAllMenuButtons();
        this.setState({
            openMenus: [],
            slidingMenu: props
        })
    }

    addDropDownMenu(props) {
        const menuPath = props.menuPath;
        let openMenus = this.state.openMenus.filter(openMenu => {
            if(menuPath.startsWith(openMenu.menuPath))
                return true;
            // console.log('menuPath', menuPath, openMenu.menuPath, openMenu.onClose)
            openMenu.onClose && openMenu.onClose();
            return false;
        });
        openMenus = openMenus.concat(props);

        // console.log('openMenus', props.parentMenu, openMenus);
        this.setState({
            openMenus,
            slidingMenu: null
        })

    }

    /** @deprecated **/
    restoreActiveElementFocus() {
        // this.props.composer.focusActiveTrack();
    }


}


/**
 *
 * @param {ASUIMenuOptionList} menu
 * @returns {[]}
 */
function getParentMenus(menu) {
    const menus = [];
    while(menu) {
        menus.push(menu);
        menu = menu.getParentMenu()
    }
    return menus;
}
