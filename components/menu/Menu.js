import React from "react";
import PropTypes from 'prop-types';

import './assets/Menu.css';
import MenuManager from "./MenuManager";


class Menu extends React.Component {
    constructor(props) {
        super(props);
        this.onInputEventCallback = e => this.onInputEvent(e);
        this.state = {
            open: false,
            stick: false,
            options: null,
            menuPath: [this]
        };
    }

    getClassName() { return 'asui-menu'; }

    render() {
        let className = this.getClassName();
        if(this.props.className)
            className += ' ' + this.props.className;
        if(this.state.stick)
            className += ' stick';

        const eventProps = this.getEventProps();

        return (
            <div className={className} {...eventProps}>
                <div className="title">{this.props.children}</div>
                {this.props.arrow ? <div className="arrow">{this.props.arrow}</div> : null}
                {this.state.open ? this.renderOptions() : null}
            </div>
        );
    }

    renderOptions() {
        let className = 'asui-menu-dropdown';
        if(this.props.vertical)
            className += ' vertical';
        return (
            <div
                className={className}
                children={this.state.options}
            />
        );
    }

    getEventProps() {
        return {
            onClick: this.onInputEventCallback,
            onKeyDown: this.onInputEventCallback,
            onMouseLeave: this.onInputEventCallback,
        };
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
                if(this.state.open !== true) {
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
            menuPath: e.menuPath.concat([this]),
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
        if(!this.props.onAction)
            throw new Error("prop onAction is missing");
        // e.menu = this;
        const buttonAction = {
            // type: e.type,
            type: type,
            menuPath:   this.state.menuPath,                 // Add button to the menu path
            openMenu:   (e, options) => this.openDropDownMenu(e, options),   // Set next menu callback
            closeMenu:  (e) => this.closeDropDownMenu(e)
        };
        const result = this.props.onAction(buttonAction, this);
        if(result !== false)
            MenuManager.closeAllMenus(buttonAction);
    }

}


// creating default props
Menu.defaultProps = {
    arrow:          null, // '►',
    vertical:       false,
    openOnHover:    false,
    disabled:       false,
};

// validating prop types
Menu.propTypes = {
    onAction: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    vertical: PropTypes.bool,
    openOnHover: PropTypes.bool,
};


class MenuHorizontal extends Menu {}
Menu.Horizontal = MenuHorizontal;

/** Default props **/
MenuHorizontal.defaultProps = {
    arrow:          '▼',
    vertical:       true,
    openOnHover:    true,
    disabled:       false,
};

MenuHorizontal.propTypes = Menu.propTypes;



export {
    Menu as default,
    Menu,
    MenuHorizontal
};
