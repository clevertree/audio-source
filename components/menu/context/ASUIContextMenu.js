import React from "react";

import ASUIContextMenuContext from "./ASUIContextMenuContext";

export default class ASUIContextMenu extends React.Component {

    constructor(props) {
        super(props);
        this.ref = null
    }

    /** Menu Context **/
    static contextType = ASUIContextMenuContext;

    /** @return {ASUIContextMenuContainer} **/
    getOverlay() { return this.context.overlay; }

    /** @return {ASUIMenuOptionList} **/
    getParentMenu() { return this.context.parentMenu; }
    getParentMenus() {
        const menus = [];
        let menu = this.getParentMenu();
        while(menu) {
            menus.push(menu);
            menu = menu.getParentMenu()
        }
        return menus;
    }

    componentDidMount() {
        // this.getOverlay().openContextMenu(this.props);
    }

    render() {
        return <div
            ref={ref => {
                console.log('ref', ref);
                if(ref && !this.ref) {
                    const {x, y} = ref.getBoundingClientRect();
                    this.getOverlay().openContextMenu(this.props, this.getParentMenus(), [x, y]);
                    this.ref = ref;
                }
            }}
        />;
    }

}
