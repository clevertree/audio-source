import React from "react";
import PropTypes from "prop-types";

import ASUIMenuContext from "../ASUIMenuContext";
import {ASUIClickable, ASUIMenuItem} from "../../";

import "./ASUIDropDownContainer.css";

export default class ASUIDropDownContainerBase extends React.Component {
    static contextType = ASUIMenuContext;

    // creating default props
    static defaultProps = {
        // arrow:          true,
        vertical:       false,
        openOverlay:    false,
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
        // this.deferredToOverlayMenu = false;
        this.state = {
            options: [<ASUIMenuItem>Empty</ASUIMenuItem>],
            offsetIndex: 0,
            positionSelected: this.props.positionSelected || null
        }
        this.cb = {
            onKeyDown: e => this.onKeyDown(e)
        }
    }

    /** Menu Context **/

    /** @return {ASUIMenuOverlayContainer} **/
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

    componentDidMount() {
        console.log('ASUIDropDownContainer.componentDidMount')

        const overlay = this.getOverlay();
        overlay.addCloseMenuCallback(this, this.props.onClose);

        // TODO: defer all to overlay if exists?

        // Try open menu handler
        const res = overlay.openMenu(this.props.options);
        if (res !== false) {
            this.setState({options: null})
//                 console.info("Sub-menu options were sent to menu handler: ", this.getOverlay().openMenu);

        } else {
            // Process dropdown options

            let options = this.props.options;
            if (typeof options === "function")
                options = options(this);
            if(options instanceof Promise) {
                options.then(options => this.setOptions(options));
                options = <ASUIMenuItem>Loading...</ASUIMenuItem>;
            }
            if (!options)
                console.warn("Empty options returned by ", this);

            this.setOptions(options);
        }
    }

    setOptions(options) {
        let newOptions = [];
        let positionSelected = this.state.positionSelected, currentPosition = 0;
        let i=0;
        recursiveMap(options, option => {
            if(positionSelected === null && option.props.selected)
                positionSelected = currentPosition;

            const props = {
                key: i,
                position: currentPosition
            }
            if(option.type.prototype instanceof ASUIClickable) {
                // props.position = currentPosition;
                // props.selected = () => {
                //     return this.state.positionSelected === currentPosition;
                // }
                currentPosition++;
                // if(!firstOptionProps)
                //     firstOptionProps = props;
            } else if(option.type === React.Fragment) {
                return;
            }

            newOptions.push(React.cloneElement(option, props));
            i++;
        })


        // if(positionSelected === null && firstOptionProps) {
        //     firstOptionProps.selected = true;
        // }

        console.log('newOptions', newOptions, options, positionSelected);
        // const newOptions = newOptions
        //     .map(([option, props]) => {
        //         React.cloneElement(option, props)
        //     })

        this.setState({
            options: newOptions,
            positionSelected: positionSelected || 0,
            positionCount: currentPosition
        })
    }

    render() {
        // if(!this.state.options)
        //     return null;
        return <ASUIMenuContext.Provider
            value={{overlay:this.getOverlay(), parentDropDown:this}}>
            {this.renderDropDownContainer(this.state.options)}
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

//     async openMenu() {
//         if (this.props.disabled)
//             return console.error("Menu is disabled");
//         // if (this.state.open)
//         //     throw new Error("Menu was already open");
//
//         // Try open menu handler
//         if(this.getOverlay()) {
//             const res = await this.getOverlay().openMenu(this.props.options);
//             if (res !== false) {
// //                 console.info("Sub-menu options were sent to menu handler: ", this.getOverlay().openMenu);
//                 return;
//             }
//
//             // setTimeout(() => {
//             //     this.getOverlay().closeMenus(this.getAncestorMenus());
//             // }, 100);
//         }
//
//         let options = this.props.options;
//         if (typeof options === "function")
//             options = options(this);
//         if(options instanceof Promise)
//             options = await options;
//         if (!options)
//             console.warn("Empty options returned by ", this);
//
//
//         this.setState({
//             // open: true,
//             options,
//             positionSelected
//         });
//     }

    // stickMenu() {
    //     if (!this.state.open)
    //         throw new Error("Unable to stick. Menu was not yet open");
    //
    //     this.getAncestorMenus().forEach(menu => {
    //         menu.setState({
    //             stick: true,
    //         });
    //     })
    // }

    closeMenu() {
        this.props.onClose()
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

    /** Input **/

    onKeyDown(e) {
        if(e.isDefaultPrevented())
            return;

        let positionSelected = this.state.positionSelected || 0;
        console.info("onKeyDown", e.key, e.target, this.state.positionSelected);
        switch(e.key) {

            case 'ArrowUp':
                e.preventDefault();
                positionSelected -= 1;
                if(positionSelected < 0)
                    positionSelected = this.state.positionCount-1;
                this.setState({positionSelected})
                break;

            case 'ArrowDown':
                e.preventDefault();
                positionSelected += 1;
                if(positionSelected >= this.state.positionCount)
                    positionSelected = 0;
                this.setState({positionSelected})
                break;

            case 'ArrowLeft':
            case 'ArrowRight':
                e.preventDefault();
                console.info("Unhandled key: ", e.key, e.target);
                break;

            default:
                console.info("Unhandled key: ", e.key, e.target);
                break;
        }
    }
}



function recursiveMap(children, fn) {
    return React.Children.map(children, child => {
        if (!React.isValidElement(child)) {
            return child;
        }

        if (child.props.children) {
            child = React.cloneElement(child, {
                children: recursiveMap(child.props.children, fn)
            });
        }

        return fn(child);
    });
}
