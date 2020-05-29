import React from "react";
import PropTypes from "prop-types";

import ASUIMenuContext from "../ASUIMenuContext";

import "./ASUIDropDownContainer.css";

class ASUIDropDownContainer extends React.Component {
    static contextType = ASUIMenuContext;

    // creating default props
    static defaultProps = {
        // arrow:          true,
        vertical:       false,
        // openOnHover:    null,
        // disabled:       false,
    };

    // validating prop types
    static propTypes = {
        onClose: PropTypes.func.isRequired,
        vertical: PropTypes.bool,
        disabled: PropTypes.bool,
    };

    constructor(props) {
        super(props);
        // this.state = {
        //     open: false,
        //     stick: false,
        // };
        this.divRef = React.createRef();
        this.deferredToOverlayMenu = false;
        this.state = {
            options: null
        }
    }

    /** Menu Context **/

    getOverlay() { return this.context.overlay; }

    // componentDidUpdate(prevProps, prevState, snapshot) {
    //     console.log('componentDidUpdate', this.state);
    //     if(this.getOverlay()) {
    //         // if (this.state.open)
    //             this.getOverlay().addCloseMenuCallback(this, this.closeMenu.bind(this));
    //         // else
    //         //     this.getOverlay().removeCloseMenuCallback(this);
    //     }
    //     this.updateScreenPosition();
    // }

    componentWillUnmount() {
        if(this.getOverlay())
            this.getOverlay().removeCloseMenuCallback(this);
    }

    render() {
        // if (!this.state.open)
        //     return null;

        let className = 'asui-menu-dropdown';
        if (this.props.vertical)
            className += ' vertical';
        // if(this.props.disabled)
        //     return 'Disabled';

        const overlay = this.getOverlay();

        // Open Menu Overlay
        // overlay.openOverlay();
        // if(overlay.isOpen())
        //     return null;

        if(this.deferredToOverlayMenu)
            return null;

        this.getOverlay().addCloseMenuCallback(this, this.closeMenu.bind(this));

        // Try open menu handler
        const res = overlay.openMenu(this.props.options);
        if (res !== false) {
            this.deferredToOverlayMenu = true;
//                 console.info("Sub-menu options were sent to menu handler: ", this.getOverlay().openMenu);
            return null;
        }



        let options = this.state.options || this.props.options;
        if (typeof options === "function")
            options = options(this);
        if(options instanceof Promise) {
            options.then(options => this.setState({options}));
            options = "Loading...";
        }
        if (!options)
            console.warn("Empty options returned by ", this);


        return <ASUIMenuContext.Provider
            value={{overlay:this.getOverlay(), parentDropDown:this}}>
            <div
                className={className}
                children={options}
                ref={this.divRef}
                />
        </ASUIMenuContext.Provider>

    }

    // hoverMenu() {
    //     if(this.state.open === true || !this.getOverlay() || !this.getOverlay().isHoverEnabled())
    //         return;
    //     this.openMenu();
    // }

    // toggleMenu() {
    //     if (!this.state.open)
    //         this.openMenu();
    //     else if (!this.state.stick)
    //         this.stickMenu();
    //     else
    //         this.closeMenu();
    // }

    async openMenu() {
        if (this.props.disabled)
            return console.error("Menu is disabled");
        if (this.state.open)
            throw new Error("Menu was already open");

        // Try open menu handler
        if(this.getOverlay()) {
            const res = await this.getOverlay().openMenu(this.props.options);
            if (res !== false) {
//                 console.info("Sub-menu options were sent to menu handler: ", this.getOverlay().openMenu);
                return;
            }

            // setTimeout(() => {
            //     this.getOverlay().closeMenus(this.getAncestorMenus());
            // }, 100);
        }

        let options = this.props.options;
        if (typeof options === "function")
            options = options(this);
        if(options instanceof Promise)
            options = await options;
        if (!options)
            console.warn("Empty options returned by ", this);

        this.setState({
            open: true,
            options
        });
    }

    stickMenu() {
        if (!this.state.open)
            throw new Error("Unable to stick. Menu was not yet open");

        this.getAncestorMenus().forEach(menu => {
            menu.setState({
                stick: true,
            });
        })
    }

    closeMenu(stayOpenOnStick = false) {
        this.props.onClose()
        // if (this.state.stick && stayOpenOnStick === true) {
        //  //  console.warn("Ignoring close due to stick", this);
            // return;
        // }
        // this.setState({
        //     open: false,
        //     stick: false,
        //     options: null
        // })
    }

    getAncestorMenus() {
        let menus = [];
        let parent = this;
        while (parent) {
            menus.push(parent);
            parent = parent.context.parentDropDown;
        }
        return menus;
    }


    closeAllDropDownMenus() {
        if(this.getOverlay())
            this.getOverlay().closeAllMenus();
    }

    closeAllDropDownMenusButThis() {
        if(this.getOverlay())
            this.getOverlay().closeMenus(this.getAncestorMenus());

    }

    updateScreenPosition() {
        if(!this.divRef.current)
            return;
        const div = this.divRef.current;
        const rect = div.getBoundingClientRect();
        if(rect.right > window.innerWidth)
            div.classList.add('overflow-right');
        if(rect.bottom > window.innerHeight)
            div.classList.add('overflow-bottom');
        // console.log(rect.right, window.innerWidth, rect.bottom, window.innerHeight)
    }
}

// class DropDownContextWrapper extends React.Component {
//     static contextType = DropDownContext;
//
//     render() {
//         return <DropDownContext.Provider value={this}>
//             <DropDownContainer
//                 parentDropDown={this.context}
//                 {...this.props}
//                 />
//         </DropDownContext.Provider>;
//     }
// }

export default ASUIDropDownContainer;

// function reactMapRecursive(children, fn) {
//     return React.Children.map(children, child => {
//         if (!React.isValidElement(child)) {
//             return child;
//         }
//
//         if (child.props.children) {
//             child = React.cloneElement(child, {
//                 children: reactMapRecursive(child.props.children, fn)
//             });
//         }
//
//         return fn(child);
//     });
// }
