import React from "react";
import PropTypes from 'prop-types';

import './assets/Menu.css';
// import MenuContext from "./MenuContext";
import Div from "../div/Div";
import MenuOverlayContext from "./MenuOverlayContext";
// import MenuOverlayContainer from "./MenuOverlayContainer";


class MenuItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            stick: false,
            options: null,
            // menuPath: [this]
        };
        this.cb = {
            onClick: e => this.onClick(e),
            onMouseEnter: e => this.onMouseEnter(e),
            onMouseOut: e => this.onMouseOut(e),
            onKeyDown: e => this.onKeyDown(e),
        };
    }

    getClassName() { return 'asui-menuitem'; }

    render() {
        let className = this.getClassName();
        if(this.props.className)
            className += ' ' + this.props.className;
        if(this.props.disabled)
            className += ' disabled';
        if(this.state.stick)
            className += ' stick';

        // console.log('parent', this.props.parent);

        return (
            <Div
                className={className}
                onMouseLeave={this.cb.onMouseOut}
                onMouseEnter={this.cb.onMouseEnter}
            >
                <Div
                    className="title"
                    onClick={this.cb.onClick}
                    onKeyDown={this.cb.onKeyDown}
                    tabIndex={0}
                >
                    {this.props.children}
                    {this.props.arrow ? <div className="arrow">{this.props.arrow}</div> : null}
                </Div>

                {this.state.open ? this.renderOptions() : null}
            </Div>
        );
    }

    renderOptions() {
        let className = 'asui-menuitem-dropdown';
        if(this.props.vertical)
            className += ' vertical';
        return (
            // <MenuContext.Provider value={{
            //     parent: this,
                // closeMenuHandler: this.closeMenuHandler

            // }}>
                <Div
                    className={className}
                    children={this.state.options}
                    />
            // </MenuContext.Provider>)
            );
    }

    onClick(e) {
        if(!e.isDefaultPrevented()) {
            e.preventDefault();
            this.doAction(e);
        }
    }

    onMouseEnter(e) {
        clearTimeout(this.mouseTimeout);
        if(this.state.open !== true && this.props.openOnHover) {
            this.mouseTimeout = setTimeout(te => {
                // this.setState({open: true});
                this.doAction({type: 'mouseenter'});
            }, 100);
        }
    }

    onMouseOut(e) {
        clearTimeout(this.mouseTimeout);
        if(this.state.stick !== true && this.props.openOnHover) {
            this.mouseTimeout = setTimeout(te => {
                if (this.state.stick !== true) {
                    this.closeDropDownMenu();
                }
            }, 400);
        }
    }

    openDropDownMenu(options) {
        this.context && this.context.addOpenMenu(this);

        if(typeof options === "function")
            options = options(this);

        options = reactMapRecursive(options, child => {
            return React.cloneElement(child, { parentMenu: this })
        });

        this.setState({
            open: true,
            stick: false,
            options
        });

        this.closeAllDropDownMenus(this.getAncestorMenus());
    }

    getAncestorMenus() {
        let menus = [this];
        let parent = this;
        while(parent = parent.props.parentMenu) {
            menus.push(parent);
        }
        return menus;
    }

    closeDropDownMenu() {
        this.context && this.context.removeOpenMenu(this);

        this.setState({
            stick: false,
            open: false,
            options: null
        });
    }

    closeAllDropDownMenus(butThese=[]) {
        if(this.context.closeAllMenus)
            this.context.closeAllMenus(butThese);
    }

    openMenuOverlay() {
        this.context && this.context.openOverlay();
    }
    doAction(e) {
        if(this.props.disabled) {
            console.warn(this.constructor.name + " is disabled.", this);
            return;
        }

        if(this.props.onAction) {
            if(e.type !== 'click') {
                console.warn("Skipping onAction for type " + e.type);
                return;
            }
            const result = this.props.onAction(e, this);
            if (result !== false)
                this.closeAllDropDownMenus();

        } else if(this.props.options) {
            if(this.state.open) {
                if(!this.state.stick && e.type === 'click') {
                    this.setState({stick: true});
                    return;
                }
                this.closeDropDownMenu(e, false);
                return;
            }

            // Try open menu handler
            if(this.context && this.context.openMenu) {
                const res = this.context.openMenu(this.props.options);
                if(res !== false) {
                    console.info("Sub-menu options were sent to menu handler: ", this.context.openMenu);
                    return;
                }
            }

            // Open menu overlay
            this.openMenuOverlay();

            // TODO: close all but this? or auto close? no need for auto-close
            this.openDropDownMenu(this.props.options);

        } else {
            throw new Error("Menu does not contain props 'onAction' or 'options'");
        }
    }


}
MenuItem.contextType = MenuOverlayContext;


// creating default props
MenuItem.defaultProps = {
    arrow:          null, // '►',
    vertical:       false,
    openOnHover:    null,
    disabled:       false,
};

// validating prop types
MenuItem.propTypes = {
    onAction: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    vertical: PropTypes.bool,
};


class MenuItemHorizontal extends MenuItem {}
MenuItem.Horizontal = MenuItemHorizontal;

/** Default props **/
MenuItemHorizontal.defaultProps = {
    arrow:          '▼',
    vertical:       true,
    openOnHover:    true,
    disabled:       false,
};

MenuItemHorizontal.propTypes = MenuItem.propTypes;



export {
    MenuItem as default,
    MenuItem,
    MenuItemHorizontal
};


function reactMapRecursive(children, fn) {
    return React.Children.map(children, child => {
        if (!React.isValidElement(child)) {
            return child;
        }

        if (child.props.children) {
            child = React.cloneElement(child, {
                children: reactMapRecursive(child.props.children, fn)
            });
        }

        return fn(child);
    });
}
