import React from "react";
import PropTypes from 'prop-types';

import './assets/Menu.css';


class MenuItem extends React.Component {
    constructor(props) {
        super(props);
        this.onInputEventCallback = e => this.onInputEvent(e);
        this.state = {
            open: false,
            // stick: false,
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
        // if(this.state.stick)
        //     className += ' stick';

        // console.log('parent', this.props.parent);

        return (
            <div
                className={className}
                // onMouseLeave={this.onInputEventCallback}
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
        let className = 'asui-menuitem-dropdown';
        if(this.props.vertical)
            className += ' vertical';
        return (
            <div
                className={className}
                children={this.state.options}
            />
        );
    }


    onInputEvent(e) {
        switch (e.type) {
            case 'click':
                if(!e.isDefaultPrevented()) {
                    e.preventDefault();
                    this.doAction(e);
                }
                break;

            case 'mouseenter':
            case 'mouseover':
                clearTimeout(this.mouseTimeout);
                if(this.state.open !== true && this.props.openOnHover) {
                    this.mouseTimeout = setTimeout(te => {
                        // this.setState({open: true});
                        this.doAction({type: 'mouseenter'});
                    }, 100);
                }
                break;

            case 'mouseleave':
            case 'mouseout':
                clearTimeout(this.mouseTimeout);
                this.mouseTimeout = setTimeout(te => {
                    if (this.state.open) {
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
        if(typeof options === "function")
            options = options(this);

        options = reactMapRecursive(options, child => {
            return React.cloneElement(child, { parent: this })
        });
        // console.log('options', options);
        // console.log(e.type);
        if(MenuItem.openSubMenus.indexOf(this) === -1) {
            MenuItem.openSubMenus.push(this);
            console.info('MenuItem.openSubMenus', MenuItem.openSubMenus);
        }

        this.setState({
            open: true,
            // menuPath: e.menuPath.concat([this]),
            // stick: (e && e.type === 'click') || this.props.openOnHover ? true : this.state.stick,
            options
        });
    }



    closeDropDownMenu(e) {
        this.setState({
            open: false,
            // stick: false,
            options: null
        })
    }

    doAction(e) {
        if(this.props.disabled) {
            console.warn(this.constructor.name + " is disabled.", this);
            return;
        }

        if(this.props.onAction) {
            const result = this.props.onAction(e, this);
            if (result !== false)
                MenuItem.closeAllOpenSubMenus(e);

        } else if(this.props.options) {
            if(this.state.open) {
                this.closeDropDownMenu(e);
                return;
            }

            if(MenuItem.subMenuHandlers.length > 0) {
                for(let i=0; i<MenuItem.subMenuHandlers.length; i++) {
                    const subMenuHandler = MenuItem.subMenuHandlers[i];
                    const res = subMenuHandler(e, this.props.options);
                    if(res !== false) {
                        console.info("Sub-menu options were sent to menu handler: ", i, subMenuHandler);
                        return;
                    }
                    // console.info("Sub-menu options were skipped by menu handler(s): ", i);
                }
            }
            this.openDropDownMenu(e, this.props.options);
            this.closeOtherDropDownMenus(e);

        } else {
            throw new Error("Menu does not contain props 'onAction' or 'options'");
        }
    }

    closeOtherDropDownMenus(e) {
        const parents = [this];
        let target = this;
        while(target.props.parent) {
            parents.push(target.props.parent);
            target = target.props.parent;
        }

        MenuItem.closeAllOpenSubMenus(e, parents);
    }


    static openSubMenus = [];
    static closeAllOpenSubMenus(e, butThese=[]) {
        console.info('closeAllOpenSubMenus', butThese, MenuItem.openSubMenus);
        for(let i=MenuItem.openSubMenus.length-1; i>=0; i--) {
            const openSubMenu = MenuItem.openSubMenus[i];
            if(butThese.indexOf(openSubMenu) === -1) {
                console.info('closing ', openSubMenu.props.children);
                MenuItem.openSubMenus.splice(i, 1);
                openSubMenu.closeDropDownMenu();
            }
        }
    }

    static subMenuHandlers = [];
    static addGlobalSubMenuHandler(menuHandlerCallback) {
        MenuItem.subMenuHandlers.push(menuHandlerCallback);
        if(MenuItem.subMenuHandlers.length > 1)
            console.warn(MenuItem.subMenuHandlers.length + " menu handlers are registered");
        console.info(MenuItem.subMenuHandlers.length + " menu handlers are registered");
    }

    static removeGlobalSubMenuHandler(menuHandlerCallback) {
        let i = MenuItem.subMenuHandlers.indexOf(menuHandlerCallback);
        if(i !== -1)
            MenuItem.subMenuHandlers.splice(i, 1);
        // if(MenuItem.subMenuHandlers.length > 1)
        //     console.warn(MenuItem.subMenuHandlers.length + " menu handlers are registered");
        console.info(MenuItem.subMenuHandlers.length + " menu handlers are registered");
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
