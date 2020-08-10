import React from "react";

import ASUIContextMenuContext from "./ASUIContextMenuContext";

let menuIDCounter=0;
export default class ASUIContextMenu extends React.Component {

    constructor(props) {
        super(props);
        this.ref = null
    }

    /** Menu Context **/
    static contextType = ASUIContextMenuContext;

    /** @return {ASUIContextMenuContainer} **/
    getOverlay() { return this.context.overlay; }

    componentDidMount() {
        /** @return {ASUIMenuOptionList} **/
        const parentMenu = this.context.parentMenu;
        let menuPath = parentMenu ? parentMenu.props.menuPath : '';
        menuPath += (menuPath ? '-' : '' ) + menuIDCounter++;
        const props = Object.assign({
            menuPath,
            parentMenu
        }, this.props);
        this.getOverlay().openContextMenu(props);
    }

    render() {
        return null;
    }

}
