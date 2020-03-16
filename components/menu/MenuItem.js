import React from "react";
import PropTypes from 'prop-types';

import './assets/Menu.css';
import MenuContext from "./MenuContext";
import Div from "../div/Div";


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
        // this.openMenuHandler = (e, options) => this.openDropDownMenu(e, options);
        this.closeMenuHandler = (e) => this.closeDropDownMenu(e, true);
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
                onMouseLeave={this.onInputEventCallback}
                onMouseEnter={this.onInputEventCallback}
                >
                <Div
                    className="title"
                    onClick={this.onInputEventCallback}
                    onKeyDown={this.onInputEventCallback}
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
            <MenuContext.Provider value={{
                // parent: this,
                closeMenuHandler: this.closeMenuHandler

            }}>
                <Div
                    className={className}
                    children={this.state.options}
                    />
            </MenuContext.Provider>)
            ;
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
                if(this.state.stick !== true && this.props.openOnHover) {
                    this.mouseTimeout = setTimeout(te => {
                        if (this.state.stick !== true) {
                            this.closeDropDownMenu();
                        }
                    }, 400);
                }
                break;

            default:
                console.log("Unknown input event: ", e.type);
                break;
        }
    }

    openDropDownMenu(e, options) {
        if(typeof options === "function")
            options = options(this);

        this.setState({
            open: true,
            stick: false,
            options
        });
    }



    closeDropDownMenu(e, closeParent=false) {
        this.setState({
            stick: false,
            open: false,
            options: null
        });
        if(closeParent && this.context.closeMenuHandler)
            this.context.closeMenuHandler(e);
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
                this.closeDropDownMenu(e, true);

        } else if(this.props.options) {
            if(this.state.open) {
                if(!this.state.stick && e.type === 'click') {
                    this.setState({stick: true});
                    return;
                }
                this.closeDropDownMenu(e, false);
                return;
            }
            let openMenuHandler=this.context.openMenuHandler;
            if(openMenuHandler) {
                const res = openMenuHandler(e, this.props.options);
                if(res !== false) {
                    console.info("Sub-menu options were sent to menu handler: ", openMenuHandler);
                    return;
                }
            }

            // TODO: close other menus?
            this.openDropDownMenu(e, this.props.options);

        } else {
            throw new Error("Menu does not contain props 'onAction' or 'options'");
        }
    }


}
MenuItem.contextType = MenuContext;


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
