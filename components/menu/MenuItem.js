import React from "react";
import PropTypes from 'prop-types';

import './assets/Menu.css';
import MenuManager from "./MenuManager";


class MenuItem extends React.Component {
    constructor(props) {
        super(props);
        this.onInputEventCallback = e => this.onInputEvent(e);
        this.state = {
            open: false,
            stick: false,
            options: null,
            // menuPath: [this]
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

        return (
            <div
                className={className}
                onMouseLeave={this.onInputEventCallback}
                onMouseEnter={this.onInputEventCallback}
                >
                <div
                    className="title"
                    onClick={this.onInputEventCallback}
                    onKeyDown={this.onInputEventCallback}
                    tabIndex={0}
                    >
                    {this.props.children}
                    {this.props.arrow ? <div className="arrow">{this.props.arrow}</div> : null}
                </div>

                {this.state.open ? this.renderOptions() : null}
            </div>
        );
    }

    renderOptions() {
        let options = this.state.options;
        if(typeof options === "function")
            options = options(this);
        let className = 'asui-menuitem-dropdown';
        if(this.props.vertical)
            className += ' vertical';
        return (
            <div
                className={className}
                children={options}
            />
        );
    }


    onInputEvent(e) {
        switch (e.type) {
            case 'click':
                if(!e.isDefaultPrevented()) {
                    e.preventDefault();
                    this.doAction(e.type);
                }
                break;

            case 'mouseenter':
            case 'mouseover':
                clearTimeout(this.mouseTimeout);
                if(this.state.open !== true && this.props.openOnHover) {
                    this.mouseTimeout = setTimeout(te => {
                        this.setState({open: true});
                        this.doAction('mouseenter');
                    }, 100);
                }
                break;

            case 'mouseleave':
            case 'mouseout':
                clearTimeout(this.mouseTimeout);
                this.mouseTimeout = setTimeout(te => {
                    if (!this.state.stick && this.state.open) {
                        this.closeDropDownMenu();
                    }
                }, 400);
                break;

            default:
                console.log("Unknown input event: ", e.type);
                break;
        }
    }

    openDropDownMenu(e, options) {
        console.log(e.type);
        this.setState({
            open: true,
            // menuPath: e.menuPath.concat([this]),
            stick: e && e.type === 'click' && this.state.open ? !this.state.stick : this.state.stick,
            options
        })
    }

    closeDropDownMenu(e) {
        this.setState({
            open: false,
            stick: false,
            options: null
        })
    }

    doAction(type='click') {
        if(this.props.disabled) {
            console.warn(this.constructor.name + " is disabled.", this);
            return;
        }
        // e.menu = this;
        const menuEvent = {
            // type: e.type,
            type: type,
            // menuPath:   this.state.menuPath,                 // Add button to the menu path
            // openMenu:   (e, options) => this.openDropDownMenu(e, options),   // Set next menu callback
            // closeMenu:  (e) => this.closeDropDownMenu(e)
        };
        if(this.props.onAction) {
            const result = this.props.onAction(menuEvent, this);
            if (result !== false)
                MenuManager.closeAllMenus(menuEvent);

        } else if(this.props.options) {
            if(MenuItem.subMenuHandlers.length > 0) {
                console.info("Sending sub-menu options to menu handler: ", MenuItem.subMenuHandlers.length);
                MenuItem.subMenuHandlers.forEach(menuHandler => menuHandler(menuEvent, this.props.options))

            } else {
                this.openDropDownMenu(menuEvent, this.props.options);
            }

        } else {
            throw new Error("Menu does not contain props 'onAction' or 'options'");
        }
    }


    static subMenuHandlers = [];
    static addGlobalSubMenuHandler(menuHandlerCallback) {
        MenuItem.subMenuHandlers.push(menuHandlerCallback);
        if(MenuItem.subMenuHandlers.length > 1)
            console.warn(MenuItem.subMenuHandlers.length + " menu handlers are registered");
    }

    static removeGlobalSubMenuHandler(menuHandlerCallback) {
        let i = MenuItem.subMenuHandlers.indexOf(menuHandlerCallback);
        if(i !== -1)
            MenuItem.subMenuHandlers.splice(i, 1);
        if(MenuItem.subMenuHandlers.length > 1)
            console.warn(MenuItem.subMenuHandlers.length + " menu handlers are registered");
    }

}


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
