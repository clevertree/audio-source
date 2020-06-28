import React from "react";
import PropTypes from "prop-types";

import ASUIDropDownContainer from "../menu/dropdown/ASUIDropDownContainer";
import ASUIClickable from "./ASUIClickable";


export default class ASUIClickableDropDown extends ASUIClickable {

    // Default Properties
    static defaultProps = {
        arrow:          true,
        vertical:       false,
        // openOverlay:    false
    };

    // Property validation
    static propTypes = {
        options: PropTypes.any.isRequired,
    };


    constructor(props) {
        super(props);

            // onKeyDown: (e) => this.onKeyDown(e),
        this.cb.onMouseEnter = e => this.onMouseEnter(e);
        // this.cb.onMouseLeave = e => this.onMouseLeave(e);
        this.cb.onClose = () => this.closeDropDownMenu();
        this.dropdown = React.createRef();
        this.state = {
            open: false,
            stick: false
        }

        this.timeoutMouseLeave = null;
    }


    getClassName() {
        return 'asui-clickable-item dropdown';
    }

    renderChildren(props = {}) {
        let arrow = this.props.arrow === true ? (this.props.vertical ? '▼' : '►') : this.props.arrow;
        return [
            super.renderChildren(props),
            arrow ? <div className="arrow" key="arrow">{arrow}</div> : null,
            (this.state.open && !this.props.disabled ? <ASUIDropDownContainer
                key="dropdown"
                ref={this.dropdown}
                // disabled={this.props.disabled}
                options={this.props.options}
                vertical={this.props.vertical}
                onClose={this.cb.onClose}
                // openOverlay={this.props.openOverlay}
            /> : null)
        ];
    }

    /** Actions **/

    openDropDownMenu(onUpdated=null) {
        // console.log('ASUIClickableDropDown.openDropDownMenu')
        this.setState({open: true, stick: false}, onUpdated);
    }

    // stickDropDown() {
    //     this.setState({open: true, stick: true});
    // }

    closeDropDownMenu(onUpdated=null) {
        this.setState({open: false, stick: false}, onUpdated);
    }

    toggleMenu() {
        if (!this.state.open)
            this.openDropDownMenu();
            // else if (!this.state.stick)
        //     this.stickDropDown();
        else
            this.closeDropDownMenu();
    }


    /** DOM elements **/

    getOverlayContainerElm() {
        const thisElm = this.ref.container.current;
        let containerElm;
        for (containerElm = thisElm ; containerElm && containerElm !== document; containerElm = containerElm.parentNode ) {
            if(containerElm.classList.contains('asui-contextmenu-container'))
                break;
        }
        return containerElm;
    }

    closeAllDropDownElmsButThis() {
        const thisElm = this.ref.container.current;
        const openDropDownMenus = this.getOverlayContainerElm().querySelectorAll('.asui-clickable-item.dropdown.open')
        openDropDownMenus.forEach(openDropDownMenu => {
            if(openDropDownMenu === thisElm
                || openDropDownMenu.contains(thisElm))
                return;
            /** @var {ASUIMenuDropDown}**/ // TODO: switch menu to clickable or dropdown
            const dropdown = findReactElement(openDropDownMenu); // Ugly Hack
            dropdown.closeDropDownMenu();
        });
        // console.log('closeAllDropDownElmsButThis', openDropDownMenus);
    }


    /** Hover **/

    // TODO: move to ASUIDropDownContainer

    isHoverEnabled() {
        if(!this.getOverlay() || !this.getOverlay().isHoverEnabled())
            return false;
        const openDropDownMenus = this.getOverlayContainerElm().querySelectorAll('.asui-dropdown-container')
        // console.log('openDropDownMenus', openDropDownMenus);
        return openDropDownMenus.length > 0;
    }

    hoverDropDown() {
        // console.log('hoverDropDown', this.state.open === true, !this.isHoverEnabled())
        if(this.state.open === true || !this.isHoverEnabled())
            return;
        // this.getOverlay().closeAllMenus();
        this.openDropDownMenu( () => {
            this.closeAllDropDownElmsButThis();
        });
        // setTimeout(() => {
        //     const dropdown = this.dropdown.current;
        //     dropdown && dropdown.closeAllDropDownMenusButThis();
        // }, 100);
    }

    /** Actions **/

    doAction(e) {
        this.toggleMenu();
    }



    /** User Input **/

    onMouseEnter(e) {
        // TODO: close all opened that aren't hovered
        clearTimeout(this.timeoutMouseLeave);
        this.hoverDropDown();
        // TODO: *OR* keep track of 'leaving' state?
    }

    // onMouseLeave(e) {
    //     clearTimeout(this.timeoutMouseLeave);
    //     // this.closeDropDownMenu();
    //     // this.timeoutMouseLeave = setTimeout(() => this.closeDropDownMenu(), 100);
    // }



    // onKeyDown(e) {
    //     if(e.isDefaultPrevented())
    //         return;
    //     switch(e.key) {
    //         case ' ':
    //         case 'Enter':
    //             this.toggleMenu();
    //             break;
    //
    //         default:
    //             console.info("Unhandled key: ", e.key);
    //             break;
    //     }
    // }


}
function findReactElement(node) {
    for (var key in node) {
        if (key.startsWith("__reactInternalInstance$")) {
            return node[key]._debugOwner.stateNode;
        }
    }
    return null;
}
