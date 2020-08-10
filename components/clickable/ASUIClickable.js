import React from "react";
import ASUIClickableBase from "./ASUIClickableBase";
import "./ASUIClickable.css";

export default class ASUIClickable extends ASUIClickableBase {

    constructor(props) {
        super(props);
        this.cb.onMouseEnter = e => this.onMouseEnter(e);
        this.timeoutMouseLeave = null;
    }

    // shouldComponentUpdate(nextProps, nextState, nextContext) {
    //     return nextProps.children !== this.props.children;
    // }

    getClassName() { return 'asui-clickable'; }

    render() {
        // console.log(this.constructor.name + '.render()', this.props);
        let className = this.getClassName();
        if(this.props.className)
            className += ' ' + this.props.className;
        if(this.props.disabled)
            className += ' disabled';
        if(this.props.selected)
            className += ' selected';
        if(this.props.loading)
            className += ' loading';
        if(this.state && this.state.open)
            className += ' open';

        return (
            <div
                title={this.props.title}
                className={className}
                onClick={this.cb.onMouseInput}
                onKeyDown={this.cb.onKeyDown}
                onMouseEnter={this.cb.onMouseEnter}
                onMouseLeave={this.cb.onMouseLeave}
                // tabIndex={0}
                ref={this.ref.container}
            >
                {this.renderChildren()}
            </div>
        );
    }

    renderChildren(props={}) {
        return this.props.children;
    }

    /** User Input **/

    onMouseEnter(e) {
        clearTimeout(this.timeoutMouseLeave);
        this.hoverDropDown(e);
    }



    /** Hover **/


    isHoverEnabled() {
        return !(!this.getOverlay() || !this.getOverlay().isHoverEnabled());

        // const openDropDownMenus = this.getOverlayContainerElm().querySelectorAll('.asui-dropdown-container')
        // console.log('openDropDownMenus', openDropDownMenus);
        // return openDropDownMenus.length > 0;
    }

    hoverDropDown() {
        if(!this.isHoverEnabled())
            return;
        this.closeAllDropDownElmsButThis();
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
        const openDropDownMenus = this.getOverlayContainerElm().querySelectorAll('.asui-clickable.dropdown.open')
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
}

function findReactElement(node) {
    for (var key in node) {
        if (key.startsWith("__reactInternalInstance$")) {
            return node[key]._debugOwner.stateNode;
        }
    }
    return null;
}
