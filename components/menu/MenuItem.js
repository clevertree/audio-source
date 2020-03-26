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
            // onMouseOut: e => this.onMouseOut(e),
            onKeyDown: e => this.onKeyDown(e),
        };
    }

    componentWillUnmount() {
        this.context && this.context.removeOpenMenu(this);
    }

    getClassName() { return 'asui-menuitem'; }

    render() {
        let className = this.getClassName();
        if(this.props.className)
            className += ' ' + this.props.className;
        if(this.props.disabled)
            className += ' disabled';
        if(this.props.selected)
            className += ' selected';
        if(this.state.stick)
            className += ' stick';

        // console.log('parent', this.props.parent);

        return (
            <Div
                className={className}
                // onMouseLeave={this.cb.onMouseOut}
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
                <Div
                    className={className}
                    children={this.state.options}
                    />
            );
    }

    onClick(e) {
        this.doAction(e);
    }

    onMouseEnter(e) {
        if(!this.context || !this.context.isHoverEnabled())
            return;

        if(this.props.options && this.state.open !== true) {
            this.toggleDropDownMenu(e)
        }
    }

    setStick() {
        this.getAncestorMenus().forEach(menu => {
            menu.setState({stick: true});
        })
    }

    // onMouseOut(e) {
    //     clearTimeout(this.mouseTimeout);
    //     if(this.state.stick !== true && this.props.openOnHover) {
    //         this.mouseTimeout = setTimeout(te => {
    //             if (this.state.stick !== true) {
    //                 this.closeDropDownMenu();
    //             }
    //         }, 400);
    //     }
    // }

    toggleDropDownMenu(e) {

        if(e.type === 'click') {
            if(this.state.stick) {
                this.closeDropDownMenu();
                return;
            }
            if(this.state.open) {
                this.setStick();
                return;
            }
        }

        // Try open menu handler
        if(this.context && this.context.openMenu) {
            const res = this.context.openMenu(this.props.options);
            if(res !== false) {
                console.info("Sub-menu options were sent to menu handler: ", this.context.openMenu);
                return;
            }
        }

        this.openDropDownMenu();
    }

    openDropDownMenu() {
        this.context && this.context.addOpenMenu(this);

        let options = this.props.options;
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

        if(this.context.closeMenus)
            this.context.closeMenus(this.getAncestorMenus());
    }

    getAncestorMenus() {
        let menus = [];
        let parent = this;
        while(parent) {
            menus.push(parent);
            parent = parent.props.parentMenu;
        }
        return menus;
    }

    closeDropDownMenu(stayOpenOnStick=false) {
        if(this.state.stick && stayOpenOnStick === true) {
            console.warn("Ignoring close due to stick", this);
            return;
        }

        this.setState({
            stick: false,
            open: false,
            options: null
        });
        this.context && this.context.removeOpenMenu(this);
    }


    closeAllDropDownMenus() {
        if(this.context.closeAllMenus)
            this.context.closeAllMenus();
    }

    doAction(e) {
        if(this.props.disabled) {
            console.warn(this.constructor.name + " is disabled.", this);
            return;
        }

        if(this.props.onAction) {
            if(e.type !== 'click')
                throw new Error("Skipping onAction for type " + e.type);
            const result = this.props.onAction(e, this);
            if (result !== false)
                this.closeAllDropDownMenus();

        } else if(this.props.options) {
            this.toggleDropDownMenu(e)

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



export default MenuItem;


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
