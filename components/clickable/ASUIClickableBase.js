import React from "react";
import PropTypes from "prop-types";
import ASUIContextMenuContext from "../menu/context/ASUIContextMenuContext";

export default class ASUIClickable extends React.Component {
    /** Property validation **/
    static propTypes = {
        onAction: PropTypes.func.isRequired,
        disabled: PropTypes.bool,
    };

    constructor(props) {
        super(props);
        this.cb = {
            onMouseInput: e => this.onMouseInput(e),
            onMouseEnter: null,
            onKeyDown: e => this.onKeyDown(e),
            onMouseLeave: null,
        };
        this.ref = {
            container: React.createRef()
        }
    }


    renderChildren(props={}) {
        return this.props.children;
    }

    /** User Input **/

    onMouseInput(e) {
//         console.log(e.type);
        if(e.defaultPrevented)
            return;
        e.preventDefault();
        this.doAction(e);
    }


    onKeyDown(e) {
        if(e.isDefaultPrevented())
            return;
        switch(e.key) {
            case ' ':
            case 'Enter':
                e.preventDefault();
                this.doAction(e);
                break;

            case 'Tab':
                // e.preventDefault();
                // const tabIndexItem = this.getOverlay().getNextTabIndexItem(this, 1);
                // console.log('TODO tabIndexItem');
                break;

            // case 'ArrowLeft':
            // case 'ArrowUp':
            // case 'ArrowDown':
            // case 'ArrowRight':
            //     console.info("Unhandled key: ", e.key);
            //     e.preventDefault();
            //     break;

            default:
                console.info("Unhandled key: ", e.key);
                break;
        }
    }

    /** Actions **/

    doAction(e) {
        if(this.props.disabled) {
            console.warn(this.constructor.name + " is disabled.");
            return;
        }

        if(!this.props.onAction)
            throw new Error("Button does not contain props 'onAction'");
        const result = this.props.onAction(e, this);
        if (result !== false)
            this.closeAllOpenMenus();
        // else
        //     this.refreshParentMenu();
    }



    /** Hover **/


    isHoverEnabled() {
        return !(!this.getOverlay() || !this.getOverlay().isHoverEnabled());

        // const openDropDownMenus = this.getOverlayContainerElm().querySelectorAll('.asui-dropdown-container')
        // console.log('openDropDownMenus', openDropDownMenus);
        // return openDropDownMenus.length > 0;
    }

    hoverDropDown() {
        // if(!this.isHoverEnabled())
        //     return;

        // console.log('TODO:: closeAllDropDownElmsButThis', this);
        // let openMenus = this.getOverlay().closeDropDownMenus(menuPath);


        // this.closeAllDropDownElmsButThis();
    }


    /** Overlay Context **/
    static contextType = ASUIContextMenuContext;

    /** @return {ASUIContextMenuContainer} **/
    getOverlay() { return this.context.overlay; }
    getParentMenu() { return this.context.parentMenu; }

    closeAllOpenMenus() {
        const overlay = this.getOverlay();
        if(overlay) overlay.closeAllOpenMenus()
    }

    // refreshParentMenu() {
    //     const parentMenu = this.getParentMenu()
    //     if(parentMenu)
    //         parentMenu.refresh();
    //     console.log('parentMenu', parentMenu);
    // }

}
