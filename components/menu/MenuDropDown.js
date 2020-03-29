import React from "react";
import MenuOverlayContext from "./MenuOverlayContext";
import PropTypes from "prop-types";

import "./assets/Menu.css";
import "./assets/MenuDropDown.css";

export default class MenuDropDown extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            stick: false,
            options: null
        };

        this.cb = {
            onClick: (e) => this.onClick(e),
            onKeyDown: (e) => this.onKeyDown(e),
            onMouseEnter: e => this.onMouseEnter(e),
        }
    }

    componentWillUnmount() {
        this.context && this.context.removeDropDownMenu(this);
    }
    componentDidMount() {
        this.context && this.context.addDropDownMenu(this); // TODO: use setState callback or componentDidUpdate
    }

    getClassName() { return 'asui-menu-item'; }

    render() {
        let className = this.getClassName(); // 'asui-menu-item';
        if(this.props.className)
            className += ' ' + this.props.className;
        if(this.props.disabled)
            className += ' disabled';
        if(this.props.selected)
            className += ' selected';

        let arrow = this.props.arrow === true ? (this.props.vertical ? '▼' : '►') : this.props.arrow;
        return (
            <div
                className={className}
                onClick={this.cb.onClick}
                onKeyDown={this.cb.onKeyDown}
                onMouseEnter={this.cb.onMouseEnter}
                tabIndex={0}
            >
                {this.props.children}
                {arrow ? <div className="arrow">{arrow}</div> : null}
                {this.renderDropDown()}
            </div>
        )
    }

    renderDropDown() {
        if(!this.state.open)
            return null;

        let className = 'asui-menu-dropdown';
        if(this.props.vertical)
            className += ' vertical';

        let options = this.props.options;
        if(typeof options === "function")
            options = options(this);

        options = reactMapRecursive(options, child => {
            return React.cloneElement(child, { parentMenu: this })
        });

        return <div
                className={className}
                children={options}
                />;

    }


    closeAllDropDownMenus() {
        if(this.context.closeAllMenus)
            this.context.closeAllMenus();
    }

    onClick(e) {
        this.toggleMenu(e);
    }

    onMouseEnter(e) {
        if(!this.context || !this.context.isHoverEnabled())
            return;

        if(this.props.options && this.state.open !== true) {
            this.openMenu(e)
        }
    }

    toggleMenu(e) {
        if(!this.state.open)
            this.openMenu(e);
        else if(!this.state.stick)
            this.stickMenu(e);
        else
            this.closeMenu(e);
    }

    openMenu(e) {
        // Try open menu handler
        if(e.type === 'click' && this.context && this.context.openMenu) {
            const res = this.context.openMenu(this.props.options);
            if(res !== false) {
                console.info("Sub-menu options were sent to menu handler: ", this.context.openMenu);
                return;
            }
        }

        this.setState({
            open: true,
        });

        if(this.context) {
            setTimeout(() => {
                this.context.closeMenus(this.getAncestorMenus());
            }, 100);
        }
    }

    stickMenu(e) {
        if(!this.state.open)
            this.open();
        this.setState({
            stick: true,
        });
    }

    closeMenu(stayOpenOnStick=false) {
        if(this.state.stick && stayOpenOnStick === true) {
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
        while(parent) {
            menus.push(parent);
            parent = parent.props.parentMenu;
        }
        return menus;
    }
}


MenuDropDown.contextType = MenuOverlayContext;


// creating default props
MenuDropDown.defaultProps = {
    arrow:          true,
    vertical:       false,
    // openOnHover:    null,
    // disabled:       false,
};

// validating prop types
MenuDropDown.propTypes = {
    options: PropTypes.any.isRequired,
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
