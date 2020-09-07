import React from "react";
import ASUIContextMenuContext from "./ASUIContextMenuContext";
import ASUIMenuOptionList from "../options/ASUIMenuOptionList";
import {ASUIMenuAction} from "../../index";

export default class ASUIContextMenuContainerBase extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            openMenus: [],
            slidingMenu: null,
            menuHistory: []
        }
        this.cb = {
            closeAllOpenMenus: () => this.closeAllOpenMenus(),
            goBackSliderMenu: () => this.goBackSliderMenu()
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

    renderSlidingMenu() {
        if(!this.state.slidingMenu)
            return null;
        const menuHistory = this.state.menuHistory || [];
        return <>
            {menuHistory.length > 0 ? <ASUIMenuAction onAction={this.cb.goBackSliderMenu}>Go Back</ASUIMenuAction> : null}
            <ASUIMenuOptionList
                // ref={this.ref.slidingMenu = React.createRef()}
                {...this.state.slidingMenu}
                floating={false}
            />
            <ASUIMenuAction onAction={this.cb.closeAllOpenMenus}>Close</ASUIMenuAction>
        </>
    }

    // toggleOverlay(openOverlay=null) {
    //     this.ref.dropdown.current.toggleOverlay(openOverlay);
    // }

    isHoverEnabled() {
        return !this.props.portrait && this.state.openMenus.length > 0; //  && (this.state.openOverlay || this.openMenus.length > 0);
    }

    // getOpenMenuCount() { return this.state.openMenus.length; }

    /** Actions **/

    goBackSliderMenu() {
        const menuHistory = this.state.menuHistory || [];
        if(menuHistory.length > 0) {
            const lastMenu = menuHistory.pop();
            // setTimeout(() => {
                this.setState({
                    openMenus: [],
                    slidingMenu: lastMenu,
                    menuHistory
                })
            //
            // }, 100)
        }
        return false;
    }

    /** Open/Close Menu **/


    // closeAllMenuButtons() {
    //     const slidingMenu = this.state.slidingMenu;
    //     slidingMenu && slidingMenu.onClose && slidingMenu.onClose();
    //     this.state.openMenus.forEach(openMenu => {
    //         openMenu.onClose && openMenu.onClose();
    //         delete openMenu.onClose;
    //     });
    // }

    refreshAllMenus() {
        this.forceUpdate();
    }

    closeAllOpenMenus() {
        this.closeDropDownMenus();
        this.closeSlidingMenu();
        this.setState({
            openMenus: [],
            slidingMenu: null,
            menuHistory: []
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
        const menuHistory = this.state.menuHistory || [];
        if(this.state.slidingMenu) {
            menuHistory.push(this.state.slidingMenu);
            props.onClose = this.state.slidingMenu.onClose; // Hack?
        }
        delete props.vertical;
        // this.closeAllMenuButtons();
        this.setState({
            openMenus: [],
            slidingMenu: props,
            menuHistory
        })
    }

    closeSlidingMenu() {
        if(this.state.slidingMenu) {
            const onClose = this.state.slidingMenu.onClose;
            onClose && onClose();
        }
    }
    closeDropDownMenus(exceptMenuPath=null) {
        return this.state.openMenus.filter(openMenu => {
            if(exceptMenuPath && exceptMenuPath.startsWith(openMenu.menuPath))
                return true;
            // console.log('menuPath', menuPath, openMenu.menuPath, openMenu.onClose)
            openMenu.onClose && openMenu.onClose();
            return false;
        });

    }

    addDropDownMenu(props) {
        const menuPath = props.menuPath;
        let openMenus = this.closeDropDownMenus(menuPath);
        openMenus = openMenus.concat(props);

        // console.log('openMenus', props.parentMenu, openMenus);
        this.setState({
            openMenus,
            slidingMenu: null,
            menuHistory: []
        })

    }

    /** @deprecated **/
    restoreActiveElementFocus() {
        // this.props.composer.focusActiveTrack();
    }


}
