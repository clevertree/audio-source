import React from "react";
import './assets/Menu.scss';

const activeMenus = [];
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

    componentDidMount() {
        activeMenus.push(this);
    }
    componentWillUnmount() {
        for(let i=activeMenus.length-1; i>=0; i--) {
            if(activeMenus[i] === this)
                activeMenus.splice(i, 1);
        }
    }

    closeAllMenus() {
        // const root = (this.getRootNode ? this.getRootNode() : null) || document;
        // root.querySelectorAll(includeStickMenus ? 'asui-menu[open]:not([stick])' : 'asui-menu[open]')
        //     .forEach(menu => menu.close())
        // console.log('activeMenus', activeMenus);
        for(let i=0; i<activeMenus.length; i++) {
            if(activeMenus[i].state.open === true)
                activeMenus[i].close();
        }
    }

    renderDropdownContent() {
        let subMenuChildren = this.props.options;
        if(typeof subMenuChildren === "function")
            subMenuChildren = subMenuChildren(this);
        let className = 'dropdown';
        if(this.props.vertical)
            className += ' vertical';
        // console.log('subMenuChildren', subMenuChildren);
        return <div className={className} children={subMenuChildren} />;
    }

    render() {
        let arrow = this.props.arrow;
        if(this.props.options && typeof this.props.vertical === "undefined" && typeof this.props.arrow === "undefined")
            arrow = true;

        let className = 'asui-menu';
        if(this.state.stick)
            className += ' stick';
        if(this.props.hasBreak)
            className += ' break';
        if(this.props.disabled)
            className += ' disabled';
        if(this.props.className)
            className += ' ' + this.props.className;

        return (
            <div
                key={this.props.key}
                className={className}
                onMouseOver={e => this.onInputEvent(e)}
                onMouseOut={e => this.onInputEvent(e)}
                >
                <div
                    className="title"
                    children={this.props.children}
                    onClick={e => this.onInputEvent(e)}
                    onKeyDown={e => this.onInputEvent(e)}
                    />
                {arrow ? <div className="arrow">{this.props.vertical ? '▼' : '►'}</div> : null}
                {this.state.open ? this.renderDropdownContent() : null}
            </div>
        )
    }


    onInputEvent(e, type=null) {
        type = type || e.type;
        // console.log(type, e);

        switch (type) {
            case 'mouseover':
                clearTimeout(this.mouseTimeout);
                this.mouseTimeout = setTimeout(e => {
                    this.open();
                }, 100);
                break;

            case 'mouseout':
                clearTimeout(this.mouseTimeout);
                this.mouseTimeout = setTimeout(e => {
                    if(!this.state.stick) {
                        this.close();
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
        const stick = !this.state.stick;
        this.setState({stick});

        let parentMenu = this;
        while((parentMenu.parentNode) && (parentMenu = parentMenu.parentNode.closest('asui-menu'))) {
            parentMenu.state.stick = stick;
        }
    }

    close() {
        if(this.state.open !== false)
            this.setState({open: false});
    }


    open() {
        if(this.state.open !== true)
            this.setState({open: true});
            // await this.dropdown.setContent(this.renderOptions(this.state.offset, this.state.maxLength));
        // this.closeAllMenusButThis();
    }

    doMenuAction(e) {
        if(this.props.disabled) {
            console.warn("Menu is disabled.", this);
            return;
        }
        console.log("Doing menu action: ", this);
        if (this.props.onAction) {
            const result = this.props.onAction(e, this);
            if(result !== false)
                this.closeAllMenus(e.target);
        // } else if(this.props.dropDownContent) {
        //     this.toggleSubMenu(e);
        } else {
            this.toggleSubMenu();
            // throw new Error("Menu has no action content: ", this);
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

class MenuBreak extends React.Component {
    render() {
        return (
            <hr className="asui-menu-break"/>
        );
    }
}

Menu.Break = MenuBreak;

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
