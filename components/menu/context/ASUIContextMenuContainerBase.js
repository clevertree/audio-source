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
        return !this.props.portrait; //  && (this.state.openOverlay || this.openMenus.length > 0);
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

    openContextMenu(props, parentMenus = []) {
        console.log('ASUIContextMenuContainerBase.openContextMenu', props, parentMenus)
        // Delay menu open
        setTimeout(() => {
            if (this.props.portrait) {
                this.setState({
                    openMenus: [],
                    slidingMenu: props
                })
            } else {
                let openMenus = this.state.openMenus.filter(openMenu => {
                    if(openMenu.parentMenu) {
                        // TODO: check for ancestor
                        // for (let i = 0; i < parentMenus.length; i++) {
                        //     if (parentMenus[i] === openMenu.parentMenu) {
                        //         return true;
                        //     }
                        // }
                    }
                    return true;
                });
                openMenus = openMenus.concat(props);

                console.log('openMenus', openMenus);
                this.setState({
                    openMenus,
                    slidingMenu: null
                })

            }
        } , 1);


        //     this.ref.dropdown.current.openMenu(options)
        // return true;
    }

    /** @deprecated **/
    restoreActiveElementFocus() {
        // this.props.composer.focusActiveTrack();
    }
}
