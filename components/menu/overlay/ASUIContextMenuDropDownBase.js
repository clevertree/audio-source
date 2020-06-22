import React from "react";
import ASUIMenuContext from "../ASUIMenuContext";
import {ASUIMenuItem} from "../index";

export default class ASUIContextMenuDropDownBase extends React.Component {
    /** Menu Context **/
    static contextType = ASUIMenuContext;
    /** @return {ASUIContextMenuContainer} **/
    getOverlay() { return this.context.overlay; }
    /** @return {ASUIDropDownContainer} **/
    getParentDropdown() { return this.context.parentDropDown; }

    constructor(props) {
        super(props);
        this.state = {
            open: false,
            openOverlay: false,
            options: [<ASUIMenuItem>TEST</ASUIMenuItem>]
        };
        this.cb = {
            closeDropDown: e => this.closeDropDown(e),
            closeAllMenus: e => this.getOverlay().closeAllMenus(e),
        };
        this.ref = {
            dropdown: React.createRef()
        }
    }

    componentDidMount() {
        this.getOverlay().addCloseMenuCallback(this, this.cb.closeDropDown);

    }


    // eslint-disable-next-line react/require-render-return
    render() {
        throw new Error("Not implemented");
    }


    // getActiveMenuCount() {
    //     return this.openMenus.length;
    // }

    toggleOverlay(openOverlay=null) {
        console.log('toggleOverlay', openOverlay);
        if(openOverlay === null)
            openOverlay = !this.state.openOverlay;
        if(this.state.openOverlay !== openOverlay)
            this.setState({openOverlay});
    }






    /** Open/Close Menu **/

    closeDropDown() {
        // e && e.preventDefault();
        this.setState({
            open: false,
            openOverlay: false,
            options: null
        });
    }

    openMenu(options) {
        console.log('openMenu', options);
        // if(typeof options === "function")
        //     options = options(this);

        // Delay menu open
        this.setState({
            open: true,
            openOverlay: true,
            options
        })
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
