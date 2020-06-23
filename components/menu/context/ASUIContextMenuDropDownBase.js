import React from "react";
import ASUIMenuContext from "../ASUIMenuContext";
import {ASUIMenuItem} from "../index";
import DropDownOptionProcessor from "../dropdown/DropDownOptionProcessor";
import ASUIMenuAction from "../item/ASUIMenuAction";
import ASUIMenuBreak from "../item/ASUIMenuBreak";
// import ASUIDropDownContainer from "../dropdown/ASUIDropDownContainer";

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
            options: null,
            optionsHistory: []
        };
        this.cb = {
            closeDropDown: e => this.closeDropDown(e),
            closeAllMenus: e => this.getOverlay().closeAllMenus(e),
            goBackMenu: () => this.goBackMenu(),
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
        // console.log('toggleOverlay', openOverlay);
        if(openOverlay === null)
            openOverlay = !this.state.openOverlay;
        if(this.state.openOverlay !== openOverlay)
            this.setState({openOverlay});
    }

    goBackMenu() {
        const optionsHistory = this.state.optionsHistory;
        optionsHistory.pop();
        const lastOptions = optionsHistory.length > 0 ? optionsHistory[optionsHistory.length - 1] : null;
        this.setState({optionsHistory});
        this.openMenu(lastOptions);
        console.log('goBackMenu', lastOptions, optionsHistory);
        return false;
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

    async openMenu(options) {
        // if(typeof options === "function")
        //     options = options(this);

        const optionsHistory = this.state.optionsHistory; // TODO: fix optionsHistory.pop();
        if(options)
            optionsHistory.push(options);

        if (typeof options === "function")
            options = options(this);
        if(options instanceof Promise) {
            this.setState({options: [<ASUIMenuItem>Loading...</ASUIMenuItem>]})
            options = await options;
        }
        if (!options)
            console.warn("Empty options returned by ", this);

        options = DropDownOptionProcessor.processArray(options);

        if(this.state.optionsHistory.length > 0) {
            options.push(
                <ASUIMenuBreak/>,
                <ASUIMenuAction onAction={this.cb.goBackMenu}>Go Back</ASUIMenuAction>
            )
        }
        options.push(
            <ASUIMenuBreak/>,
            <ASUIMenuAction onAction={this.cb.closeAllMenus}>- Close Menu -</ASUIMenuAction>
        )

        console.log('openMenu', options, optionsHistory);

        // Delay menu open
        this.setState({
            open: true,
            openOverlay: true,
            options,
            optionsHistory
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
