import React from "react";
import "./assets/DropDownContainer.css";
import MenuOverlayContext from "./MenuOverlayContext";

class DropDownContainer extends React.Component {
    static contextType = MenuOverlayContext;
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            stick: false,
        };

    }

    getOverlay() { return this.context.overlay; }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(this.getOverlay()) {
            if (this.state.open)
                this.getOverlay().addCloseMenuCallback(this, this.closeMenu.bind(this));
            else
                this.getOverlay().removeCloseMenuCallback(this);
        }
    }

    componentWillUnmount() {
        if(this.getOverlay())
            this.getOverlay().removeCloseMenuCallback(this);
    }

    render() {
        if (!this.state.open)
            return null;

        let className = 'asui-menu-dropdown';
        if (this.props.vertical)
            className += ' vertical';

        let options = this.props.options;
        if (typeof options === "function")
            options = options(this);

        // options = reactMapRecursive(options, child => {
        //     return React.cloneElement(child, {parentMenu: this})
        // });

        return <MenuOverlayContext.Provider
            value={{overlay:this.getOverlay(), parentDropDown:this}}>
            <div
                className={className}
                children={options}
                />
        </MenuOverlayContext.Provider>

    }

    toggleMenu(e) {
        if (!this.state.open)
            this.openMenu(e);
        else if (!this.state.stick)
            this.stickMenu(e);
        else
            this.closeMenu(e);
    }

    openMenu(e) {
        // Try open menu handler
        if(this.getOverlay()) {
            if (e.type === 'click') {
                const res = this.getOverlay().openMenu(this.props.options);
                if (res !== false) {
                    console.info("Sub-menu options were sent to menu handler: ", this.getOverlay().openMenu);
                    return;
                }
            }

            if (e.type !== 'click') {
                if (!this.getOverlay().isHoverEnabled())
                    return;     // Ignore mouse hover

                if (this.state.open)
                    return;     // Ignore already open
            }
        }

        this.setState({
            open: true,
        });

        setTimeout(() => {
            this.getOverlay().closeMenus(this.getAncestorMenus());
        }, 100);
    }

    stickMenu(e) {
        if (!this.state.open)
            this.open();
        console.warn("TODO: stick is not styled");
        this.setState({
            stick: true,
        });
    }

    closeMenu(stayOpenOnStick = false) {
        if (this.state.stick && stayOpenOnStick === true) {
            console.warn("Ignoring close due to stick", this);
            return;
        }
        this.setState({
            open: false,
            stick: false,
            options: null
        })
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

export default DropDownContainer;

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
