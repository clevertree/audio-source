import React from "react";
import MenuOverlayContext from "./MenuOverlayContext";
import PropTypes from "prop-types";

export default class MenuDropDown extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            stick: false,
            options: null
        };

        this.cb = {
            onClick: (e) => this.toggleMenu(),
            onKeyDown: (e) => this.onKeyDown(e),
            onMouseEnter: e => this.onMouseEnter(e),
        }
    }

    componentWillUnmount() {
        this.context && this.context.removeDropDownMenu(this);
    }
    componentDidMount() {
        this.context && this.context.addDropDownMenu(this);
    }

    renderTitle() {
        let className = 'asui-menu-item';
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
            </div>
        )
    }

    render() {
        if(!this.props.open)
            return this.renderTitle();

        let options = null;
        if(!this.props.open)
            return null;

        let className = 'asui-menu-dropdown';
        if(this.props.vertical)
            className += ' vertical';

        options = this.props.options;
        if(typeof options === "function")
            options = options(this);

        options = reactMapRecursive(options, child => {
            return React.cloneElement(child, { parentMenu: this })
        });

        return (
            <>
                {this.renderTitle()}
                <div
                    className={className}
                    children={options}
                />
            </>
        );

    }

    onMouseEnter() {
        if(!this.context || !this.context.isHoverEnabled())
            return;

        if(this.props.options && this.state.open !== true) {
            this.toggleMenu()
        }
    }

    toggleMenu() {
        if(!this.state.open)
            this.openMenu();
        else if(!this.state.stick)
            this.stickMenu();
        else
            this.closeMenu();
    }

    openMenu() {
        this.setState({
            open: true,
        });

        if(this.context.closeMenus)
            this.context.closeMenus(this.getAncestorMenus());
    }

    stickMenu() {
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
