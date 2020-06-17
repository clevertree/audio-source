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
            closeAllMenus: e => this.closeAllMenus(e),
        };
        this.openMenus =  [];
        this.tabIndices = [];
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
    openOverlay() {
        if(this.state.openOverlay !== true)
            this.setState({openOverlay: true});
    }

    isHoverEnabled() {
        return !this.props.isActive && (this.state.openOverlay || this.openMenus.length > 0);
    }
    isOpen() {
        return this.state.open;
    }


    /** Tab Index Items **/

    // getTabIndexCount() { return this.tabIndices.length; }

    getNextTabIndexItem(tabIndexItem, count=1) {
        let tabIndex = this.getTabIndex(tabIndexItem);
        tabIndex += count;
        if(tabIndex >= this.tabIndices.length)
            tabIndex = 0;
        if(tabIndex < 0 )
            tabIndex = this.tabIndices - 1;
        return this.tabIndices[tabIndex];
    }

    getTabIndex(tabIndexItem) {
        return this.tabIndices.findIndex(item => item === tabIndexItem);
    }

    getTabIndexItem(tabIndex) {
        if(!this.tabIndices[tabIndex])
            throw new Error("Tab Index not found: " + tabIndex);
        return this.tabIndices[tabIndex];
    }

    addTabIndexItem(tabIndexItem) {
        const i = this.getTabIndex(tabIndexItem);
        if(i === -1)
            this.tabIndices.push(tabIndexItem);
    }

    removeTabIndexItem(tabIndexItem) {
        const i = this.getTabIndex(tabIndexItem);
        if(i !== -1)
            this.tabIndices.splice(i, 1);
    }



    /** Open/Close Menu **/

    addCloseMenuCallback(menuItem, closeMenuCallback) {
        const i = this.openMenus.findIndex(openMenu => openMenu[0] === menuItem);
        if(i === -1)
            this.openMenus.push([menuItem, closeMenuCallback]);
        // console.log('this.openMenus', this.openMenus);
        setTimeout(() => this.updateOverlay(), 10); // TODO: ugly?
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

        // Delay menu open
        setTimeout(() =>
            this.setState({
                open: true,
                openOverlay: true,
                options
            })
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
