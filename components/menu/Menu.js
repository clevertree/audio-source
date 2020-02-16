import React from "react";
import './Menu.scss';

class Menu extends React.Component {

    constructor(props = {}) {
        super(props);
        this.state = {
            offset: 0,
            maxLength: 20,
            optionCount: 0,
            open: props.open || false,
            stick: false,
        };
    }

    connectedCallback() {
        super.connectedCallback();
        ['mouseover', 'mouseout', 'click', 'change', 'keydown']
            .forEach(eventName => this.addEventListener(eventName, this.onInputEvent));
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        ['mouseover', 'mouseout', 'click', 'change', 'keydown']
            .forEach(eventName => this.removeEventListener(eventName, this.onInputEvent));
    }

    getSubMenuChildren() {
        let subMenuChildren = this.props.subMenuChildren;
        if(typeof subMenuChildren === "function")
            subMenuChildren = subMenuChildren(this);
        return subMenuChildren;
    }

    render() {
        let arrow = false;
        if(this.props.subMenuChildren && typeof this.props.vertical === "undefined" && typeof this.props.arrow === "undefined")
            arrow = true;

        return (
            <div className="asui-menu">
                <div className="title">{this.props.children}</div>
                {arrow ? <div className="arrow">{this.props.vertical ? '▼' : '►'}</div> : null}
                {this.state.open ? <div className="dropdown">{this.getSubMenuChildren()}</div> : null}
            </div>
        )

        // return [
        //     Div.cE({
        //             onclick: e => this.doMenuAction(e),
        //             key: 'title',
        //             class: [this.state.stick ? 'stick' : '', this.props.disabled ? ' disabled' : ''].join(' ').trim()
        //         },
        //         this.getChildren(),
        //     ),
        //     arrow ? Div.createElement('arrow', this.props.vertical ? '▼' : '►') : null,
        //
        //     // ASUIDropDownMenu.cE({
        //     //         ref: ref => this.dropdown = ref,
        //     //         // open: this.state.open,
        //     //         children: this.props.subMenuChildren,
        //     //         key: 'dropdown',
        //     //         class: (this.props.vertical ? 'vertical' : ''),
        //     //     },
        //     // ),
        //     !this.state.open ? null : Div.cE({
        //         key: 'dropdown',
        //         class: (this.props.vertical ? 'vertical' : ''),
        //         onWheel: e => this.onInputEvent(e)
        //     }, this.getSubMenuChildren()),
        //     this.props.hasBreak ? Div.createElement('break') : null,
        // ];
    }




    // renderOptions(offset=0, length=20) {
    //     let i=0;
    //     const contentList = [];
    //     this.eachContent(this.props.dropDownContent, (content) => {
    //         if(i < offset);
    //         else if(contentList.length < length)
    //             contentList.push(content);
    //         i++;
    //     });
    //     if(offset > length) {
    //         this.eachContent(this.props.dropDownContent, (content) => {
    //             if (contentList.length < length)
    //                 contentList.push(content);
    //         });
    //     }
    //     if(offset + length < i) {
    //         const left = i - (offset + length);
    //         contentList.push(Menu.createElement({}, `${left} items left`))
    //     }
    //     // while(contentList.length < length && offset > contentList.length)
    //     //     contentList.push(Menu.createElement({}, '-'));
    //     this.state.optionCount = i;
    //     return contentList;
    // }

    toggleSubMenu() {

        // let parentMenu = this;
        // while(parentMenu) {
        //     parentMenu.setState({stick:open});
        //     parentMenu = parentMenu.parentNode.closest('asui-menu');
        // }
        const stick = !this.state.stick;
        this.setState({stick});

        let parentMenu = this;
        while((parentMenu.parentNode) && (parentMenu = parentMenu.parentNode.closest('asui-menu'))) {
            parentMenu.state.stick = stick;
            // parentMenu.setState({stick}); // Don't re-render parent
        }

        // this.state.stick = !this.state.stick;
        // if(!this.state.open || !isBrowser)
        //     this.state.open = this.state.stick;
        // this.state.open ? this.openSubmenu() : this.closeSubmenu();
    }

    closeSubmenu() {
        if(this.state.open !== false)
            this.setState({open: false});
    }

    openSubmenu() {
        if(this.state.open !== true)
            this.setState({open: true});
            // await this.dropdown.setContent(this.renderOptions(this.state.offset, this.state.maxLength));
        // this.closeAllMenusButThis();
    }

    doMenuAction(e) {
        console.log("Doing menu action: ", this);
        if (this.props.action) {
            this.props.action(e, this);
            this.closeAllMenus();
        // } else if(this.props.dropDownContent) {
        //     this.toggleSubMenu(e);
        } else {
            throw new Error("Menu has no action content: ", this);
        }
    }

    openContextMenu(e) {
        this.setProps({
            style: {
                left: e.clientX,
                top: e.clientY
            }
        });
        this.open();
    }

    // closeAllMenus(includeStickMenus=false) {
    //     if(isBrowser) {
    //         const root = this.getRootNode() || document;
    //         root.querySelectorAll(includeStickMenus ? 'asui-menu[open]:not([stick])' : 'asui-menu[open]')
    //             .forEach(menu => menu.close())
    //     } else {
    //         // console.warn("Unimplemented");
    //     }
    // }
    // closeAllMenusButThis() {
    //     if(isBrowser) {
    //
    //         const root = this.getRootNode() || document;
    //         root.querySelectorAll('asui-menu[open]:not([stick])')
    //             .forEach(menu => {
    //                 if(menu !== this
    //                     && !menu.contains(this)
    //                     && !this.contains(menu))
    //                     menu.close()
    //             });
    //
    //     } else {
    //         // console.warn("Unimplemented");
    //
    //     }
    // }

    onInputEvent(e, type=null) {
        type = type || e.type;
        // console.log(type, e);
        // const menuElm = e.target.closest('asui-menu');
        // if (this !== menuElm)
        //     return; // console.info("Ignoring submenu action", this, menuElm);

        switch (type) {
            case 'mouseover':
                clearTimeout(this.mouseTimeout);
                this.mouseTimeout = setTimeout(e => {
                    this.openSubmenu();
                }, 100);
                break;

            case 'mouseout':
                clearTimeout(this.mouseTimeout);
                this.mouseTimeout = setTimeout(e => {
                    if(!this.state.stick) {
                        this.closeSubmenu();
                    }
                }, 400);
                break;

            case 'click':
                if (e.defaultPrevented)
                    return;
                console.log(e.type, this);
                e.preventDefault();
                this.doMenuAction(e);
                break;

            case 'keydown':
                if (e.defaultPrevented)
                    return;
                e.preventDefault();

                const containerElm = this.containerElm;
                const selectedMenuElm = containerElm
                    .querySelector('asui-menu.selected') || containerElm.firstElementChild;
                if (!selectedMenuElm)
                    throw new Error("No selected menu item found");

                let keyEvent = e.key;
                switch (keyEvent) {
                    case 'Escape':
                    case 'Backspace':
                        this.closeMenu(e);
                        break;

                    case 'Enter':
                        if (selectedMenuElm.hasAction) {
                            selectedMenuElm.doAction(e);
                        } else if (selectedMenuElm.hasSubMenu) {
                            selectedMenuElm.toggleSubMenu(e);
                        } else {
                            return console.warn("Menu has no submenu or action: ", selectedMenuElm);
                        }

                        break;

                    // ctrlKey && metaKey skips a measure. shiftKey selects a range
                    case 'ArrowRight':
                        if (selectedMenuElm.hasSubMenu) {
                            selectedMenuElm.toggleSubMenu(e);
                        } else {
                            return console.warn("Menu has no submenu: ", selectedMenuElm);
                        }
                        break;

                    case 'ArrowLeft':
                        this.closeMenu(e);
                        break;

                    case 'ArrowDown':
                        this.selectNextSubMenuItem();
                        break;

                    case 'ArrowUp':
                        this.selectPreviousSubMenuItem();
                        break;

                    default:
                        console.log("Unknown key input: ", keyEvent);
                        break;

                }
                break;

            case 'wheel':
                if(e.defaultPrevented)
                    break;
                e.preventDefault();
                let offset = this.state.offset;
                if(e.deltaY < 0) offset--; else offset++;
                if(this.state.optionCount) {
                    if (offset > this.state.optionCount)
                        offset = 0;
                    else if (offset < 0)
                        offset = this.state.optionCount;
                }
                this.setState({offset});
//                     console.log(e);
                break;

            default:
                console.log("Unknown input event: ", e.type);
                break;
        }

        // if(target.classList.contains('open')) {
        //     target.dispatchEvent(new CustomEvent('open'));
        // } else {
        //     this.clearSubMenu();
        // }
    }


    // static createMenuElement(props, children, action=null, subMenuChildren=null) {
    //
    //     children = this.convertStringChildrenToComponent(children);
    //     return this.createElement(props, children, {
    //         action, subMenuChildren
    //     });
    // }
    // static cME(props, children=null, action=null, subMenuChildren=null) {
    //     return this.createMenuElement(props, children, action, subMenuChildren);
    // }
    //
    //
    // static createSubMenuElement(props, children, subMenuChildren) {
    //     return this.createMenuElement(props, children, (e, menu) => {
    //         e.preventDefault();
    //         menu.toggleSubMenu();
    //     }, subMenuChildren)
    // }
    // static cSME(props, children, subMenuChildren) {
    //     return this.createSubMenuElement(props, children, subMenuChildren);
    // }



    // static getStyleKeys() { return ['Menu.class']; }

}


// class MenuContainer extends React.Component {
//     constructor(props={}) {
//         super(props, {
//             open: false
//         });
//     }
//
//     render() {
//         return [
//             ASUITouchableHighlight.cE({
//                     key: 'menu-button',
//                     class: [this.state.open ? 'open' : ''].join(' ').trim()
//                 },
//                 Icon.cE('menu')
//             ),
//             this.state.open ? this.getChildren() : null,
//         ];
//     }
// }
//
// // if(isBrowser)
//     // customElements.define('asui-menu-container', MenuContainer);


/** Export this script **/
export default Menu;
