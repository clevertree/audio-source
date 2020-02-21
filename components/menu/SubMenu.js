import React from "react";
import PropTypes from 'prop-types';

import './assets/Menu.scss';
import MenuBreak from "./MenuBreak";
import AbstractMenu from "./AbstractMenu";

const activeSubMenus = [];
class SubMenu extends AbstractMenu {

    constructor(props = {}) {
        super(props);
        this.state = {
            open: props.open || false,
            stick: false,
        };
    }

    componentDidMount() {
        activeSubMenus.push(this);
    }
    componentWillUnmount() {
        for(let i=activeSubMenus.length-1; i>=0; i--) {
            if(activeSubMenus[i] === this)
                activeSubMenus.splice(i, 1);
        }
    }


    render() {
        let className = 'asui-menu submenu';
        if(this.state.stick)
            className += ' stick';
        if(this.props.disabled)
            className += ' disabled';
        if(this.props.className)
            className += ' ' + this.props.className;

        let mouseProps = {};
        if(this.props.openOnHover !== false)
            mouseProps = {
                onMouseOver: e => this.onInputEvent(e),
            };

// console.log('SubMenu.render', this.props);

        return (
            <div
                key={this.props.key}
                className={className}
                onMouseOut={e => this.onInputEvent(e)}
                {...mouseProps}
                >
                <div
                    className="container"
                    onClick={e => this.onInputEvent(e)}
                    onKeyDown={e => this.onInputEvent(e)}
                    tabIndex={0}
                    >
                    <div
                        className="title"
                        children={this.props.children}
                    />
                    {this.props.arrow ? <div className="arrow">{this.props.arrow}</div> : null}
                </div>
                {this.state.open ? this.renderDropdownContent() : null}
            </div>

        )
    }

    renderDropdownContent() {
        let children = this.props.options;
        if(typeof children === "function")
            children = children(this);

        let className = 'dropdown';
        if(this.props.vertical)
            className += ' vertical';
        // console.log('subMenuChildren', subMenuChildren);
        return <div className={className} children={children} />;
    }


    closeAllMenus() {
        activeSubMenus.forEach(activeMenu => activeMenu.closeMenu());
    }



    toggleMenu() {
        if(!this.state.open) {
            this.setState({open: true});

        } else {
            const stick = !this.state.stick;
            this.setState({stick, open:stick});
        }
    }

    closeMenu() {
        if(this.state.open !== false)
            this.setState({open: false});
    }

    openMenu() {
        if(this.state.open !== true)
            this.setState({open: true});
            // await this.dropdown.setContent(this.renderOptions(this.state.offset, this.state.maxLength));
        // this.closeAllMenusButThis();
    }


    doMenuAction(e) {
        if(this.props.disabled) {
            console.warn("SubMenu is disabled.", this);
            return;
        }
        this.toggleMenu();
    }

    openContextMenu(e) {
        this.setProps({
            style: {
                left: e.clientX,
                top: e.clientY
            }
        });
        this.openMenu();
    }
    onInputEvent(e) {

        switch (e.type) {
            case 'mouseover':
                if(this.props.openOnHover !== false) {
                    clearTimeout(this.mouseTimeout);
                    this.mouseTimeout = setTimeout(e => {
                        this.openMenu();
                    }, 100);
                }
                break;

            case 'mouseout':
                clearTimeout(this.mouseTimeout);
                this.mouseTimeout = setTimeout(e => {
                    if(!this.state.stick) {
                        this.closeMenu();
                    }
                }, 400);
                break;

            case 'click':
                if (e.defaultPrevented)
                    return;
                // console.log(e.type, this);
                e.preventDefault();
                this.doMenuAction(e);
                break;

            case 'keydown':

                let keyEvent = e.key;
                switch (keyEvent) {
                    case 'Escape':
                    case 'Backspace':
                        this.closeMenu(e);
                        break;

                    case 'Enter':
                        this.doMenuAction(e);
                        break;

                    // ctrlKey && metaKey skips a measure. shiftKey selects a range
                    case 'ArrowRight':
                        if(!this.props.vertical)
                            this.openMenu();
                        this.selectNextTabItem(e);
                        break;

                    case 'ArrowLeft':
                        if(!this.props.vertical)
                            this.closeMenu(e);
                        this.selectPreviousTabItem(e);
                        break;

                    case 'ArrowDown':
                        if(this.props.vertical)
                            this.openMenu();
                        this.selectNextTabItem(e);
                        break;

                    case 'ArrowUp':
                        if(this.props.vertical)
                            this.closeMenu(e);
                        this.selectPreviousTabItem(e);
                        break;

                    default:
                        console.log("Unknown key input: ", keyEvent);
                        break;

                }
                break;

            default:
                console.log("Unknown input event: ", e.type);
                break;
        }
    }
}


/** Default props **/
SubMenu.defaultProps = {
    arrow:          '►',
    vertical:       false,
    openOnHover:    true,
    disabled:       false,
};

/** Validate props **/
SubMenu.propTypes = {
    options: PropTypes.any.isRequired,
    disabled: PropTypes.bool,
    vertical: PropTypes.bool,
    openOnHover: PropTypes.bool,
};





class SubMenuHorizontal extends SubMenu {}
SubMenu.Horizontal = SubMenuHorizontal;

/** Default props **/
SubMenuHorizontal.defaultProps = {
    arrow:          '▼',
    vertical:       true,
    openOnHover:    true,
    disabled:       false,
};





class SubMenuButton extends SubMenu {}


/** Default props **/
SubMenuButton.defaultProps = {
    vertical:       true,
    openOnHover:    false,
    disabled:       false,
};





SubMenu.Break = MenuBreak;


/** Export this script **/
export {
    SubMenu as default,
    SubMenu,
    SubMenuHorizontal,
    SubMenuButton
};
